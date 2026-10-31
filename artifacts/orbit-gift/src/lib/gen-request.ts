import { generateGifts, type GiftInput, type GiftResult } from '@workspace/api-client-react';

/** Client fetch timeout. The server cancels its own work at 110s; this sits above it. */
export const GEN_TIMEOUT_MS = 130_000;
const TRANSIENT_STATUS = new Set([408, 429, 502, 503, 504]);

export class GenTimeout extends Error {
  constructor() { super('timeout'); this.name = 'GenTimeout'; }
}

export function isTransient(e: unknown): boolean {
  if (e instanceof GenTimeout) return true;
  const status = (e as { status?: unknown } | null)?.status;
  if (typeof status === 'number') return TRANSIENT_STATUS.has(status);
  // fetch() network failures surface as TypeError.
  return e instanceof TypeError;
}

async function once(body: GiftInput, key: string): Promise<GiftResult> {
  const ac = new AbortController();
  let timedOut = false;
  const t = setTimeout(() => { timedOut = true; ac.abort(); }, GEN_TIMEOUT_MS);
  try {
    return await generateGifts(body, { signal: ac.signal, headers: { 'Idempotency-Key': key } });
  } catch (e) {
    if (timedOut) throw new GenTimeout();
    throw e;
  } finally {
    clearTimeout(t);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One request + at most ONE automatic retry on transient failure, reusing the SAME
 * Idempotency-Key so the server can share/cached the original run instead of paying twice.
 * Manual retries must call this with a fresh key.
 */
export async function sendGifts(body: GiftInput, key: string): Promise<GiftResult> {
  try {
    return await once(body, key);
  } catch (e) {
    if (!isTransient(e)) throw e;
    await sleep(1500);
    return once(body, key);
  }
}
