import { Check, X, TrendingUp, Clock, AlertTriangle, Palette, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function SolutionSection() {
  const comparison = [
    {
      metric: 'Ajánlatkészítés ideje',
      icon: Clock,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      before: { value: '2-4 óra', subtitle: 'lassú, manuális folyamat' },
      after: { value: '5-10 perc', subtitle: 'automatizált' },
      improvement: '~70% időmegtakarítás',
    },
    {
      metric: 'Hibák aránya',
      icon: AlertTriangle,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      before: { value: 'Gyakori', subtitle: 'kézi ellenőrzést igényel' },
      after: { value: 'Automatikus hibaszűrés', subtitle: 'AI ellenőrzés' },
      improvement: '~95% pontosság',
    },
    {
      metric: 'Dizájn és márkahűség',
      icon: Palette,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      before: { value: 'Kézi formázás', subtitle: 'eltérő megjelenés' },
      after: { value: 'Automatikus branding', subtitle: 'egységes sablonok' },
      improvement: '~100% konzisztencia',
    },
  ];

  return (
    <section
      id="solution"
      className="py-20 bg-gradient-to-br from-turquoise-50 to-blue-50 scroll-mt-20"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Enhanced badge with icon */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-turquoise-100 text-turquoise-700 rounded-full font-semibold text-sm mb-6 border border-turquoise-300">
            <Check className="w-4 h-4" />A MEGOLDÁS
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight text-balance">
            A Vyndi elkészíti helyetted az ajánlataidat – gyorsan, pontosan, egységesen
          </h2>

          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed text-pretty">
            Spórolj órákat minden projekten, és érj el akár 70 %-os időmegtakarítást teljes
            automatizálással.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-6xl mx-auto">
          {/* Enhanced table with better visual hierarchy and shadows */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-navy-900 text-white">
              {/* Empty cell for row labels */}
              <div className="p-6"></div>

              {/* Traditional column with red accent */}
              <div className="p-6 text-center border-l border-white/10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <h3 className="font-bold text-lg">Hagyományos</h3>
              </div>

              {/* Vyndi AI column with turquoise accent and highlight */}
              <div className="p-6 text-center border-l border-white/10 bg-turquoise-600 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-yellow-400 text-navy-900 font-extrabold text-xs px-4 py-1.5 rounded-full shadow-lg border-2 border-white whitespace-nowrap">
                    Ajánlott
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mb-2 mt-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="font-bold text-lg">Vyndi</h3>
              </div>

              {/* Improvement column with green accent */}
              <div className="p-6 text-center border-l border-white/10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <h3 className="font-bold text-lg">Fejlődés</h3>
              </div>
            </div>

            {/* Table Rows */}
            {comparison.map((item, index) => {
              const Icon = item.icon;
              const isFirstRow = index === 0;

              return (
                <div
                  key={index}
                  className="grid grid-cols-4 border-t border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {/* Row Label */}
                  <div className="p-6 flex items-center gap-3">
                    <div
                      className={`w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>
                    <div>
                      <div className="font-bold text-navy-900 text-lg">{item.metric}</div>
                    </div>
                  </div>

                  {/* Traditional Value */}
                  <div className="p-6 flex items-center justify-center border-l border-gray-200 bg-red-50/50">
                    <div className="text-center">
                      <div
                        className={`${isFirstRow ? 'text-3xl' : 'text-2xl'} font-bold text-red-600 mb-1`}
                      >
                        {item.before.value}
                      </div>
                      <div className="text-sm text-gray-500">{item.before.subtitle}</div>
                    </div>
                  </div>

                  {/* Vyndi AI Value */}
                  <div className="p-6 flex items-center justify-center border-l border-gray-200 bg-turquoise-50">
                    <div className="text-center">
                      <div
                        className={`${isFirstRow ? 'text-3xl' : 'text-2xl'} font-bold text-turquoise-600 mb-1`}
                      >
                        {item.after.value}
                      </div>
                      <div className="text-sm text-gray-600">{item.after.subtitle}</div>
                    </div>
                  </div>

                  {/* Improvement */}
                  <div className="p-6 flex items-center justify-center border-l border-gray-200">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold border border-green-300">
                      <TrendingUp className="w-4 h-4" />
                      {item.improvement}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6 text-pretty">
            Tapasztald meg, milyen gyors és egyszerű lehet az ajánlatkészítés. Készítsd el az első
            ajánlatodat még ma – ingyen.
          </p>
          <Link
            href="/login?redirect=/new"
            className="inline-flex items-center gap-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-[#FFFFFF] font-bold px-12 py-6 rounded-xl text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 group min-h-[44px]"
          >
            Próbáld ki ingyen
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm">
              <Check className="w-4 h-4 mr-2" />
              Kezdd el teljesen ingyen
            </span>
            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm">
              <Check className="w-4 h-4 mr-2" />
              Nem kérünk bankkártyát
            </span>
            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm">
              <Check className="w-4 h-4 mr-2" />
              Kész ajánlat 5 perc alatt
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
