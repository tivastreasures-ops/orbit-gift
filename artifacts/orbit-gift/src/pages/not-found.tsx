import { Link } from 'wouter';
import { Planet } from '@/components/starfield';
import { COPY, NEED } from '@/lib/copy';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="mx-auto w-fit float"><Planet size={160} /></div>
      <p className="mt-6 copy-needed" data-testid="text-not-found">{NEED('404 page message')}</p>
      <Link href="/" className="btn btn-ghost mt-6" data-testid="link-home">
        <span>{COPY.saved.title}</span>
      </Link>
    </div>
  );
}
