'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Settings, CreditCard, Plus } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { t } from '@/copy';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home, requiresAuth: false },
  { href: '/dashboard', label: t('nav.dashboard'), icon: FileText, requiresAuth: true },
  { href: '/new', label: t('dashboard.actions.newOffer'), icon: Plus, requiresAuth: true },
  { href: '/settings', label: t('nav.settings'), icon: Settings, requiresAuth: true },
  { href: '/billing', label: t('nav.billing'), icon: CreditCard, requiresAuth: false },
];

/**
 * Mobile bottom navigation bar
 * Only visible on mobile devices (< 768px)
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { status: authStatus } = useAuthSession();
  const isAuthenticated = authStatus === 'authenticated';

  // Filter nav items based on auth status
  const visibleItems = NAV_ITEMS.filter((item) => !item.requiresAuth || isAuthenticated);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-lg md:hidden"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 min-w-[60px] transition-colors ${
                active ? 'text-primary' : 'text-fg-muted hover:text-fg'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
