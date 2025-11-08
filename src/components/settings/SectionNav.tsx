'use client';

type Section = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

type SectionNavProps = {
  sections: Section[];
  activeSection: string;
  onSectionChange: (id: string) => void;
};

export function SectionNav({ sections, activeSection, onSectionChange }: SectionNavProps) {
  return (
    <nav className="space-y-1" aria-label="Settings sections">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSectionChange(section.id)}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
            activeSection === section.id
              ? 'bg-primary/10 text-primary shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
          aria-current={activeSection === section.id ? 'page' : undefined}
        >
          <span className={`flex-shrink-0 ${activeSection === section.id ? 'text-primary' : 'text-slate-400'}`}>
            {section.icon}
          </span>
          <span>{section.label}</span>
        </button>
      ))}
    </nav>
  );
}











