import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { FlowHeader } from '@/components/flow-header';
import { COPY, NEED } from '@/lib/copy';
import { actions } from '@/lib/store';

function Group({ label, options, value, onChange, id }: { label: string; options: string[]; value: string; onChange: (v: string) => void; id: string }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(value === o ? '' : o)} className="pill" data-testid={`option-${id}-${o.toLowerCase().replace(/\W+/g, '-')}`}>
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function RecipientNew() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [occasion, setOccasion] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const lo = Math.max(0, Math.min(100000, Number(min) || 0));
    const hiRaw = Number(max) || 0;
    const hi = Math.min(100000, hiRaw ? Math.max(hiRaw, lo) : 100000);
    const id = actions.addRecipient({ name: name.trim().slice(0, 100), relationship, occasion, budgetMin: lo, budgetMax: hi, owned: '' });
    setLocation(`/recipient/${id}/love`);
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
      <FlowHeader step={1} back="/" title={COPY.who.title} />
      <div className="mt-10 space-y-9">
        <div className="enter" style={{ ['--i' as string]: 1 }}>
          <label className="label" htmlFor="r-name">{COPY.who.nameLabel}</label>
          <input id="r-name" className="field text-lg" value={name} onChange={(e) => setName(e.target.value)} placeholder={COPY.who.namePh} maxLength={100} autoComplete="off" data-testid="input-recipient-name" />
        </div>
        <div className="enter" style={{ ['--i' as string]: 2 }}>
          <Group label={COPY.who.relLabel} options={COPY.who.rels} value={relationship} onChange={setRelationship} id="relationship" />
        </div>
        <div className="enter" style={{ ['--i' as string]: 3 }}>
          <Group label={COPY.who.occLabel} options={COPY.who.occs} value={occasion} onChange={setOccasion} id="occasion" />
        </div>
        <fieldset className="enter" style={{ ['--i' as string]: 4 }}>
          <legend className="label">{COPY.who.budgetLabel}</legend>
          <p className="text-sm text-muted-foreground -mt-1 mb-3">{COPY.who.budgetHelper}</p>
          <div className="flex items-center gap-3">
            <input type="number" inputMode="decimal" min={0} max={100000} className="field tabular-nums" value={min} onChange={(e) => setMin(e.target.value)} aria-label={NEED('minimum budget field label')} data-testid="input-budget-min" />
            <span aria-hidden="true" className="text-gold">–</span>
            <input type="number" inputMode="decimal" min={0} max={100000} className="field tabular-nums" value={max} onChange={(e) => setMax(e.target.value)} aria-label={NEED('maximum budget field label')} data-testid="input-budget-max" />
          </div>
        </fieldset>
        <div className="enter pt-2" style={{ ['--i' as string]: 5 }}>
          <button type="submit" className="btn btn-gold w-full sm:w-auto px-8 min-h-[54px]" disabled={!name.trim()} data-testid="button-next-love">
            <span>{COPY.who.next}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
