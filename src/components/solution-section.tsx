import { Check, X, TrendingUp, Clock, AlertTriangle, Palette } from 'lucide-react';
import { FeatureIndicators } from './FeatureIndicators';
import { LandingCTA } from './ui/LandingCTA';

export function SolutionSection() {
  const comparison = [
    {
      metric: 'Ajánlatkészítés ideje',
      icon: Clock,
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
      before: { value: '2-4 óra', subtitle: 'lassú, manuális folyamat' },
      after: { value: '5-10 perc', subtitle: 'automatizált' },
      improvement: '~70% kevesebb idő',
    },
    {
      metric: 'Hibák aránya',
      icon: AlertTriangle,
      iconBg: 'bg-warning/20',
      iconColor: 'text-warning',
      before: { value: 'Gyakori', subtitle: 'kézi ellenőrzést igényel' },
      after: { value: 'Automatikus hibaszűrés', subtitle: 'AI ellenőrzés' },
      improvement: '~95% pontosság',
    },
    {
      metric: 'Dizájn és márkahűség',
      icon: Palette,
      iconBg: 'bg-accent/20',
      iconColor: 'text-accent',
      before: { value: 'Kézi formázás', subtitle: 'eltérő megjelenés' },
      after: { value: 'Automatikus branding', subtitle: 'egységes sablonok' },
      improvement: '~100% márkahű',
    },
  ];

  return (
    <section
      id="solution"
      className="py-20 bg-gradient-to-br from-primary/5 to-primary/5 scroll-mt-20"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Enhanced badge with icon */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-full font-semibold text-sm mb-6 border border-primary/30">
            <Check className="w-4 h-4" />A MEGOLDÁS
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight text-balance">
            A Vyndi elkészíti helyetted az ajánlataidat – gyorsan, pontosan, egységesen
          </h2>

          <p className="text-xl md:text-2xl text-fg-muted max-w-4xl mx-auto leading-relaxed text-pretty">
            Spórolj órákat minden projekten, és érj el akár 70%-os időmegtakarítást teljes
            automatizálással.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-6xl mx-auto relative pt-8">
          {/* Badge positioned above the Vyndi column - outside the table - hidden on mobile */}
          <div
            className="absolute top-0 z-20 hidden lg:block"
            style={{
              left: 'calc(35% + 21.67% + 21.67% / 2)',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-warning text-navy-900 font-bold text-body-small px-6 py-2.5 rounded-full shadow-2xl border-4 border-white whitespace-nowrap">
              Ajánlott
            </div>
          </div>

          {/* Enhanced table with better visual hierarchy and shadows */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-border">
            <style
              dangerouslySetInnerHTML={{
                __html: `
              /* Mobile: First column 5% thinner, 3rd and 4th columns 5% wider */
              .solution-table-header,
              .solution-table-row {
                grid-template-columns: 30% 21.67% 26.67% 21.66%;
              }
              /* Desktop: Original column widths */
              @media (min-width: 768px) {
                .solution-table-header,
                .solution-table-row {
                  grid-template-columns: 35% 21.67% 21.67% 21.66%;
                }
              }
            `,
              }}
            />
            {/* Mobile scroll container */}
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Table Header */}
                <div className="grid bg-navy-900 text-white solution-table-header">
                  {/* Empty cell for row labels */}
                  <div className="p-4 md:p-6"></div>

                  {/* Traditional column with red accent */}
                  <div className="p-4 md:p-6 text-center border-l border-white/10">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-danger/20 rounded-full flex items-center justify-center">
                        <X className="w-5 h-5 text-danger" />
                      </div>
                    </div>
                    <h3 className="font-bold text-base md:text-lg">Hagyományos</h3>
                  </div>

                  {/* Vyndi AI column with turquoise accent and highlight */}
                  <div className="p-4 md:p-6 text-center border-l border-white/10 bg-primary relative">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="font-bold text-base md:text-lg">Vyndi</h3>
                  </div>

                  {/* Improvement column with green accent */}
                  <div className="p-4 md:p-6 text-center border-l border-white/10">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                    </div>
                    <h3 className="font-bold text-base md:text-lg">Fejlődés</h3>
                  </div>
                </div>

                {/* Table Rows */}
                {comparison.map((item, index) => {
                  const Icon = item.icon;
                  const isFirstRow = index === 0;

                  return (
                    <div
                      key={index}
                      className="grid border-t border-border hover:bg-bg transition-colors solution-table-row"
                    >
                      {/* Row Label */}
                      <div className="p-4 md:p-6 flex items-center gap-3">
                        <div
                          className={`w-10 h-10 md:w-12 md:h-12 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${item.iconColor}`} />
                        </div>
                        <div>
                          <div className="font-bold text-navy-900 text-sm md:text-base">
                            {item.metric}
                          </div>
                        </div>
                      </div>

                      {/* Traditional Value */}
                      <div className="p-4 md:p-6 flex items-center justify-center border-l border-border bg-danger/10">
                        <div className="text-center">
                          <div
                            className={`${isFirstRow ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'} font-bold text-danger mb-1`}
                          >
                            {item.before.value}
                          </div>
                          <div className="text-xs md:text-sm text-fg-muted">
                            {item.before.subtitle}
                          </div>
                        </div>
                      </div>

                      {/* Vyndi AI Value */}
                      <div className="p-4 md:p-6 flex items-center justify-center border-l border-border bg-primary/10">
                        <div className="text-center">
                          <div
                            className={`${isFirstRow ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'} font-bold text-primary mb-1`}
                          >
                            {item.after.value}
                          </div>
                          <div className="text-xs md:text-sm text-fg-muted">
                            {item.after.subtitle}
                          </div>
                        </div>
                      </div>

                      {/* Improvement */}
                      <div className="p-4 md:p-6 flex items-center justify-center border-l border-border">
                        <div className="inline-flex items-center gap-2 bg-success/20 text-success px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold border border-success/30">
                          <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                          {item.improvement}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile scroll hint */}
            <div className="md:hidden px-6 py-3 bg-bg text-center text-sm text-fg-muted border-t border-border">
              ← Görgess vízszintesen a teljes táblázatért →
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-lg text-fg-muted mb-6 text-pretty">
            Tapasztald meg, milyen gyors és egyszerű lehet az ajánlatkészítés. Készítsd el az első
            ajánlatodat még ma – ingyen.
          </p>
          <LandingCTA>Próbáld ki ingyen</LandingCTA>
          <div className="mt-6">
            <FeatureIndicators mobileOnly={['noCard']} />
          </div>
        </div>
      </div>
    </section>
  );
}
