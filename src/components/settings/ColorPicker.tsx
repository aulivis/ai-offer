'use client';

import { Input } from '@/components/ui/Input';

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  previewColor: string;
};

export function ColorPicker({ label, value, onChange, error, previewColor }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">{label}</label>
      <div className="flex items-center gap-3">
        <div className="group relative h-14 w-20 flex-shrink-0">
          <input
            type="color"
            value={previewColor}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-xl border-2 border-border opacity-0 transition-all hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl border-2 border-border shadow-inner transition-all group-hover:shadow-md"
            style={{ backgroundColor: previewColor }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/0 transition-all group-hover:bg-white/10" />
        </div>
        <div className="flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#1c274c"
            className="font-mono text-sm"
            error={error}
          />
        </div>
      </div>
    </div>
  );
}