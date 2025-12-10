'use client';

import Link from 'next/link';
import { Settings, CreditCard, Plus, HelpCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { t } from '@/copy';

type SidebarLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SIDEBAR_LINKS: SidebarLink[] = [
  { href: '/new', label: t('dashboard.actions.newOffer'), icon: Plus },
  { href: '/settings', label: t('nav.settings'), icon: Settings },
  { href: '/billing', label: t('nav.billing'), icon: CreditCard },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2" aria-label="Quick navigation">
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-3">
          Gyors műveletek
        </h3>
      </div>
      {SIDEBAR_LINKS.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-fg-muted hover:bg-bg-muted hover:text-fg'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" />
            <span>{link.label}</span>
          </Link>
        );
      })}
      <div className="pt-4 mt-4 border-t border-border">
        <Link
          href="/resources"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-bg-muted hover:text-fg transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Segítség és útmutatók</span>
        </Link>
      </div>
    </nav>
  );
}
