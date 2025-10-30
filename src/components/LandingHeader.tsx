'use client';

import { t, type CopyKey } from '@/copy';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLogout } from '@/hooks/useLogout';
import { useBranding } from '@/components/BrandingProvider';

type LandingHeaderProps = {
  className?: string;
};

type NavItem = {
  href: string;
  labelKey: CopyKey;
};

const PUBLIC_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: '/demo', labelKey: 'nav.demo' },
  { href: '/#case-studies', labelKey: 'nav.caseStudies' },
  { href: '/billing', labelKey: 'nav.billing' },
];

const AUTH_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: '/dashboard', labelKey: 'nav.dashboard' },
  { href: '/settings', labelKey: 'nav.settings' },
  { href: '/billing', labelKey: 'nav.billing' },
];

export default function LandingHeader({ className }: LandingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hash, setHash] = useState('');
  const pathname = usePathname();
  const { status: authStatus } = useAuthSession();
  const { logout, isLoggingOut } = useLogout();
  const { companyName, logoUrl, monogram } = useBranding();

  const isAuthenticated = authStatus === 'authenticated';
  const navItems = isAuthenticated ? AUTH_NAV_ITEMS : PUBLIC_NAV_ITEMS;

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
        'sticky top-0 z-50 w-full bg-bg/80 text-fg backdrop-blur supports-[backdrop-filter]:bg-bg/60',
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
  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <header className={headerClass} style={headerStyle}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-lg font-bold text-[var(--text)]"
          onClick={closeMenu}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={companyName ? `${companyName} logo` : t('nav.brand')}
              width={220}
              height={106}
              priority
              unoptimized
              sizes="(max-width: 768px) 160px, 220px"
              className="h-auto w-auto object-contain"
              style={{ maxHeight: '28mm', maxWidth: '220px' }}
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-primary-contrast)]"
            >
              {monogram}
            </span>
          )}
          <span className="text-lg font-bold">{companyName ?? t('nav.brand')}</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium text-fg-muted md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1 text-fg-muted transition hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isNavItemActive(item.href) ? 'text-fg' : ''
              }`}
              aria-current={isNavItemActive(item.href) ? 'page' : undefined}
              onClick={closeMenu}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                href="/new"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-ink shadow-sm transition-all duration-200 hover:shadow-md"
              >
                {t('dashboard.actions.newOffer')}
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={logout}
                disabled={isLoggingOut}
                aria-busy={isLoggingOut}
                aria-label={t('nav.logoutAria')}
              >
                {isLoggingOut ? t('nav.logoutInProgress') : t('nav.logout')}
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-fg-muted transition-colors duration-200 hover:text-fg"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/demo"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-ink shadow-sm transition-all duration-200 hover:shadow-md"
              >
                {t('nav.freeTrial')}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg transition duration-200 hover:bg-bg-muted md:hidden"
          aria-label={t('nav.menuToggle')}
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
            {isMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {isMenuOpen ? (
        <div className="bg-bg px-6 pb-6 pt-4 text-fg md:hidden">
          <nav
            id="landing-navigation"
            className="flex flex-col gap-4 text-base font-medium text-fg"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1 transition-colors duration-200 text-fg-muted hover:text-fg"
                aria-current={isNavItemActive(item.href) ? 'page' : undefined}
                onClick={closeMenu}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/new"
                  className="rounded-full bg-primary px-5 py-2 text-center text-base font-semibold text-primary-ink shadow-sm transition-all duration-200 hover:shadow-md"
                  onClick={closeMenu}
                >
                  {t('dashboard.actions.newOffer')}
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  aria-busy={isLoggingOut}
                  className="justify-center text-base"
                >
                  {isLoggingOut ? t('nav.logoutInProgress') : t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-base font-medium text-fg-muted transition-colors duration-200 hover:text-fg"
                  onClick={closeMenu}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/demo"
                  className="rounded-full bg-primary px-5 py-2 text-center text-base font-semibold text-primary-ink shadow-sm transition-all duration-200 hover:shadow-md"
                  onClick={closeMenu}
                >
                  {t('nav.freeTrial')}
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
