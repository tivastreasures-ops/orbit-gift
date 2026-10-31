import { z } from "zod";
import { structured } from "./llm";
import { searchWikipedia } from "./wikipedia";

const entity = z.object({ id: z.string(), name: z.string(), kind: z.string() });
export type Entity = z.infer<typeof entity>;
export interface TasteAdapter {
  searchEntity(text: string, kind?: string): Promise<Entity[]>;
  getRelated(entityIds: string[], domains: string[]): Promise<Entity[]>;
  describe(entityId: string): Promise<string>;
}

export const claudeTaste: TasteAdapter = {
  async searchEntity(text, kind) {
    const matches = await searchWikipedia(text);
    return matches.filter(match => !kind || match.kind === kind).map(({ id, name, kind }) => ({ id, name, kind }));
  },
  async getRelated(ids, domains) {
    if (!ids.length) return [];
    const data = await structured(
      'Return up to 8 real related cultural entities across the requested domains. Unknown is empty. Return {"items":[{"id":"llm:kind:name","name":"name","kind":"kind"}]}.',
      { ids, domains },
    );
    return z.object({ items: z.array(entity).max(8) }).parse(data).items;
  },
  async describe(id) {
    const data = await structured('Give one short factual description of this cultural entity. Return {"fact":"..."}; no uncertain or promotional claims.', { id });
    return z.object({ fact: z.string() }).parse(data).fact;
  },
};

const qlooEntitySchema = z.object({
  entity_id: z.string(), name: z.string(), types: z.array(z.string()).optional(),
  properties: z.object({ description: z.string().optional() }).passthrough().optional(),
}).passthrough();
type QlooEntity = z.infer<typeof qlooEntitySchema>;
async function qloo(path: string, params: Record<string, string>) {
  const key = process.env.QLOO_API_KEY?.trim();
  if (!key) throw new Error("Qloo disabled");
  const url = new URL(path, "https://api.qloo.com");
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    headers: { "X-Api-Key": key, accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Taste service unavailable");
  return await response.json();
}
function normalize(e: QlooEntity): Entity {
  return { id: e.entity_id, name: e.name, kind: e.types?.[0]?.replace("urn:entity:", "") ?? "topic" };
}
export const qlooTaste: TasteAdapter = {
  async searchEntity(text, kind) {
    const params: Record<string, string> = { query: text, take: "4" };
    if (kind?.startsWith("urn:entity:")) params.types = kind;
    const data = await qloo("/search", params);
    const parsed = z.object({ results: z.array(qlooEntitySchema).default([]) }).parse(data);
    return parsed.results.map(normalize);
  },
  async getRelated(ids, domains) {
    const realIds = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (!realIds.length) return [];
    const result: Entity[] = [];
    for (const domain of domains.slice(0, 3)) {
      const data = await qloo("/v2/insights", {
        "filter.type": `urn:entity:${domain}`,
        "signal.interests.entities": realIds.join(","),
        take: "4",
      });
      const parsed = z.object({ results: z.object({ entities: z.array(qlooEntitySchema).default([]) }) }).parse(data);
      result.push(...parsed.results.entities.map(normalize));
    }
    return z.array(entity).parse(result);
  },
  async describe(id) {
    const data = await qloo("/entities", { entity_ids: id });
    const parsed = z.object({ results: z.array(qlooEntitySchema).default([]) }).parse(data);
    return parsed.results[0]?.properties?.description ?? "";
  },
};

// Mock adapter is explicit and test-only; runtime never silently substitutes canned ideas.
export const mockTaste: TasteAdapter = {
  async searchEntity(text, kind) { return [{ id: `mock:${text}`, name: text, kind: kind ?? "entity" }]; },
  async getRelated() { return []; },
  async describe() { return ""; },
};

export async function withTaste<T>(fn: (adapter: TasteAdapter) => Promise<T>): Promise<{ value: T; fallback: boolean }> {
  if (process.env.QLOO_API_KEY?.trim()) {
    try { return { value: await fn(qlooTaste), fallback: false }; } catch { /* explicitly reported to client */ }
  }
  return { value: await fn(claudeTaste), fallback: true };
}
