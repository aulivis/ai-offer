'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { t, type CopyKey } from '@/copy';
import { trackEmailCapture } from '@/lib/analytics';

import { ManageCookiesButton } from '@/components/cookies/ManageCookiesButton';

type NavigationLink = {
  href: string;
  labelKey: CopyKey;
};

const navigationLinks: ReadonlyArray<NavigationLink> = [
  { href: '/success-stories', labelKey: 'nav.successStories' },
  { href: '/resources', labelKey: 'nav.resources' },
  { href: '/privacy-policy', labelKey: 'app.footer.legalLinks.privacy' },
];

const cookiePolicyLink: NavigationLink = {
  href: '/cookie-policy',
  labelKey: 'app.footer.legalLinks.cookies',
};

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setNewsletterStatus('loading');
    try {
      // Integrate with newsletter service
      await new Promise((resolve) => setTimeout(resolve, 1000));
      trackEmailCapture('footer_newsletter');
      setNewsletterStatus('success');
      setEmail('');
    } catch {
      setNewsletterStatus('idle');
    }
  };

  return (
    <footer className="relative z-20 border-t border-border bg-bg/80 py-12">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground md:col-span-1">
            <span className="text-base font-medium text-fg">
              {t('app.footer.copyrightPrefix')} {currentYear} {t('app.footer.brand')}
            </span>
            <p className="max-w-xs">{t('app.footer.description')}</p>
          </div>

          {/* Navigation */}
          <nav aria-label={t('app.footer.legalNavLabel')} className="md:col-span-1">
            <h3 className="mb-3 text-sm font-semibold text-fg">Linkek</h3>
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <ManageCookiesButton label={t('app.footer.manageCookies')} />
                <Link
                  href={cookiePolicyLink.href}
                  className="font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
                >
                  {t(cookiePolicyLink.labelKey)}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Newsletter */}
          <div className="md:col-span-1">
            <h3 className="mb-3 text-sm font-semibold text-fg">Hírlevél</h3>
            {newsletterStatus === 'success' ? (
              <p className="text-sm text-green-600">Köszönjük a feliratkozást!</p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={newsletterStatus === 'loading'}
                  required
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === 'loading'}
                  className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
                >
                  {newsletterStatus === 'loading' ? 'Küldés...' : 'Feliratkozás'}
                </button>
              </form>
            )}
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground md:col-span-1">
            <h3 className="mb-3 text-sm font-semibold text-fg">Kapcsolat</h3>
            <a
              href="mailto:info@vyndi.com"
              className="font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
            >
              info@vyndi.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
