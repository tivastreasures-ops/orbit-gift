import { createHash } from "node:crypto";

export class JobConflict extends Error {}
export class JobCapacity extends Error {}
type Entry<T> = { fingerprint: string; pending: boolean; expires: number; result: Promise<T> };

// Device-generated opaque keys only. No disk/database, recipient records or
// headers retained. Successes expire after ten minutes; failures are retryable.
export class RecommendationJobs<T> {
  private entries = new Map<string, Entry<T>>();
  constructor(private now = () => Date.now(), private ttl = 600000, private maxPending = 8) {}
  run(key: string, body: unknown, work: () => Promise<T>): Promise<T> {
    for (const [k, v] of this.entries) if (!v.pending && v.expires <= this.now()) this.entries.delete(k);
    const fingerprint = createHash("sha256").update(JSON.stringify(body)).digest("hex");
    const existing = this.entries.get(key);
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new JobConflict("Retry key does not match original request");
      return existing.result;
    }
    if ([...this.entries.values()].filter(v => v.pending).length >= this.maxPending) throw new JobCapacity("Recommendation capacity reached");
    if (this.entries.size >= 64) {
      const oldest = [...this.entries].find(([, v]) => !v.pending);
      if (oldest) this.entries.delete(oldest[0]);
    }
    const entry: Entry<T> = { fingerprint, pending: true, expires: 0, result: Promise.resolve().then(work) };
    this.entries.set(key, entry);
    entry.result = entry.result.then(result => {
      entry.pending = false; entry.expires = this.now() + this.ttl;
      return result;
    }, error => { this.entries.delete(key); throw error; });
    return entry.result;
  }
}
