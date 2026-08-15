import "server-only";
import Anthropic from "@anthropic-ai/sdk";

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
 * + suggested action each. Returns an empty map (never throws) if
 * ANTHROPIC_API_KEY is unset or the call fails for any reason — callers
 * must treat the AI text as optional and fall back to the deterministic
 * numbers, never block on it.
 */
export async function summarizeFlaggedPatients(
  patients: FlaggedPatientInput[]
): Promise<Map<string, RiskSummary>> {
  const results = new Map<string, RiskSummary>();
  if (patients.length === 0) return results;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return results;

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.RISK_DIGEST_MODEL || "claude-haiku-4-5-20251001";

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system:
        "You are a clinical assistant summarizing already-flagged patient risk signals for a doctor's " +
        "dashboard. You receive only anonymized, pre-computed numeric/structured data — never infer or " +
        "invent anything beyond it, and never suggest a diagnosis. For each patient, write one short, " +
        "plain-language sentence explaining why they were flagged, and one short suggested next action " +
        "(e.g. 'Consider a check-in call', 'Review at next visit'). Be factual and calm, never alarmist.",
      messages: [
        {
          role: "user",
          content: `Patients flagged for review:\n${JSON.stringify(patients, null, 2)}`,
        },
      ],
      tools: [
        {
          name: TOOL_NAME,
          description: "Emit one summary + suggested action per flagged patient.",
          input_schema: {
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
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    if (!toolUse) return results;

    const input = toolUse.input as { summaries?: unknown };
    if (!Array.isArray(input.summaries)) return results;

    const validRefs = new Set(patients.map((p) => p.ref));
    for (const entry of input.summaries) {
      if (isValidSummary(entry) && validRefs.has(entry.ref)) {
        results.set(entry.ref, entry);
      }
    }
  } catch (err) {
    console.error("summarizeFlaggedPatients: Anthropic call failed", err);
  }

  return results;
}
