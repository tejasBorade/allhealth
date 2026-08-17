import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { CHAT_TOOLS, runTool, type ChatLink } from "@/lib/chat/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_HISTORY = 20;
const MAX_TOOL_ITERATIONS = 6;

const SYSTEM_PROMPT = `You are the FriendlyHealthy patient assistant, available inside the patient's own \
account. You can search for doctors, book or cancel the patient's own appointments, and list/link the \
patient's own prescriptions, lab reports, visit reports, and billing status — always via your tools, never \
from memory or assumption, since the tools reflect the real, current database.

Rules:
- Always call a tool to look up real data before stating facts about doctors, appointments, prescriptions, \
reports, or billing. Never invent an id, date, amount, or link.
- When booking, confirm the doctor and exact date/time back to the patient before calling book_appointment if \
either was ambiguous; if the slot turns out to be taken, tell them plainly and suggest trying another time.
- Billing entries never have a downloadable invoice — if asked, say so plainly instead of implying one exists.
- You are not a medical professional and must never diagnose, prescribe, or give clinical advice — redirect \
those questions to booking an appointment with a doctor.
- Keep replies short and conversational. Any links you want the patient to see are surfaced separately by the \
app itself (from your tool calls) — don't paste raw URLs into your reply text.
- Reply in plain conversational text only — no markdown (no **bold**, no bullet/numbered lists, no headings). \
This is a chat bubble, not a rendered document, so markdown syntax would show up as literal asterisks/hashes.`;

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "patient") {
    return NextResponse.json({ error: "This assistant is only available to patients." }, { status: 403 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI chat isn't configured yet." }, { status: 503 });
  }

  let body: { messages?: IncomingMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const history = Array.isArray(body.messages) ? body.messages.slice(-MAX_HISTORY) : [];
  const last = history[history.length - 1];
  if (!last || last.role !== "user" || typeof last.content !== "string" || !last.content.trim()) {
    return NextResponse.json({ error: "Expected a trailing user message." }, { status: 400 });
  }

  const client = new Groq({ apiKey });
  const model = process.env.CHAT_MODEL || "openai/gpt-oss-120b";

  const conversation: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m): Groq.Chat.ChatCompletionMessageParam => ({ role: m.role, content: m.content })),
  ];
  const links: ChatLink[] = [];

  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await client.chat.completions.create({
        model,
        max_completion_tokens: 1024,
        messages: conversation,
        tools: CHAT_TOOLS,
        tool_choice: "auto",
      });

      const message = response.choices[0]?.message;
      const toolCalls = message?.tool_calls ?? [];

      if (toolCalls.length === 0) {
        const reply = (message?.content ?? "").trim();
        return NextResponse.json({ reply: reply || "I'm not sure how to help with that.", links });
      }

      conversation.push({ role: "assistant", content: message?.content ?? null, tool_calls: toolCalls });

      for (const toolCall of toolCalls) {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
        } catch {
          // Model produced malformed JSON — runTool's per-tool validation
          // handles the resulting missing fields gracefully.
        }

        const { result, links: newLinks } = await runTool(toolCall.function.name, input, {
          supabase,
          userId: user.id,
        });
        if (newLinks) links.push(...newLinks);
        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    return NextResponse.json({
      reply: "That request needed more steps than I can take at once — could you break it into smaller asks?",
      links,
    });
  } catch (err) {
    console.error("chat route: agent loop failed", err);
    return NextResponse.json({ error: "Something went wrong talking to the assistant." }, { status: 500 });
  }
}
