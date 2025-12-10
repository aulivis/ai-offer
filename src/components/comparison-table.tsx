import { Check, X, Sparkles, FileText, Users, Bell, BarChart3, Headphones } from 'lucide-react';
import { FeatureIndicators } from './FeatureIndicators';
import { LandingCTA } from './ui/LandingCTA';
import { H2 } from '@/components/ui/Heading';

export function ComparisonTable() {
  const features = [
    {
      name: 'AI-alapú ajánlatkészítés',
      icon: Sparkles,
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Automatikus AI generálás',
      highlight: true,
      iconColor: 'bg-primary/10',
      iconTextColor: 'text-primary',
    },
    {
      name: 'Testreszabható sablonok',
      icon: FileText,
      vyndi: true,
      competitor1: true,
      competitor2: true,
      description: 'Saját márka dizájn',
      iconColor: 'bg-accent/10',
      iconTextColor: 'text-accent',
    },
    {
      name: 'Csapatmunka és együttműködés',
      icon: Users,
      vyndi: true,
      competitor1: false,
      competitor2: true,
      description: 'Csapat tagokkal együtt',
      iconColor: 'bg-success/10',
      iconTextColor: 'text-success',
    },
    {
      name: 'Beépített státuszkövetés',
      icon: Bell,
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Email emlékeztetés',
      highlight: true,
      iconColor: 'bg-warning/10',
      iconTextColor: 'text-warning',
    },
    {
      name: 'Analitika és riportok',
      icon: BarChart3,
      vyndi: true,
      competitor1: true,
      competitor2: false,
      description: 'Részletes metrikák',
      iconColor: 'bg-primary/10',
      iconTextColor: 'text-primary',
    },
    {
      name: '24/7 Ügyfélszolgálat',
      icon: Headphones,
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Non-stop támogatás',
      highlight: true,
      iconColor: 'bg-primary/10',
      iconTextColor: 'text-primary',
    },
  ];

  // Calculate feature counts (after removing 2 rows)
  const vyndiCount = features.filter((f) => f.vyndi).length;
  const competitor1Count = features.filter((f) => f.competitor1).length;
  const competitor2Count = features.filter((f) => f.competitor2).length;

  return (
    <section className="py-20 bg-gradient-to-b from-bg-muted to-bg">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full font-semibold text-body-small mb-6">
            <Sparkles className="w-4 h-4" />
            ÖSSZEHASONLÍTÁS
          </div>

          <H2 className="mb-6 text-balance" fluid>
            Vyndi vs. versenytársak
          </H2>

          <p className="text-body-large text-fg-muted max-w-3xl mx-auto text-pretty">
            Nézd meg, miért választják a leginnovatívabb vállalkozások a Vyndit az ajánlatkészítés
            új generációjaként.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-6xl mx-auto relative pt-8">
          {/* Badge positioned above the Vyndi column - hidden on mobile */}
          {/* Vyndi column center: 35% (functions) + 25% (half of Vyndi's 50%) = 47.5% */}
          <div
            className="absolute top-0 z-20 hidden lg:block"
            style={{
              left: '47.5%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-warning text-fg font-bold text-body-small px-6 py-2.5 rounded-full shadow-2xl border-4 border-bg-muted whitespace-nowrap">
              ⭐ LEGJOBB VÁLASZTÁS
            </div>
          </div>

          {/* Enhanced table with better shadows and rounded corners */}
          <div className="bg-bg-muted rounded-3xl shadow-2xl overflow-hidden border border-border">
            <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {/* Scroll indicators for mobile */}
              <div
                className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-bg-muted to-transparent md:hidden z-20"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-muted to-transparent md:hidden z-20"
                aria-hidden="true"
              />
              <div className="min-w-full">
                <table
                  className="w-full min-w-[600px] sm:min-w-[700px] md:min-w-full"
                  style={{ tableLayout: 'fixed', width: '100%' }}
                >
                  <thead>
                    <tr className="bg-navy-900 text-primary-ink">
                      {/* Features Column - reduced width */}
                      <th
                        className="px-4 md:px-6 py-5 text-left font-bold text-body md:text-body-large align-top md:align-top"
                        style={{ width: '35%' }}
                      >
                        Funkciók
                      </th>

                      {/* Vyndi Column - first column, wider */}
                      <th
                        className="px-4 md:px-6 py-5 text-center font-bold text-body md:text-body-large bg-primary align-middle md:align-top relative border-l border-primary-ink/10"
                        style={{ width: '25%' }}
                      >
                        {/* Column content */}
                        <div className="flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                          <span>Vyndi</span>
                        </div>
                      </th>

                      {/* Competitor A - wider */}
                      <th
                        className="px-4 md:px-6 py-5 text-center font-bold text-body md:text-body-large align-middle md:align-top border-l border-primary-ink/10"
                        style={{ width: '20%' }}
                      >
                        Versenytárs A
                      </th>

                      {/* Competitor B - wider */}
                      <th
                        className="px-4 md:px-6 py-5 text-center font-bold text-body md:text-body-large align-middle md:align-top border-l border-primary-ink/10"
                        style={{ width: '20%' }}
                      >
                        Versenytárs B
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <tr
                          key={index}
                          className={`border-b border-border hover:bg-bg transition-colors ${
                            feature.highlight ? 'bg-primary/10' : ''
                          }`}
                        >
                          {/* Feature Name & Description - 35% width */}
                          <td
                            className="px-4 md:px-6 py-4 md:py-6 align-middle"
                            style={{ width: '35%' }}
                          >
                            <div className="flex items-center gap-3 md:gap-4">
                              {/* Feature icon in colored circle */}
                              <div
                                className={`w-10 h-10 md:w-12 md:h-12 ${feature.iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}
                              >
                                <Icon
                                  className={`w-5 h-5 md:w-6 md:h-6 ${feature.iconTextColor}`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-fg text-body-small md:text-body mb-1">
                                  {feature.name}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Vyndi Column - first column, 25% width, highlighted */}
                          <td
                            className="px-4 md:px-6 py-4 md:py-6 text-center bg-primary/10 align-middle border-l border-border"
                            style={{ width: '25%' }}
                          >
                            <div className="flex justify-center items-center">
                              {feature.vyndi ? (
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center shadow-md">
                                  <Check
                                    className="w-5 h-5 md:w-6 md:h-6 text-primary-ink"
                                    strokeWidth={3}
                                  />
                                </div>
                              ) : (
                                <X
                                  className="w-6 h-6 md:w-7 md:h-7 text-fg-muted/30"
                                  strokeWidth={2.5}
                                />
                              )}
                            </div>
                          </td>

                          {/* Competitor A - 20% width */}
                          <td
                            className="px-4 md:px-6 py-4 md:py-6 text-center bg-bg align-middle border-l border-border"
                            style={{ width: '20%' }}
                          >
                            <div className="flex justify-center items-center">
                              {feature.competitor1 ? (
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-success/10 rounded-full flex items-center justify-center">
                                  <Check
                                    className="w-5 h-5 md:w-6 md:h-6 text-success"
                                    strokeWidth={3}
                                  />
                                </div>
                              ) : (
                                <X
                                  className="w-6 h-6 md:w-7 md:h-7 text-fg-muted/30"
                                  strokeWidth={2.5}
                                />
                              )}
                            </div>
                          </td>

                          {/* Competitor B - 20% width */}
                          <td
                            className="px-4 md:px-6 py-4 md:py-6 text-center align-middle border-l border-border"
                            style={{ width: '20%' }}
                          >
                            <div className="flex justify-center items-center">
                              {feature.competitor2 ? (
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-success/10 rounded-full flex items-center justify-center">
                                  <Check
                                    className="w-5 h-5 md:w-6 md:h-6 text-success"
                                    strokeWidth={3}
                                  />
                                </div>
                              ) : (
                                <X
                                  className="w-6 h-6 md:w-7 md:h-7 text-fg-muted/30"
                                  strokeWidth={2.5}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Row */}
                  <tfoot>
                    <tr className="bg-bg border-t-2 border-border">
                      <td className="px-4 md:px-6 py-4 md:py-6" style={{ width: '35%' }}>
                        <span className="font-bold text-fg text-body-small md:text-body">
                          Összesen
                        </span>
                      </td>

                      <td
                        className="px-4 md:px-6 py-4 md:py-6 text-center bg-primary/10 border-l border-border"
                        style={{ width: '25%' }}
                      >
                        <div className="text-h4 md:text-h2 font-bold text-primary">
                          {vyndiCount}/6
                        </div>
                        <div className="text-caption text-primary font-semibold">
                          MINDEN funkció
                        </div>
                      </td>

                      <td
                        className="px-4 md:px-6 py-4 md:py-6 text-center bg-bg border-l border-border"
                        style={{ width: '20%' }}
                      >
                        <div className="text-h5 md:text-h3 font-bold text-fg-muted">
                          {competitor1Count}/6
                        </div>
                        <div className="text-caption text-fg-muted">funkció</div>
                      </td>

                      <td
                        className="px-4 md:px-6 py-4 md:py-6 text-center border-l border-border"
                        style={{ width: '20%' }}
                      >
                        <div className="text-h5 md:text-h3 font-bold text-fg-muted">
                          {competitor2Count}/6
                        </div>
                        <div className="text-caption text-fg-muted">funkció</div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Mobile scroll hint - outside scrollable area */}
            <div className="md:hidden px-4 py-2.5 bg-bg text-center text-caption text-fg-muted border-t border-border flex items-center justify-center gap-2">
              <span className="inline-block">←</span>
              <span>Görgess vízszintesen a teljes táblázatért</span>
              <span className="inline-block">→</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <p className="text-body-large text-fg-muted mb-6 text-pretty">
            A Vyndi az egyetlen platform, amely mind a 6 kulcsfontosságú funkciót egy helyen
            kínálja. Takaríts meg időt és készíts professzionális ajánlatokat percek alatt.
          </p>
          <LandingCTA>Próbáld ki most ingyen</LandingCTA>
          <div className="mt-6">
            <FeatureIndicators mobileOnly={['fast']} />
          </div>
        </div>
      </div>
    </section>
  );
}
