import "server-only";
import Groq from "groq-sdk";

// Deliberately minimal: no patient name, no free-text notes, no lab data —
// just the already-flagged, already-anonymized numbers. The model's only
// job is to phrase them; it never sees (or decides) anything else.
export interface FlaggedPatientInput {
  ref: string;
  adherencePctRecent: number | null;
  adherencePctPrior: number | null;
  vitalsNote: string | null;
  chronicConditions: string[];
}

export interface RiskSummary {
  ref: string;
  summary: string;
  suggestedAction: string;
}

const TOOL_NAME = "emit_risk_summaries";

function isValidSummary(entry: unknown): entry is RiskSummary {
  if (!entry || typeof entry !== "object") return false;
  const e = entry as Record<string, unknown>;
  return typeof e.ref === "string" && typeof e.summary === "string" && typeof e.suggestedAction === "string";
}

/**
 * Turns already-flagged, anonymized patient metrics into a one-line summary
 * + suggested action each, via an open-weight model hosted on Groq's free
 * tier (no Anthropic/OpenAI usage). Returns an empty map (never throws) if
 * GROQ_API_KEY is unset or the call fails for any reason — callers must
 * treat the AI text as optional and fall back to the deterministic
 * numbers, never block on it.
 */
export async function summarizeFlaggedPatients(
  patients: FlaggedPatientInput[]
): Promise<Map<string, RiskSummary>> {
  const results = new Map<string, RiskSummary>();
  if (patients.length === 0) return results;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return results;

  try {
    const client = new Groq({ apiKey });
    const model = process.env.RISK_DIGEST_MODEL || "openai/gpt-oss-20b";

    const response = await client.chat.completions.create({
      model,
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are a clinical assistant summarizing already-flagged patient risk signals for a doctor's " +
            "dashboard. You receive only anonymized, pre-computed numeric/structured data — never infer or " +
            "invent anything beyond it, and never suggest a diagnosis. For each patient, write one short, " +
            "plain-language sentence explaining why they were flagged, and one short suggested next action " +
            "(e.g. 'Consider a check-in call', 'Review at next visit'). Be factual and calm, never alarmist.",
        },
        {
          role: "user",
          content: `Patients flagged for review:\n${JSON.stringify(patients, null, 2)}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: TOOL_NAME,
            description: "Emit one summary + suggested action per flagged patient.",
            parameters: {
              type: "object",
              properties: {
                summaries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ref: { type: "string" },
                      summary: { type: "string" },
                      suggestedAction: { type: "string" },
                    },
                    required: ["ref", "summary", "suggestedAction"],
                  },
                },
              },
              required: ["summaries"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: TOOL_NAME } },
    });

    const toolCall = response.choices[0]?.message.tool_calls?.[0];
    if (!toolCall) return results;

    let input: { summaries?: unknown };
    try {
      input = JSON.parse(toolCall.function.arguments);
    } catch {
      return results;
    }
    if (!Array.isArray(input.summaries)) return results;

    const validRefs = new Set(patients.map((p) => p.ref));
    for (const entry of input.summaries) {
      if (isValidSummary(entry) && validRefs.has(entry.ref)) {
        results.set(entry.ref, entry);
      }
    }
  } catch (err) {
    console.error("summarizeFlaggedPatients: Groq call failed", err);
  }

  return results;
}
