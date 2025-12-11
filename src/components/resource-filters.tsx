'use client';

import { useState } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';
import { ResourceFilters } from '@/types/resource';

interface ResourceFiltersProps {
  activeFilters: ResourceFilters;
  onFilterChange: (filters: ResourceFilters) => void;
  resultCount: number;
}

const topics = [
  'Minden téma',
  'Ajánlatkészítés',
  'AI használat',
  'Sablon készítés',
  'Értékesítési tippek',
  'Hatékonyság',
  'Dizájn',
  'Automatizálás',
];

const difficulties = ['Minden szint', 'Kezdő', 'Haladó', 'Szakértő'];

const formats = ['Minden formátum', 'Rövid (< 5 perc)', 'Közepes (5-15 perc)', 'Hosszú (15+ perc)'];

export function ResourceFiltersComponent({
  activeFilters,
  onFilterChange,
  resultCount,
}: ResourceFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('Minden téma');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Minden szint');
  const [selectedFormat, setSelectedFormat] = useState('Minden formátum');

  const clearFilters = () => {
    onFilterChange({
      type: [],
      topic: [],
      difficulty: [],
      format: [],
    });
    setSelectedTopic('Minden téma');
    setSelectedDifficulty('Minden szint');
    setSelectedFormat('Minden formátum');
  };

  const activeFiltersCount =
    activeFilters.type.length +
    activeFilters.topic.length +
    activeFilters.difficulty.length +
    activeFilters.format.length;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      {/* Type Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-fg-muted" />
          <label className="block text-sm font-bold text-navy-900">Tanulmány típusa</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Összes', 'Útmutatók', 'Blog cikkek', 'Videók', 'Sablonok'].map((type) => {
            const isAllSelected = activeFilters.type.length === 0;
            const isActive = type === 'Összes' ? isAllSelected : activeFilters.type.includes(type);
            return (
              <button
                key={type}
                onClick={() => {
                  if (type === 'Összes') {
                    onFilterChange({ ...activeFilters, type: [] });
                  } else {
                    // Remove 'Összes' logic - toggle individual types
                    const newTypes = isActive
                      ? activeFilters.type.filter((t) => t !== type)
                      : [...activeFilters.type.filter((t) => t !== 'Összes'), type];
                    onFilterChange({ ...activeFilters, type: newTypes });
                  }
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all min-h-[44px] ${
                  isActive ? 'bg-primary text-white' : 'bg-bg-muted text-fg hover:bg-bg'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      <details
        open={isAdvancedOpen}
        onToggle={(e) => setIsAdvancedOpen(e.currentTarget.open)}
        className="group"
      >
        <summary className="flex items-center justify-between cursor-pointer text-navy-900 font-semibold mb-4 list-none">
          <span>További szűrők</span>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
          />
        </summary>

        <div className="grid md:grid-cols-3 gap-6 pt-4">
          {/* Topic Filter */}
          <div>
            <label className="block text-sm font-semibold text-navy-900 mb-2">Téma</label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                if (e.target.value !== 'Minden téma') {
                  onFilterChange({
                    ...activeFilters,
                    topic: [...activeFilters.topic, e.target.value],
                  });
                }
              }}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none min-h-[44px]"
            >
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-semibold text-navy-900 mb-2">Nehézség</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                if (e.target.value !== 'Minden szint') {
                  onFilterChange({
                    ...activeFilters,
                    difficulty: [...activeFilters.difficulty, e.target.value],
                  });
                }
              }}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none min-h-[44px]"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div>
            <label className="block text-sm font-semibold text-navy-900 mb-2">Formátum</label>
            <select
              value={selectedFormat}
              onChange={(e) => {
                setSelectedFormat(e.target.value);
                if (e.target.value !== 'Minden formátum') {
                  onFilterChange({
                    ...activeFilters,
                    format: [...activeFilters.format, e.target.value],
                  });
                }
              }}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none min-h-[44px]"
            >
              {formats.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-navy-900">Aktív szűrők:</span>
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:underline font-semibold"
            >
              Összes törlése
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ...activeFilters.type,
              ...activeFilters.topic,
              ...activeFilters.difficulty,
              ...activeFilters.format,
            ].map((filter) => (
              <span
                key={filter}
                className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {filter}
                <button
                  onClick={() => {
                    const newFilters = { ...activeFilters };
                    if (activeFilters.type.includes(filter)) {
                      newFilters.type = newFilters.type.filter((t) => t !== filter);
                    } else if (activeFilters.topic.includes(filter)) {
                      newFilters.topic = newFilters.topic.filter((t) => t !== filter);
                    } else if (activeFilters.difficulty.includes(filter)) {
                      newFilters.difficulty = newFilters.difficulty.filter((d) => d !== filter);
                    } else if (activeFilters.format.includes(filter)) {
                      newFilters.format = newFilters.format.filter((f) => f !== filter);
                    }
                    onFilterChange(newFilters);
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Result Count */}
      <div className="mt-4 text-sm text-fg-muted">
        <span className="font-bold text-navy-900">{resultCount}</span> erőforrás találva
      </div>
    </div>
  );
}
