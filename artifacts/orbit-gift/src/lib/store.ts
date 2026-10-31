import { useSyncExternalStore } from 'react';
import type { GiftIdea, TasteEntity } from '@workspace/api-client-react';
import { COPY } from './copy';

export interface Recipient {
  id: string;
  name: string;
  relationship: string;
  occasion: string;
  budgetMin: number;
  budgetMax: number;
  owned: string;
}

export type ChipStatus = 'pending' | 'confirm' | 'confirmed' | 'nomatch' | 'plain';
export interface TasteChip {
  id: string;
  recipientId: string;
  text: string;
  type: 'love' | 'refuse';
  matchedEntityId?: string;
  matchedName?: string;
  kind: string;
  candidates?: TasteEntity[];
  candidateIndex?: number;
  status: ChipStatus;
}

export interface Settings {
  appName: string;
  tagline: string;
  reduceMotion: boolean;
}

interface State {
  recipients: Recipient[];
  chips: TasteChip[];
  gifts: GiftIdea[];
  rounds: Record<string, string[]>;
  seeds: Record<string, string[]>;
  settings: Settings;
  storageBlocked: boolean;
  backup: 'none' | 'showing' | 'done';
}

const K = {
  r: 'ow.recipients',
  c: 'ow.chips',
  g: 'ow.gifts',
  rd: 'ow.rounds',
  seeds: 'ow.seeds',
  s: 'ow.settings',
  p: 'ow.sharePurpose',
};
export const SHARE_PURPOSE_KEY = K.p;

/** The completion page must never touch localStorage. */
export const storageOff =
  typeof window !== 'undefined' && /\/complete\/?$/.test(window.location.pathname);

let blocked = false;

export function readKey<T>(k: string, fb: T): T {
  if (storageOff) return fb;
  try {
    const v = window.localStorage.getItem(k);
    return v == null ? fb : (JSON.parse(v) as T);
  } catch {
    blocked = true;
    return fb;
  }
}
export function writeKey(k: string, v: unknown) {
  if (storageOff) return;
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    blocked = true;
  }
}
function probe(): boolean {
  if (storageOff) return true;
  try {
    const t = 'ow.__probe';
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

export const DEFAULT_SETTINGS: Settings = {
  appName: COPY.home.name,
  tagline: COPY.home.tagline,
  reduceMotion: false,
};

let state: State | null = null;
function get(): State {
  if (!state) {
    const ok = probe();
    state = {
      recipients: readKey<Recipient[]>(K.r, []),
      chips: readKey<TasteChip[]>(K.c, []),
      gifts: readKey<GiftIdea[]>(K.g, []),
      rounds: readKey<Record<string, string[]>>(K.rd, {}),
      seeds: readKey<Record<string, string[]>>(K.seeds, {}),
      settings: { ...DEFAULT_SETTINGS, ...readKey<Partial<Settings>>(K.s, {}) },
      storageBlocked: !ok || blocked,
      backup: 'none',
    };
  }
  return state;
}

const listeners = new Set<() => void>();
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function set(patch: Partial<State>) {
  const next = { ...get(), ...patch };
  if (patch.recipients) writeKey(K.r, next.recipients);
  if (patch.chips) writeKey(K.c, next.chips);
  if (patch.gifts) writeKey(K.g, next.gifts);
  if (patch.rounds) writeKey(K.rd, next.rounds);
  if (patch.seeds) writeKey(K.seeds, next.seeds);
  if (patch.settings) writeKey(K.s, next.settings);
  state = { ...next, storageBlocked: next.storageBlocked || blocked };
  listeners.forEach((l) => l());
}

export function useData() {
  return useSyncExternalStore(subscribe, get, get);
}

export const uid = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
};

export const actions = {
  addSeed(rid: string, title: string): string[] {
    const seeds = [...new Set([...(get().seeds[rid] ?? []), title.slice(0, 300)])].slice(-30);
    set({ seeds: { ...get().seeds, [rid]: seeds } });
    return seeds;
  },
  addRecipient(r: Omit<Recipient, 'id'>): string {
    const id = uid();
    set({ recipients: [...get().recipients, { ...r, id }] });
    return id;
  },
  updateRecipient(id: string, patch: Partial<Recipient>) {
    set({ recipients: get().recipients.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  },
  addChip(c: Omit<TasteChip, 'id'>): string {
    const id = uid();
    set({ chips: [...get().chips, { ...c, id }] });
    return id;
  },
  updateChip(id: string, patch: Partial<TasteChip>) {
    set({ chips: get().chips.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  },
  removeChip(id: string) {
    set({ chips: get().chips.filter((c) => c.id !== id) });
  },
  addRound(rid: string, ideas: GiftIdea[]) {
    const s = get();
    const ids = new Set(ideas.map((i) => i.id));
    const gifts = [...s.gifts.filter((g) => !ids.has(g.id)), ...ideas.map((i) => ({ ...i, recipientId: rid }))];
    set({ gifts, rounds: { ...s.rounds, [rid]: ideas.map((i) => i.id) } });
  },
  setGiftStatus(id: string, status: GiftIdea['status'], rejectReason?: string) {
    set({
      gifts: get().gifts.map((g) =>
        g.id === id ? { ...g, status, rejectReason: status === 'rejected' ? rejectReason : g.rejectReason } : g,
      ),
    });
  },
  deleteGift(id: string) {
    set({ gifts: get().gifts.filter((g) => g.id !== id) });
  },
  updateSettings(patch: Partial<Settings>) {
    set({ settings: { ...get().settings, ...patch } });
  },
  flagBackup() {
    if (get().backup !== 'none') return;
    set({ backup: 'showing' });
    window.setTimeout(() => set({ backup: 'done' }), 9000);
  },
};

export function splitList(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
