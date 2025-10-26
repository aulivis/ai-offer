import Link from 'next/link';

import { envServer } from '@/env.server';

const navigationLinks = [
  { href: '/privacy-policy', label: 'Adatvédelmi tájékoztató' },
  { href: '/cookie-policy', label: 'Sütikezelési tájékoztató' },
  { href: '/cookie-policy#manage-cookies', label: 'Sütibeállítások kezelése' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-20 border-t border-border bg-bg/80 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <span className="text-base font-medium text-fg">© {currentYear} Propono</span>
          <p className="max-w-xs">
            AI által támogatott, professzionális ajánlatok kis- és középvállalkozások számára.
          </p>
        </div>

        <nav aria-label="Jogi információk">
          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <span className="text-base font-medium text-fg">Kapcsolat</span>
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
