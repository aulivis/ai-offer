import { Check, X, Sparkles, FileText, Users, Bell, BarChart3, Headphones } from 'lucide-react';
import { FeatureIndicators } from './FeatureIndicators';
import { LandingCTA } from './ui/LandingCTA';

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
      iconColor: 'bg-blue-100',
      iconTextColor: 'text-blue-600',
    },
    {
      name: 'Testreszabható sablonok',
      icon: FileText,
      vyndi: true,
      competitor1: true,
      competitor2: true,
      description: 'Saját márka dizájn',
      iconColor: 'bg-purple-100',
      iconTextColor: 'text-purple-600',
    },
    {
      name: 'Csapatmunka és együttműködés',
      icon: Users,
      vyndi: true,
      competitor1: false,
      competitor2: true,
      description: 'Csapat tagokkal együtt',
      iconColor: 'bg-green-100',
      iconTextColor: 'text-green-600',
    },
    {
      name: 'Beépített státuszkövetés',
      icon: Bell,
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Email emlékeztetés',
      highlight: true,
      iconColor: 'bg-orange-100',
      iconTextColor: 'text-orange-600',
    },
    {
      name: 'Analitika és riportok',
      icon: BarChart3,
      vyndi: true,
      competitor1: true,
      competitor2: false,
      description: 'Részletes metrikák',
      iconColor: 'bg-cyan-100',
      iconTextColor: 'text-cyan-600',
    },
    {
      name: '24/7 Ügyfélszolgálat',
      icon: Headphones,
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Non-stop támogatás',
      highlight: true,
      iconColor: 'bg-teal-100',
      iconTextColor: 'text-teal-600',
    },
  ];

  // Calculate feature counts (after removing 2 rows)
  const vyndiCount = features.filter((f) => f.vyndi).length;
  const competitor1Count = features.filter((f) => f.competitor1).length;
  const competitor2Count = features.filter((f) => f.competitor2).length;

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            ÖSSZEHASONLÍTÁS
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight text-balance">
            Vyndi vs. versenytársak
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
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
            <div className="bg-yellow-400 text-navy-900 font-bold text-body-small px-6 py-2.5 rounded-full shadow-2xl border-4 border-white whitespace-nowrap">
              ⭐ LEGJOBB VÁLASZTÁS
            </div>
          </div>

          {/* Enhanced table with better shadows and rounded corners */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <table
                  className="w-full min-w-[600px]"
                  style={{ tableLayout: 'fixed', width: '100%' }}
                >
                  <thead>
                    <tr className="bg-navy-900 text-white">
                      {/* Features Column - reduced width */}
                      <th
                        className="px-4 md:px-6 py-5 text-left font-bold text-base md:text-lg align-top md:align-top"
                        style={{ width: '35%' }}
                      >
                        Funkciók
                      </th>

                      {/* Vyndi Column - first column, wider */}
                      <th
                        className="px-4 md:px-6 py-5 text-center font-bold text-base md:text-lg bg-turquoise-600 align-middle md:align-top relative border-l border-white/10"
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
                        className="px-4 md:px-6 py-5 text-center font-bold text-base md:text-lg align-middle md:align-top border-l border-white/10"
                        style={{ width: '20%' }}
                      >
                        Versenytárs A
                      </th>

                      {/* Competitor B - wider */}
                      <th
                        className="px-4 md:px-6 py-5 text-center font-bold text-base md:text-lg align-middle md:align-top border-l border-white/10"
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
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                            feature.highlight ? 'bg-turquoise-50/30' : ''
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
                                <div className="font-bold text-navy-900 text-sm md:text-base mb-1">
                                  {feature.name}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Vyndi Column - first column, 25% width, highlighted */}
                          <td
                            className="px-4 md:px-6 py-4 md:py-6 text-center bg-turquoise-50/50 align-middle border-l border-gray-200"
                            style={{ width: '25%' }}
                          >
                            <div className="flex justify-center items-center">
                              {feature.vyndi ? (
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-turquoise-600 rounded-full flex items-center justify-center shadow-md">
                                  <Check
                                    className="w-5 h-5 md:w-6 md:h-6 text-white"
                                    strokeWidth={3}
                                  />
                                </div>
                              ) : (
                                <X
                                  className="w-6 h-6 md:w-7 md:h-7 text-gray-300"
                                  strokeWidth={2.5}
                                />
                              )}
                            </div>
                          </td>

                          {/* Competitor A - 20% width */}
                          <td
                            className="px-4 md:px-6 py-4 md:py-6 text-center bg-gray-50/50 align-middle border-l border-gray-200"
                            style={{ width: '20%' }}
                          >
                            <div className="flex justify-center items-center">
                              {feature.competitor1 ? (
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <Check
                                    className="w-5 h-5 md:w-6 md:h-6 text-green-600"
                                    strokeWidth={3}
                                  />
                                </div>
                              ) : (
                                <X
                                  className="w-6 h-6 md:w-7 md:h-7 text-gray-300"
                                  strokeWidth={2.5}
                                />
                              )}
                            </div>
                          </td>

                          {/* Competitor B - 20% width */}
                          <td
                            className="px-4 md:px-6 py-4 md:py-6 text-center align-middle border-l border-gray-200"
                            style={{ width: '20%' }}
                          >
                            <div className="flex justify-center items-center">
                              {feature.competitor2 ? (
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <Check
                                    className="w-5 h-5 md:w-6 md:h-6 text-green-600"
                                    strokeWidth={3}
                                  />
                                </div>
                              ) : (
                                <X
                                  className="w-6 h-6 md:w-7 md:h-7 text-gray-300"
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
                    <tr className="bg-gray-50 border-t-2 border-gray-300">
                      <td className="px-4 md:px-6 py-4 md:py-6" style={{ width: '35%' }}>
                        <span className="font-bold text-navy-900 text-sm md:text-base">
                          Összesen
                        </span>
                      </td>

                      <td
                        className="px-4 md:px-6 py-4 md:py-6 text-center bg-turquoise-50/50 border-l border-gray-200"
                        style={{ width: '25%' }}
                      >
                        <div className="text-xl md:text-3xl font-bold text-turquoise-600">
                          {vyndiCount}/6
                        </div>
                        <div className="text-xs text-turquoise-700 font-semibold">
                          MINDEN funkció
                        </div>
                      </td>

                      <td
                        className="px-4 md:px-6 py-4 md:py-6 text-center bg-gray-50/50 border-l border-gray-200"
                        style={{ width: '20%' }}
                      >
                        <div className="text-lg md:text-2xl font-bold text-gray-600">
                          {competitor1Count}/6
                        </div>
                        <div className="text-xs text-gray-500">funkció</div>
                      </td>

                      <td
                        className="px-4 md:px-6 py-4 md:py-6 text-center border-l border-gray-200"
                        style={{ width: '20%' }}
                      >
                        <div className="text-lg md:text-2xl font-bold text-gray-600">
                          {competitor2Count}/6
                        </div>
                        <div className="text-xs text-gray-500">funkció</div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Mobile scroll hint - outside scrollable area */}
            <div className="lg:hidden px-6 py-3 bg-gray-100 text-center text-sm text-gray-600 border-t border-gray-200">
              ← Görgess vízszintesen a teljes táblázatért →
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-6 text-pretty">
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
