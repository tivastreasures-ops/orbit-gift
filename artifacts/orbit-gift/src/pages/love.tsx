import { Link, useParams } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { ChipEditor } from '@/components/chip-editor';
import { OrbitConstellation } from '@/components/starfield';
import { FlowHeader, MissingRecipient } from '@/components/flow-header';
import { COPY } from '@/lib/copy';
import { useData } from '@/lib/store';

export default function LovePage() {
  const { id } = useParams<{ id: string }>();
  const { recipients, chips } = useData();
  const r = recipients.find((x) => x.id === id);
  if (!r) return <MissingRecipient />;
  const loves = chips.filter((c) => c.recipientId === r.id && c.type === 'love').map((c) => ({ id: c.id, text: c.text }));
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
      <FlowHeader step={2} back="/" title={COPY.love.title} helper={COPY.love.helper} />
      <p className="mt-2 wordmark text-gold text-lg">{r.name}</p>
      <OrbitConstellation loves={loves} className="mt-6 w-full max-w-md mx-auto h-auto" />
      <div className="mt-8 enter" style={{ ['--i' as string]: 2 }}>
        <ChipEditor recipientId={r.id} type="love" placeholder={COPY.love.ph} />
      </div>
      <div className="mt-10">
        <Link href={`/recipient/${r.id}/refusals`} className="btn btn-gold w-full sm:w-auto px-8 min-h-[54px]" data-testid="link-next-refusals">
          <span>{COPY.love.next}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
