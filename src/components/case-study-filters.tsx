'use client';

import { X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FilterOption {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selected: string;
  onSelect: (id: string) => void;
}

function FilterDropdown({ label, options, selected, onSelect }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.id === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-left flex items-center justify-between hover:border-turquoise-500 focus:outline-none focus:ring-2 focus:ring-turquoise-100 min-h-[44px]"
      >
        <span className="text-sm font-semibold text-gray-700">
          {selectedOption?.label || label}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onSelect(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selected === option.id
                    ? 'bg-turquoise-50 text-turquoise-600 font-semibold'
                    : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export interface CaseStudyFilters {
  companySize: string;
  resultsType: string;
  useCase: string;
}

interface CaseStudyFiltersProps {
  filters: CaseStudyFilters;
  onFiltersChange: (filters: CaseStudyFilters) => void;
  resultCount: number;
}

const companySizeOptions: FilterOption[] = [
  { id: 'all', label: 'Összes méret' },
  { id: 'solo', label: 'Egyéni vállalkozó' },
  { id: 'small', label: 'Kisvállalat (2-10 fő)' },
  { id: 'medium', label: 'Középvállalat (11-50 fő)' },
  { id: 'large', label: 'Nagyvállalat (50+ fő)' },
];

const resultsTypeOptions: FilterOption[] = [
  { id: 'all', label: 'Minden eredmény' },
  { id: 'time', label: 'Időmegtakarítás' },
  { id: 'revenue', label: 'Bevételnövekedés' },
  { id: 'efficiency', label: 'Hatékonyság' },
  { id: 'satisfaction', label: 'Ügyfél elégedettség' },
];

const useCaseOptions: FilterOption[] = [
  { id: 'all', label: 'Minden felhasználás' },
  { id: 'proposals', label: 'Ajánlatkészítés' },
  { id: 'presentations', label: 'Prezentáció' },
  { id: 'contracts', label: 'Szerződések' },
  { id: 'reports', label: 'Jelentések' },
  { id: 'suggestions', label: 'Javaslatok' },
];

export function CaseStudyFiltersComponent({
  filters,
  onFiltersChange,
  resultCount,
}: CaseStudyFiltersProps) {
  const activeFilters = [
    filters.companySize !== 'all' && filters.companySize,
    filters.resultsType !== 'all' && filters.resultsType,
    filters.useCase !== 'all' && filters.useCase,
  ].filter(Boolean) as string[];

  const clearFilters = () => {
    onFiltersChange({
      companySize: 'all',
      resultsType: 'all',
      useCase: 'all',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <FilterDropdown
          label="Cégméret"
          options={companySizeOptions}
          selected={filters.companySize}
          onSelect={(id) => onFiltersChange({ ...filters, companySize: id })}
        />
        <FilterDropdown
          label="Eredmény típusa"
          options={resultsTypeOptions}
          selected={filters.resultsType}
          onSelect={(id) => onFiltersChange({ ...filters, resultsType: id })}
        />
        <FilterDropdown
          label="Felhasználási mód"
          options={useCaseOptions}
          selected={filters.useCase}
          onSelect={(id) => onFiltersChange({ ...filters, useCase: id })}
        />
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Aktív szűrők:</span>
          {activeFilters.map((filter) => {
            const allOptions = [...companySizeOptions, ...resultsTypeOptions, ...useCaseOptions];
            const option = allOptions.find((opt) => opt.id === filter);
            return (
              <div
                key={filter}
                className="inline-flex items-center gap-2 px-3 py-1 bg-turquoise-100 text-turquoise-700 rounded-full text-sm font-semibold"
              >
                {option?.label || filter}
                <button
                  onClick={() => {
                    const newFilters = { ...filters };
                    if (companySizeOptions.find((opt) => opt.id === filter)) {
                      newFilters.companySize = 'all';
                    } else if (resultsTypeOptions.find((opt) => opt.id === filter)) {
                      newFilters.resultsType = 'all';
                    } else if (useCaseOptions.find((opt) => opt.id === filter)) {
                      newFilters.useCase = 'all';
                    }
                    onFiltersChange(newFilters);
                  }}
                  className="hover:bg-turquoise-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          <button
            onClick={clearFilters}
            className="text-sm text-turquoise-600 hover:underline font-semibold"
          >
            Szűrők törlése
          </button>
        </div>
      )}

      {/* Result count */}
      <div className="mt-4 text-sm text-gray-600">
        <span className="font-bold text-navy-900">{resultCount}</span> sikertörténet találva
      </div>
    </div>
  );
}
