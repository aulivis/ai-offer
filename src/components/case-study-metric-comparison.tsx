'use client';

import { ArrowRight, TrendingDown } from 'lucide-react';

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
    <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-xl p-6 md:p-8 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Before - Red/Orange tint */}
        <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-sm">
          <div className="text-xs text-red-600 font-semibold mb-2 uppercase tracking-wide">
            Előtte
          </div>
          <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{before.value}</div>
          <div className="text-sm text-gray-600">{before.label}</div>
        </div>

        {/* Arrow with improvement */}
        <div className="text-center">
          <ArrowRight className="w-6 h-8 md:w-8 md:h-10 mx-auto text-gray-400 mb-3 hidden md:block" />
          <div className="bg-green-500 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-lg">
            <TrendingDown className="w-4 h-4" />
            <span className="font-bold">{improvement}</span>
          </div>
        </div>

        {/* After - Green tint */}
        <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
          <div className="text-xs text-green-600 font-semibold mb-2 uppercase tracking-wide">
            Utána
          </div>
          <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1">{after.value}</div>
          <div className="text-sm text-gray-600">Vyndi-val</div>
        </div>
      </div>
      {timeline && (
        <div className="text-center mt-4">
          <div className="text-xs text-gray-600">{timeline}</div>
        </div>
      )}
    </div>
  );
}
