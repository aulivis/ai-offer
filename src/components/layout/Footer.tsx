import Link from 'next/link';
import { t, type CopyKey } from '@/copy';

import { ManageCookiesButton } from '@/components/cookies/ManageCookiesButton';
import { envServer } from '@/env.server';

type NavigationLink = {
  href: string;
  labelKey: CopyKey;
};

const navigationLinks: ReadonlyArray<NavigationLink> = [
  { href: '/privacy-policy', labelKey: 'app.footer.legalLinks.privacy' },
  { href: '/cookie-policy', labelKey: 'app.footer.legalLinks.cookies' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-20 border-t border-border bg-bg/80 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <span className="text-base font-medium text-fg">
            {t('app.footer.copyrightPrefix')} {currentYear} {t('app.footer.brand')}
          </span>
          <p className="max-w-xs">{t('app.footer.description')}</p>
        </div>

        <nav aria-label={t('app.footer.legalNavLabel')}>
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
            <li>
              <ManageCookiesButton label={t('app.footer.manageCookies')} />
            </li>
          </ul>
        </nav>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <span className="text-base font-medium text-fg">{t('app.footer.contactHeading')}</span>
          <a
            href={`mailto:${envServer.PUBLIC_CONTACT_EMAIL}`}
            className="font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
          >
            {envServer.PUBLIC_CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
