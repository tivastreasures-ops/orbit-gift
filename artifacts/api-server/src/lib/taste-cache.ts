import { createHash } from "node:crypto";

export function cacheKey(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
// Bounded, short-lived derived data only. Never written to disk or logs.
export class TasteCache<T> {
  private entries = new Map<string, { until: number; value: Promise<T> }>();
  constructor(private limit = 200, private ttl = 6 * 60 * 60 * 1000) {}
  has(key: string) {
    const entry = this.entries.get(key);
    return !!entry && entry.until > Date.now();
  }
  async get(key: string, load: () => Promise<T>): Promise<{ value: T; hit: boolean }> {
    const old = this.entries.get(key);
    if (old && old.until > Date.now()) return { value: await old.value, hit: true };
    this.entries.delete(key);
    while (this.entries.size >= this.limit) this.entries.delete(this.entries.keys().next().value!);
    const value = Promise.resolve().then(load);
    this.entries.set(key, { until: Date.now() + this.ttl, value });
    try { return { value: await value, hit: false }; }
    catch (error) { if (this.entries.get(key)?.value === value) this.entries.delete(key); throw error; }
  }
}
