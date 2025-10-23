"use client";

import { useState } from 'react';
import Link from 'next/link';

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

  const headerClass = [
    'sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={headerClass}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="text-lg font-bold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0]"
          onClick={closeMenu}
        >
          Propono
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium text-gray-700 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors duration-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0]"
          >
            Bejelentkezés
          </Link>
          <Link
            href="/demo"
            className="rounded-full bg-[#00E5B0] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0] focus-visible:ring-offset-2"
          >
            Ingyenes Próba
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition duration-200 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0] md:hidden"
          aria-label="Navigáció megnyitása"
          aria-expanded={isMenuOpen}
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
        <div className="border-t border-black/5 px-6 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4 text-base font-medium text-gray-700">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors duration-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0]"
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-base font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0]"
              onClick={closeMenu}
            >
              Bejelentkezés
            </Link>
            <Link
              href="/demo"
              className="rounded-full bg-[#00E5B0] px-5 py-2 text-center text-base font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0] focus-visible:ring-offset-2"
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
