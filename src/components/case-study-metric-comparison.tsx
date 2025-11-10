'use client';

import { ArrowRight, TrendingUp } from 'lucide-react';

interface MetricComparisonProps {
  before: {
    value: string;
    label: string;
  };
  after: {
    value: string;
    label: string;
  };
  improvement: string;
  timeline?: string;
}

export function MetricComparison({ before, after, improvement, timeline }: MetricComparisonProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Before */}
        <div className="text-center">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Előtte</div>
          <div className="text-3xl font-bold text-gray-600 mb-1">{before.value}</div>
          <div className="text-sm text-gray-600">{before.label}</div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="w-8 h-8 text-turquoise-600" />
        </div>

        {/* After */}
        <div className="text-center">
          <div className="text-xs uppercase tracking-wide text-turquoise-600 mb-2 font-semibold">
            Utána
          </div>
          <div className="text-3xl font-bold text-turquoise-600 mb-1">{after.value}</div>
          <div className="text-sm text-navy-900 font-semibold">{after.label}</div>
        </div>
      </div>

      {/* Improvement badge */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold text-sm">
          <TrendingUp className="w-4 h-4" />
          {improvement}
        </div>
        {timeline && <div className="text-xs text-gray-600 mt-2">{timeline}</div>}
      </div>
    </div>
  );
}
