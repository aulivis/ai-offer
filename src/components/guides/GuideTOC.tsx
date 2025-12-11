'use client';

import { useState, useEffect } from 'react';
import { List, ChevronDown } from 'lucide-react';

interface TOCItem {
  id: string;
  number: number;
  title: string;
}

interface GuideTOCProps {
  items: TOCItem[];
  mobile?: boolean;
}

export function GuideTOC({ items, mobile = false }: GuideTOCProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [isOpen, setIsOpen] = useState(!mobile);

  useEffect(() => {
    if (mobile) return;

    const handleScroll = () => {
      const sections = items.map((item) => {
        const element = document.getElementById(item.id);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          id: item.id,
          top: rect.top,
          bottom: rect.bottom,
        };
      });

      const currentSection = sections.find(
        (section) => section && section.top <= 100 && section.bottom >= 100,
      );

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [items, mobile]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      if (mobile) {
        setIsOpen(false);
      }
    }
  };

  // Calculate progress (simplified - based on active section)
  const progress = items.findIndex((item) => item.id === activeSection) + 1;
  const progressPercent = (progress / items.length) * 100 || 0;

  if (mobile) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-bg-muted border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary transition-colors"
          aria-expanded={isOpen}
          aria-label="Tartalomjegyzék megnyitása"
        >
          <span className="font-semibold text-fg">Tartalomjegyzék</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="mt-2 bg-bg-muted border border-border rounded-xl p-4">
            <nav className="space-y-2">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(item.id);
                  }}
                  className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-fg-muted hover:bg-bg'
                  }`}
                >
                  <span className="text-primary font-bold mr-2">
                    {String(item.number).padStart(2, '0')}
                  </span>
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-bg-muted rounded-xl border border-border p-6">
      <h3 className="font-bold text-fg mb-4 flex items-center gap-2">
        <List className="w-5 h-5 text-primary" />
        <span>Tartalomjegyzék</span>
      </h3>
      <nav className="space-y-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              handleClick(item.id);
            }}
            className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
              activeSection === item.id
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-fg-muted hover:bg-bg'
            }`}
          >
            <span className="text-primary font-bold mr-2">
              {String(item.number).padStart(2, '0')}
            </span>
            {item.title}
          </a>
        ))}
      </nav>

      {/* Progress indicator */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between text-sm text-fg-muted mb-2">
          <span>Haladás</span>
          <span className="font-semibold text-fg">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-border/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
