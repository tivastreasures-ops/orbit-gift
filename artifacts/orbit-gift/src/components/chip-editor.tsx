import { useState } from 'react';
import type { TasteEntity } from '@workspace/api-client-react';
import { X, Check } from 'lucide-react';
import { useSearchTaste } from '@workspace/api-client-react';
import { COPY } from '@/lib/copy';
import { actions, useData, useDraft, type TasteChip } from '@/lib/store';

const COLORS = ['red', 'pink', 'orange', 'yellow', 'green', 'blue', 'purple', 'violet', 'indigo', 'teal', 'turquoise', 'navy', 'black', 'white', 'grey', 'gray', 'brown', 'beige', 'gold', 'silver', 'cream', 'lilac', 'lavender', 'mint', 'coral', 'peach', 'maroon', 'burgundy', 'magenta', 'cyan', 'olive', 'mustard', 'sage', 'rust', 'tan', 'ivory', 'charcoal', 'blush', 'rose', 'emerald', 'scarlet', 'crimson', 'aqua', 'plum'];
const COLOR_RE = new RegExp(`^(?:the\\s+)?(?:(?:colou?r)\\s+(${COLORS.join('|')})|(${COLORS.join('|')})(?:\\s+colou?r(?:ed)?)?)$`, 'i');

/** A colour word on its own or written as "color pink" / "pink color". Returns the colour or null. */
export function colorWord(text: string): string | null {
  const m = text.trim().replace(/[.!]+$/, '').match(COLOR_RE);
  return m ? (m[1] || m[2]).toLowerCase() : null;
}
/** Explicitly a colour: never needs a "which did you mean" question. */
export function isExplicitColor(text: string): boolean {
  return colorWord(text) !== null;
}

const KIND_WORDS: [RegExp, string][] = [
  [/music|musician|singer|artist|rapper|dj/i, 'the musician'],
  [/band|group/i, 'the band'],
  [/film|movie/i, 'the movie'],
  [/tv|show|series/i, 'the show'],
  [/book|novel|author|writer/i, 'the book'],
  [/game/i, 'the game'],
  [/brand|company|store|shop/i, 'the brand'],
  [/sport|team/i, 'the team'],
  [/place|city|country|location/i, 'the place'],
  [/food|dish|drink|cuisine/i, 'the food'],
  [/character/i, 'the character'],
  [/athlete|actor|actress|person|celebrity/i, 'the person'],
  [/colou?r/i, 'the color'],
];
/** Human-language label for a candidate. Never exposes internal kind placeholders like "entity". */
export function candidateLabel(c: TasteEntity): string {
  const kind = (c.kind || '').trim();
  if (/colou?r/i.test(kind)) return COPY.love.theColor(c.name.toLowerCase());
  const hit = KIND_WORDS.find(([re]) => re.test(kind));
  return hit ? `${c.name}, ${hit[1]}` : c.name;
}

export function ChipEditor({ recipientId, type, placeholder }: { recipientId: string; type: 'love' | 'refuse'; placeholder: string }) {
  const { chips } = useData();
  const mine = chips.filter((c) => c.recipientId === recipientId && c.type === type);
  const [value, setValue, clearValue] = useDraft<string>(`chip.${recipientId}.${type}`, '');
  const [error, setError] = useState<string | null>(null);
  const search = useSearchTaste();

  const add = async () => {
    const text = value.trim().slice(0, 200);
    if (!text) return;
    setError(null);
    clearValue();
    const id = actions.addChip({ recipientId, text, type, kind: '', status: 'pending' });
    if (type === 'refuse') { actions.updateChip(id, { status: 'plain' }); return; }
    // Clear colours ("color pink", "pink color") never ask.
    if (isExplicitColor(text)) { actions.updateChip(id, { status: 'plain', kind: 'color' }); return; }
    try {
      const res = await search.mutateAsync({ data: { text } });
      if (res.fallback) actions.flagBackup();
      const color = colorWord(text);
      const others = res.matches.filter((m) => !/colou?r/i.test(m.kind || ''));
      // A plain colour word only asks when something else genuinely shares the name.
      if ((color && others.length === 0) || (res.matches.length === 1 && res.matches[0].kind === 'color')) actions.updateChip(id, { status: 'plain', kind: 'color' });
      else if (res.matches.length) actions.updateChip(id, { status: 'confirm', candidates: res.matches, candidateIndex: 0 });
      else actions.updateChip(id, { status: 'nomatch' });
    } catch {
      actions.updateChip(id, { status: 'nomatch' });
      setError(COPY.errors.broke);
    }
  };

  return (
    <div>
      <input
        className="field text-lg"
        value={value}
        placeholder={placeholder}
        maxLength={200}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void add();
          }
        }}
        enterKeyHint="enter"
        aria-label={placeholder}
        data-testid={`input-${type}-chip`}
      />
      {error && <p role="alert" className="mt-3 text-gold">{error}</p>}
      <ul className="mt-5 flex flex-col gap-3" aria-live="polite">
        {mine.map((c, i) => (
          <ChipRow key={c.id} chip={c} index={i} />
        ))}
      </ul>
    </div>
  );
}

