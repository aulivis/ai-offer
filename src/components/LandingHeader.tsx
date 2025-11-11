'use client';

import { t, type CopyKey } from '@/copy';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';

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
  { href: '/success-stories', labelKey: 'nav.successStories' },
  { href: '/resources', labelKey: 'nav.resources' },
  { href: '/billing', labelKey: 'nav.billing' },
];

const AUTH_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: '/dashboard', labelKey: 'nav.dashboard' },
  { href: '/resources', labelKey: 'nav.resources' },
  { href: '/settings', labelKey: 'nav.settings' },
  { href: '/billing', labelKey: 'nav.billing' },
];

export default function LandingHeader({ className }: LandingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hash, setHash] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { status: authStatus } = useAuthSession();
  const { logout, isLoggingOut } = useLogout();
  const { companyName, logoUrl, monogram } = useBranding();

  const isAuthenticated = authStatus === 'authenticated';
  const navItems = isAuthenticated ? AUTH_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  // Scroll state management for glass morphism effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    // Check initial scroll position
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Enhanced header classes with scroll-based styling
  const headerClass = useMemo(
    () =>
      [
        'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-200/50'
          : 'bg-white backdrop-blur-md border-b border-white/20',
        className,
      ]
        .filter(Boolean)
        .join(' '),
    [className, scrolled],
  );

  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <>
      <header className={headerClass}>
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-6 px-4 md:px-6">
          {/* Enhanced Logo Section */}
          <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
            {logoUrl ? (
              <div className="relative">
                <div className="relative">
                  <Image
                    src={logoUrl}
                    alt={companyName ? `${companyName} logo` : t('nav.brand')}
                    width={220}
                    height={106}
                    priority
                    unoptimized
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYigyNDAsIDI0MCwgMjQwKSIvPjwvc3ZnPg=="
                    sizes="(max-width: 768px) 160px, 220px"
                    className="h-auto w-auto object-contain"
                    style={{ maxHeight: '28mm', maxWidth: '220px' }}
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative w-12 h-12 bg-gradient-to-br from-turquoise-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <span
                    aria-hidden="true"
                    className="text-lg font-bold text-white uppercase tracking-wide"
                  >
                    {monogram}
                  </span>
                </div>
              </div>
            )}
          </Link>

          {/* Enhanced Desktop Navigation Links */}
          <nav className="hidden flex-1 items-center justify-center gap-1 text-base font-medium md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-turquoise-500 group ${
                  isNavItemActive(item.href)
                    ? 'text-navy-900 font-semibold bg-gray-100/80'
                    : 'text-gray-700 hover:bg-gray-100/80 hover:text-navy-900'
                }`}
                {...(isNavItemActive(item.href) && { 'aria-current': 'page' })}
                onClick={closeMenu}
              >
                {t(item.labelKey)}
                {/* Subtle underline animation on hover */}
                {!isNavItemActive(item.href) && (
                  <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-turquoise-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Enhanced CTA Section */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                <Link
                  href="/new"
                  className="relative px-6 py-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-200 group overflow-hidden"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <span className="relative flex items-center gap-2">
                    {t('dashboard.actions.newOffer')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  className="px-5 py-2.5 text-base font-semibold rounded-lg border border-[#1E3A5F] text-[#1E3A5F] bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  {isLoggingOut ? t('nav.logoutInProgress') : t('nav.logout')}
                </Link>
              </>
            ) : (
              <>
                {/* Enhanced "Bejelentkezés" button instead of plain text */}
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-base font-semibold rounded-lg border border-[#1E3A5F] text-[#1E3A5F] bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  {t('nav.login')}
                </Link>
                {/* Enhanced Primary CTA with glow effect */}
                <Link
                  href="/login"
                  className="relative px-6 py-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-200 group overflow-hidden"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <span className="relative flex items-center gap-2">
                    {t('nav.freeTrial')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Enhanced Mobile menu button */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-900 transition duration-200 hover:bg-gray-100/80 md:hidden min-h-[44px] min-w-[44px]"
            aria-label={t('nav.menuToggle')}
            aria-expanded={isMenuOpen}
            aria-controls="landing-navigation"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu with enhanced styling */}
      {isMenuOpen && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          ></div>

          {/* Mobile Menu Panel */}
          <div className="fixed top-20 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-2xl z-40 md:hidden">
            <div className="container mx-auto px-4 py-6">
              <nav id="landing-navigation" className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors duration-200 min-h-[44px] flex items-center ${
                      isNavItemActive(item.href)
                        ? 'bg-gray-100 text-navy-900 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-navy-900'
                    }`}
                    {...(isNavItemActive(item.href) && { 'aria-current': 'page' })}
                    onClick={closeMenu}
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}

                {/* CTA Section in Mobile Menu */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-3">
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/new"
                        className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold rounded-xl text-center shadow-lg transition-all duration-200 min-h-[44px] flex items-center justify-center gap-2 text-base"
                        onClick={closeMenu}
                      >
                        {t('dashboard.actions.newOffer')}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/login"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                        className="px-4 py-3 text-center text-base font-semibold border border-[#1E3A5F] text-[#1E3A5F] bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center justify-center"
                      >
                        {isLoggingOut ? t('nav.logoutInProgress') : t('nav.logout')}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="px-4 py-3 text-center text-base font-semibold border border-[#1E3A5F] text-[#1E3A5F] bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center justify-center"
                        onClick={closeMenu}
                      >
                        {t('nav.login')}
                      </Link>
                      <Link
                        href="/login"
                        className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold rounded-xl text-center shadow-lg transition-all duration-200 min-h-[44px] flex items-center justify-center gap-2 text-base"
                        onClick={closeMenu}
                      >
                        {t('nav.freeTrial')}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Spacer to prevent content jump when navbar is fixed */}
      <div className="h-20"></div>
    </>
  );
}
