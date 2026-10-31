import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { candidateSchema, KINDS } from "./quality";
import type { ClaudeSession, ClaudeStage } from "./llm";

export const generationSchema = z.object({ ideas: z.array(candidateSchema).max(24) }).strict();
export const criticSchema = z.object({ verdicts: z.array(z.object({
  id: z.string(), kind: z.enum(KINDS), isSpecific: z.boolean(),
  sourcesUsed: z.array(z.string()).max(2), pass: z.boolean(),
  reason: z.string().min(1).max(600), duplicateOf: z.string().nullable(),
}).strict()).max(24) }).strict();

// Anthropic strict tools support structural constraints, not numeric/string/array
// bounds. Like Anthropic's SDK, derive descriptions for unsupported bounds while
// retaining ALL original Zod constraints in the local validator. No second schema.
function strictSchema(value: unknown): any {
  if (Array.isArray(value)) return value.map(strictSchema);
  if (!value || typeof value !== "object") return value;
  const result: Record<string, any> = {};
  const constraints: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "maxItems", "uniqueItems"].includes(key) ||
        (key === "minItems" && child !== 0 && child !== 1)) {
      constraints.push(`${key}: ${JSON.stringify(child)}`);
    } else if (key !== "$schema") result[key] = strictSchema(child);
  }
  if (constraints.length) result.description = [result.description, ...constraints].filter(Boolean).join("; ");
  return result;
}
export function defineTool<T extends z.ZodTypeAny>(name: string, schema: T) {
  return {
    schema,
    tool: {
      name, description: `Submit the ${name} response. All field constraints apply.`,
      strict: true,
      input_schema: strictSchema(zodToJsonSchema(schema, { $refStrategy: "none" })),
    },
  };
}
export const generationContract = defineTool("submit_gift_candidates", generationSchema);
export const criticContract = defineTool("submit_gift_verdicts", criticSchema);
export type ToolContract = ReturnType<typeof defineTool>;
export type FormatFailure = { stage: ClaudeStage; attempt: number; issues: string[] };
export class ToolReplyError extends Error {}
export class ToolFormatError extends Error {
  constructor(stage: ClaudeStage, issues: string[]) {
    super(`${stage} format failure after one correction: ${issues.join("; ")}`);
  }
}
export function recordFormatFailure(claude: ClaudeSession, stage: ClaudeStage, attempt: number, issues: string[]) {
  const failure = { stage, attempt, issues };
  (claude.formatFailures ??= []).push(failure);
  console.warn("Claude format failure:", JSON.stringify(failure));
}

// One correction attempt, not another semantic generation/critic round. The
// previous reply and exact validation paths go back to Claude, never to logs.
export async function requestTool<T extends z.ZodTypeAny>(
  claude: ClaudeSession, stage: "generation" | "critic", prompt: string,
  input: unknown, contract: ReturnType<typeof defineTool<T>>,
): Promise<z.infer<T>> {
  let previousReply: unknown = null, issues: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      previousReply = await claude.json(stage, prompt, attempt === 1 ? input : {
        originalInput: input, formatCorrection: { previousReply, errors: issues,
          instruction: "Correct only the response format using the tool schema. Preserve gift concepts and verdicts; do not reconsider quality." },
      }, contract);
      const parsed = contract.schema.safeParse(previousReply);
      if (parsed.success) return parsed.data;
      issues = parsed.error.issues.map(i => `${i.path.join(".") || "$"}: ${i.message}`);
    } catch (error) {
      if (!(error instanceof ToolReplyError)) throw error;
      issues = [error.message];
    }
    recordFormatFailure(claude, stage, attempt, issues);
  }
  throw new ToolFormatError(stage, issues);
}
