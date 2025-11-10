import { Check, X, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function SolutionSection() {
  const comparison = [
    {
      metric: 'Ajánlat készítési idő',
      before: '2-4 óra',
      after: '5-10 perc',
      improvement: '70% időmegtakarítás',
    },
    {
      metric: 'Hibák száma',
      before: 'Gyakori',
      after: 'Automatikusan ellenőrzött',
      improvement: '95% pontosság',
    },
    {
      metric: 'Egységes dizájn',
      before: 'Kézi formázás',
      after: 'Automatikus branding',
      improvement: '100% konzisztencia',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-turquoise-50 via-blue-50 to-turquoise-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-turquoise-600 font-semibold text-sm uppercase tracking-wide mb-3">
            A MEGOLDÁS
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6 text-balance">
            Vyndi AI-alapú ajánlatkészítő
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed text-pretty">
            Automatizáld az ajánlatkészítést, spórolj órákat minden ajánlaton, és növeld az üzleti
            eredményeidet akár 70%-kal.
          </p>
        </div>

        {/* Before/After Comparison Table */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-turquoise-200">
          {/* Table Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-navy-900 text-white p-6">
            <div className="hidden md:block"></div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <X className="w-5 h-5 text-red-400" />
                <span className="font-semibold">Hagyományos</span>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Check className="w-5 h-5 text-turquoise-400" />
                <span className="font-semibold">Vyndi AI</span>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="font-semibold">Fejlődés</span>
              </div>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {comparison.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 md:p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="font-semibold text-navy-900 mb-2 md:mb-0 text-balance md:flex md:items-center">
                  {item.metric}
                </div>
                <div className="text-center text-gray-600 md:text-left md:pl-4 md:flex md:items-center">
                  {item.before}
                </div>
                <div className="text-center font-semibold text-turquoise-600 md:text-left md:pl-4 md:flex md:items-center">
                  {item.after}
                </div>
                <div className="text-center md:text-left md:pl-4 md:flex md:items-center">
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium min-h-[44px]">
                    <TrendingUp className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{item.improvement}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/login?redirect=/new"
            className="inline-flex items-center justify-center bg-turquoise-600 hover:bg-turquoise-700 text-white font-semibold px-8 py-4 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[44px]"
          >
            Próbáld ki ingyen
          </Link>
        </div>
      </div>
    </section>
  );
}
