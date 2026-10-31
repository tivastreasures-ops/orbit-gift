import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { COPY, NEED } from '@/lib/copy';

export function FlowHeader({ step, back, title, helper }: { step: number; back: string; title: string; helper?: string }) {
  return (
    <div className="enter">
      <div className="flex items-center gap-3 mb-6">
        <Link href={back} className="grid place-items-center w-11 h-11 rounded-full border border-[hsl(252_40%_52%/0.4)] hover:border-gold transition-colors" aria-label={NEED('back button label')} data-testid="link-back">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className="flex items-center gap-2">
              <span className={`block rounded-full transition-all ${n <= step ? 'w-2.5 h-2.5 bg-gold shadow-[0_0_10px_hsl(42_80%_60%/0.6)]' : 'w-2 h-2 bg-[hsl(250_30%_36%)]'}`} />
              {n < 3 && <span className={`block w-6 h-px ${n < step ? 'bg-gold/70' : 'bg-[hsl(250_30%_30%)]'}`} />}
            </span>
          ))}
        </div>
      </div>
      <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight" data-testid="text-title">{title}</h1>
      {helper && <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-xl">{helper}</p>}
    </div>
  );
}

export function MissingRecipient() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="copy-needed" data-testid="text-missing-recipient">{NEED('recipient not found message')}</p>
      <Link href="/" className="btn btn-ghost mt-6" data-testid="link-home">
        <span>{COPY.saved.title}</span>
      </Link>
    </div>
  );
}
