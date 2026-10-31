import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Settings2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Starfield, Mark } from '@/components/starfield';
import { COPY, NEED } from '@/lib/copy';
import { actions, useData } from '@/lib/store';

export function Shell({ children }: { children: ReactNode }) {
  const { settings, storageBlocked, backup } = useData();
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
    document.title = `${settings.appName} · ${settings.tagline}`;
  }, [settings]);

  const navCls = (active: boolean) =>
    `px-2.5 sm:px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${active ? 'bg-[hsl(42_60%_46%/0.18)] text-[hsl(46_90%_84%)]' : 'text-muted-foreground hover:text-foreground'}`;

  return (
    <div className="relative min-h-[100dvh] flex flex-col">
      <Starfield />
      <header className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 mr-auto min-w-0" data-testid="link-brand">
          <Mark className="w-8 h-7 shrink-0" />
          <span className="min-w-0">
            <span className="block wordmark text-base sm:text-lg leading-none truncate" data-testid="text-app-name">
              {settings.appName}
            </span>
            <span className="block smallcaps !text-[10px] text-violet/80 mt-1 truncate">{settings.tagline}</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/" className={navCls(location === '/')} data-testid="link-keepers">
            {COPY.saved.title}
          </Link>
          <Link href="/share" className={navCls(location === '/share')} data-testid="link-share">
            {COPY.share.share}
          </Link>
        </nav>
        <button
          type="button"
          className="ml-1 grid place-items-center w-11 h-11 rounded-full text-muted-foreground hover:text-gold transition-colors"
          onClick={() => setOpen(true)}
          aria-label={NEED('settings button label')}
          data-testid="button-settings"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </header>

      {(storageBlocked || backup === 'showing') && (
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 mt-3 space-y-2">
          {storageBlocked && (
            <p role="alert" className="glass rounded-xl px-4 py-2.5 text-sm" data-testid="status-storage-blocked">
              {COPY.errors.storage}
            </p>
          )}
          {backup === 'showing' && (
            <p role="status" className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-violet border border-[hsl(262_50%_60%/0.35)] bg-[hsl(262_40%_20%/0.4)]" data-testid="status-backup">
              <Mark className="w-5 h-4" />
              {COPY.errors.backup}
            </p>
          )}
        </div>
      )}

      <main className="relative z-10 flex-1 w-full">{children}</main>

      <footer className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 mt-10 border-t border-[hsl(252_30%_30%/0.4)] text-sm text-muted-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <p className="flex items-center gap-2" data-testid="text-footer-brand">
            <Mark className="w-7 h-5" />
            <span className="wordmark text-foreground">{settings.appName}</span>
            <span aria-hidden="true">·</span>
            <span>{settings.tagline}</span>
          </p>
          <p>{COPY.settings.privacy}</p>
        </div>
        <p className="mt-3 text-xs opacity-80">{COPY.settings.fine}</p>
      </footer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass border-[hsl(252_40%_40%/0.4)] rounded-3xl max-w-md [&>button]:hidden">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="font-display text-xl">
              <span className="copy-needed">{NEED('settings panel title')}</span>
            </DialogTitle>
            <button type="button" onClick={() => setOpen(false)} className="px-3 h-10 rounded-full hover:bg-[hsl(250_40%_24%)]" aria-label={NEED('close settings button label')} data-testid="button-close-settings">
              {NEED('close settings button label')}
            </button>
          </div>
          <DialogDescription className="sr-only">{COPY.settings.privacy}</DialogDescription>
          <div className="space-y-5 mt-2">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="font-medium">{COPY.settings.motion}</span>
              <Switch
                checked={settings.reduceMotion}
                onCheckedChange={(v) => actions.updateSettings({ reduceMotion: v })}
                data-testid="switch-reduce-motion"
              />
            </label>
            <div>
              <label className="block text-sm mb-1.5 copy-needed" htmlFor="set-name">{NEED('app name setting label')}</label>
              <input id="set-name" className="field" value={settings.appName} onChange={(e) => actions.updateSettings({ appName: e.target.value })} data-testid="input-app-name" />
            </div>
            <div>
              <label className="block text-sm mb-1.5 copy-needed" htmlFor="set-tag">{NEED('tagline setting label')}</label>
              <input id="set-tag" className="field" value={settings.tagline} onChange={(e) => actions.updateSettings({ tagline: e.target.value })} data-testid="input-tagline" />
            </div>
            <p className="text-xs text-muted-foreground">{COPY.settings.fine}</p>
            <p className="text-xs text-muted-foreground">{COPY.settings.privacy}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
