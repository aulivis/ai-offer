'use client';

import { useState, useEffect } from 'react';
import { List, ChevronDown } from 'lucide-react';

interface TOCItem {
  id: string;
  title: string;
}

interface BlogTOCProps {
  items: TOCItem[];
  mobile?: boolean;
}

export function BlogTOC({ items, mobile = false }: BlogTOCProps) {
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
        (section) => section && section.top <= 150 && section.bottom >= 150,
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
      const offset = 100;
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

  // Calculate progress
  const progress = items.findIndex((item) => item.id === activeSection) + 1;
  const progressPercent = (progress / items.length) * 100 || 0;

  if (mobile) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-teal-500 transition-colors"
          aria-expanded={isOpen}
          aria-label="Tartalomjegyzék megnyitása"
        >
          <span className="font-semibold text-gray-900">Tartalomjegyzék</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="mt-2 bg-white border-2 border-gray-200 rounded-xl p-4">
            <nav className="space-y-2">
              {items.map((item, index) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(item.id);
                  }}
                  className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
                    activeSection === item.id
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}. {item.title}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <List className="w-5 h-5 text-teal-500" />
        <span>Tartalomjegyzék</span>
      </h3>
      <nav className="space-y-2">
        {items.map((item, index) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              handleClick(item.id);
            }}
            className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
              activeSection === item.id
                ? 'bg-teal-50 text-teal-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {index + 1}. {item.title}
          </a>
        ))}
      </nav>

      {/* Reading progress */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Haladás</span>
          <span className="font-semibold">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
