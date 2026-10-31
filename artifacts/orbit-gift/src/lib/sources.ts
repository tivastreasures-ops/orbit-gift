import type { GiftIdea } from '@workspace/api-client-react';

export interface SourceLove { id: string; text: string }
export interface ResolvedSources { ids: string[]; names: string[] }

const norm = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Exact-match only. Order: server `sourceLoves`, then legacy `because` as one
 * exact love, then `because` split on " + " where every part is exact.
 * Any unresolved source returns null (caller shows the whole-sky fallback).
 * Never substring or fuzzy matching.
 */
export function resolveSources(idea: Pick<GiftIdea, 'because' | 'sourceLoves'>, loves: SourceLove[]): ResolvedSources | null {
  const byNorm = new Map<string, SourceLove[]>();
  for (const l of loves) {
    const k = norm(l.text);
    if (!k) continue;
    byNorm.set(k, [...(byNorm.get(k) ?? []), l]);
  }
  const take = (parts: string[]): ResolvedSources | null => {
    if (!parts.length || parts.length > 2 || parts.some(part => !norm(part))) return null;
    const uniq = [...new Set(parts.map(norm).filter(Boolean))];
    if (!uniq.length || uniq.length > 2) return null;
    const ids: string[] = [];
    const names: string[] = [];
    for (const k of uniq) {
      const hit = byNorm.get(k);
      if (!hit) return null;
      hit.forEach((h) => ids.push(h.id));
      names.push(hit[0].text.trim());
    }
    return { ids, names };
  };
  if (idea.sourceLoves !== undefined) return take(idea.sourceLoves);
  const because = idea.because ?? '';
  const whole = take([because]);
  if (whole) return whole;
  const parts = because.split(' + ');
  return parts.length === 2 ? take(parts) : null;
}
