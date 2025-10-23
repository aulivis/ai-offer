"use client";

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type LandingHeaderProps = {
  className?: string;
};

const NAV_ITEMS = [
  { href: '/demo', label: 'Bemutató' },
  { href: '/#case-studies', label: 'Esettanulmányok' },
  { href: '/billing', label: 'Előfizetés' },
];

export default function LandingHeader({ className }: LandingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hash, setHash] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const updateHash = () => {
      if (typeof window !== 'undefined') {
        setHash(window.location.hash);
      }
    };

    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  const isNavItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }

    if (href.includes('#')) {
      const [, targetHash] = href.split('#');
      return pathname === '/' && hash === `#${targetHash}`;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const headerClass = useMemo(
    () =>
      [
        'sticky top-0 z-50 w-full border-b border-border/60 bg-bg/80 text-fg backdrop-blur supports-[backdrop-filter]:bg-bg/60',
        className,
      ]
        .filter(Boolean)
        .join(' '),
    [className],
  );

  const headerStyle = useMemo<CSSProperties>(
    () => ({ position: 'sticky', top: 0, insetInlineStart: 0, insetInlineEnd: 0 }),
    [],
  );

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={headerClass} style={headerStyle}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="text-lg font-bold text-fg" onClick={closeMenu}>
          Propono
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium text-fg-muted md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1 transition-colors duration-200 hover:text-fg"
              aria-current={isNavItemActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-fg-muted transition-colors duration-200 hover:text-fg"
          >
            Bejelentkezés
          </Link>
          <Link
            href="/demo"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-ink shadow-sm transition-all duration-200 hover:shadow-md"
          >
            Ingyenes Próba
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg transition duration-200 hover:bg-bg-muted md:hidden"
          aria-label="Navigáció megnyitása"
          aria-expanded={isMenuOpen}
          aria-controls="landing-navigation"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-border/60 bg-bg px-6 pb-6 pt-4 text-fg md:hidden">
          <nav id="landing-navigation" className="flex flex-col gap-4 text-base font-medium text-fg">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1 transition-colors duration-200 text-fg-muted hover:text-fg"
                aria-current={isNavItemActive(item.href) ? 'page' : undefined}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-base font-medium text-fg-muted transition-colors duration-200 hover:text-fg"
              onClick={closeMenu}
            >
              Bejelentkezés
            </Link>
            <Link
              href="/demo"
              className="rounded-full bg-primary px-5 py-2 text-center text-base font-semibold text-primary-ink shadow-sm transition-all duration-200 hover:shadow-md"
              onClick={closeMenu}
            >
              Ingyenes Próba
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