function ChipRow({ chip, index }: { chip: TasteChip; index: number }) {
  const refuse = chip.type === 'refuse';
  return (
    <li
      className={`enter glass rounded-2xl px-4 py-3 ${refuse ? 'border-l-2 !border-l-[hsl(8_70%_64%)]' : 'border-l-2 !border-l-[hsl(var(--gold))]'}`}
      style={{ ['--i' as string]: Math.min(index, 6) }}
      data-testid={`chip-${chip.type}-${chip.id}`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full shrink-0 ${chip.status === 'pending' ? 'pulse-star bg-violet' : refuse ? 'bg-[hsl(8_70%_64%)]' : 'bg-gold'}`} aria-hidden="true" />
        <span className="font-medium flex-1 min-w-0 break-words">{chip.text}</span>
        {chip.status === 'confirmed' && chip.matchedName && (
          <button
            type="button"
            className="text-xs text-violet underline decoration-dotted underline-offset-4 truncate max-w-[45%]"
            onClick={() => actions.updateChip(chip.id, { status: 'confirm' })}
            aria-label={COPY.love.match(chip.matchedName)}
            data-testid={`button-reopen-match-${chip.id}`}
          >
            <Check className="inline w-3 h-3 mr-1" />
            {chip.matchedName}
          </button>
        )}
        <button
          type="button"
          onClick={() => actions.removeChip(chip.id)}
          className="grid place-items-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-[hsl(250_40%_24%)] shrink-0"
          aria-label={COPY.removeChip(chip.text)}
          data-testid={`button-remove-chip-${chip.id}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {chip.status === 'confirm' && chip.candidates && chip.candidates.length > 0 && <WhichOne chip={chip} />}
      {chip.status === 'nomatch' && (
        <p className="mt-2 pl-5 text-sm text-muted-foreground" data-testid={`text-nomatch-${chip.id}`}>
          {COPY.love.noMatch}
        </p>
      )}
    </li>
  );
}

function WhichOne({ chip }: { chip: TasteChip }) {
  const color = colorWord(chip.text);
  const cands = (chip.candidates ?? []).filter((c) => !/colou?r/i.test(c.kind || ''));
  const options: { key: string; label: string; pick: () => void }[] = [];
  if (color) options.push({ key: 'color', label: COPY.love.theColor(color), pick: () => actions.updateChip(chip.id, { status: 'plain', kind: 'color', matchedEntityId: undefined, matchedName: undefined }) });
  cands.slice(0, 4).forEach((c) => options.push({ key: c.id, label: candidateLabel(c), pick: () => actions.updateChip(chip.id, { status: 'confirmed', matchedEntityId: c.id, matchedName: c.name, kind: c.kind }) }));
  options.push({ key: 'else', label: COPY.love.somethingElse, pick: () => actions.updateChip(chip.id, { status: 'nomatch', matchedEntityId: undefined, matchedName: undefined, kind: '' }) });
  const qid = `which-${chip.id}`;
  return (
    <div className="mt-3 pl-5" role="group" aria-labelledby={qid}>
      <p id={qid} className="text-sm text-muted-foreground mb-2" data-testid={`text-match-${chip.id}`}>{COPY.love.which(chip.text)}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <button key={o.key} type="button" className={i === 0 ? 'btn btn-gold btn-sm' : 'btn btn-ghost btn-sm'} onClick={o.pick} data-testid={`button-which-${chip.id}-${o.key === 'color' || o.key === 'else' ? o.key : i}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
