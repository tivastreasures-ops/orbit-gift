import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Sparkles } from 'lucide-react';
import { ChipEditor } from '@/components/chip-editor';
import { FlowHeader, MissingRecipient } from '@/components/flow-header';
import { COPY } from '@/lib/copy';
import { actions, useData } from '@/lib/store';

export default function RefusalsPage() {
  const { id } = useParams<{ id: string }>();
  const { recipients } = useData();
  const [, setLocation] = useLocation();
  const r = recipients.find((x) => x.id === id);
  const [owned, setOwned] = useState(r?.owned ?? '');
  if (!r) return <MissingRecipient />;
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
      <FlowHeader step={3} back={`/recipient/${r.id}/love`} title={COPY.refuse.title} helper={COPY.refuse.helper} />
      <p className="mt-2 font-display text-gold text-lg">{r.name}</p>
      <div className="mt-8 enter" style={{ ['--i' as string]: 2 }}>
        <ChipEditor recipientId={r.id} type="refuse" placeholder={COPY.refuse.ph} />
      </div>
      <div className="mt-9 enter" style={{ ['--i' as string]: 3 }}>
        <label className="label" htmlFor="owned">{COPY.refuse.ownLabel}</label>
        <textarea
          id="owned"
          rows={3}
          maxLength={2000}
          className="field resize-y"
          placeholder={COPY.refuse.ownPh}
          value={owned}
          onChange={(e) => { setOwned(e.target.value); actions.updateRecipient(r.id, { owned: e.target.value }); }}
          onBlur={() => actions.updateRecipient(r.id, { owned })}
          data-testid="input-owned"
        />
      </div>
      <div className="mt-10">
        <button
          type="button"
          className="btn btn-gold w-full sm:w-auto px-8 min-h-[54px]"
          onClick={() => {
            actions.updateRecipient(r.id, { owned });
            setLocation(`/recipient/${r.id}/results?fresh=1`);
          }}
          data-testid="button-find-gifts"
        >
          <Sparkles className="w-4 h-4" />
          <span>{COPY.refuse.next}</span>
        </button>
      </div>
    </div>
  );
}
