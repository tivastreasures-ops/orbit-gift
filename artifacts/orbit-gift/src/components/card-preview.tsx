import { COPY } from '@/lib/copy';
import type { Size } from '@/lib/cards';

export function SizePicker({ size, onChange }: { size: Size; onChange: (s: Size) => void }) {
  return (
    <div className="inline-flex rounded-full p-1 border border-[hsl(252_40%_44%/0.45)] bg-[hsl(246_38%_14%/0.6)]" role="radiogroup">
      {(['portrait', 'square'] as const).map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={size === s}
          onClick={() => onChange(s)}
          className={`px-4 min-h-[40px] rounded-full text-sm font-medium transition-colors ${size === s ? 'bg-gold text-[hsl(234_52%_10%)]' : 'text-muted-foreground'}`}
          data-testid={`option-size-${s}`}
        >
          {s === 'portrait' ? COPY.share.portrait : COPY.share.square}
        </button>
      ))}
    </div>
  );
}

export function PreviewImage({ url, size, alt }: { url: string | null; size: Size; alt: string }) {
  return (
    <div className={`relative w-full max-w-[420px] mx-auto rounded-2xl overflow-hidden shadow-[0_30px_60px_-20px_hsl(234_70%_2%/0.9)] ring-1 ring-[hsl(42_60%_60%/0.25)] ${size === 'portrait' ? 'aspect-[1080/1350]' : 'aspect-square'}`}>
      {url ? <img src={url} alt={alt} className="w-full h-full object-contain enter" data-testid="img-card-preview" /> : <div className="shimmer w-full h-full" />}
    </div>
  );
}
