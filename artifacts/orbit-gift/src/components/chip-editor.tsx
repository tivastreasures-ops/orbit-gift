import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useSearchTaste } from '@workspace/api-client-react';
import { COPY, NEED } from '@/lib/copy';
import { actions, useData, type TasteChip } from '@/lib/store';

export function ChipEditor({ recipientId, type, placeholder }: { recipientId: string; type: 'love' | 'refuse'; placeholder: string }) {
  const { chips } = useData();
  const mine = chips.filter((c) => c.recipientId === recipientId && c.type === type);
  const [value, setValue] = useState('');
  const search = useSearchTaste();

  const add = async () => {
    const text = value.trim().slice(0, 200);
    if (!text) return;
    setValue('');
    const id = actions.addChip({ recipientId, text, type, kind: '', status: 'pending' });
    try {
      const res = await search.mutateAsync({ data: { text } });
      if (res.fallback) actions.flagBackup();
      if (res.matches.length) actions.updateChip(id, { status: 'confirm', candidates: res.matches, candidateIndex: 0 });
      else actions.updateChip(id, { status: 'nomatch' });
    } catch {
      actions.updateChip(id, { status: 'nomatch' });
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
      <ul className="mt-5 flex flex-col gap-3" aria-live="polite">
        {mine.map((c, i) => (
          <ChipRow key={c.id} chip={c} index={i} />
        ))}
      </ul>
    </div>
  );
}

function ChipRow({ chip, index }: { chip: TasteChip; index: number }) {
  const cand = chip.candidates?.[chip.candidateIndex ?? 0];
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
          aria-label={NEED('remove chip button label')}
          data-testid={`button-remove-chip-${chip.id}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {chip.status === 'confirm' && cand && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-5">
          <span className="text-sm text-muted-foreground mr-1" data-testid={`text-match-${chip.id}`}>
            {COPY.love.match(cand.kind ? `${cand.name} (${cand.kind})` : cand.name)}
          </span>
          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={() => actions.updateChip(chip.id, { status: 'confirmed', matchedEntityId: cand.id, matchedName: cand.name, kind: cand.kind })}
            data-testid={`button-match-yes-${chip.id}`}
          >
            {COPY.love.yes}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const next = (chip.candidateIndex ?? 0) + 1;
              if (chip.candidates && next < chip.candidates.length) actions.updateChip(chip.id, { candidateIndex: next });
              else actions.updateChip(chip.id, { status: 'nomatch', matchedEntityId: undefined, matchedName: undefined, kind: '' });
            }}
            data-testid={`button-match-nope-${chip.id}`}
          >
            {COPY.love.nope}
          </button>
        </div>
      )}
      {chip.status === 'nomatch' && (
        <p className="mt-2 pl-5 text-sm text-muted-foreground" data-testid={`text-nomatch-${chip.id}`}>
          {COPY.love.noMatch}
        </p>
      )}
    </li>
  );
}
