import {
  Check,
  X,
  Sparkles,
  FileText,
  Users,
  Bell,
  BarChart3,
  Headphones,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { FeatureIndicators } from './FeatureIndicators';

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
          {/* Badge positioned above the Vyndi column */}
          {/* Vyndi column center: 50% (features) + 15% (competitor A) + 10% (half of Vyndi's 20%) = 75% */}
          <div
            className="absolute top-0 z-20 hidden lg:block"
            style={{
              left: '75%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-yellow-400 text-navy-900 font-extrabold text-sm px-6 py-2.5 rounded-full shadow-2xl border-4 border-white whitespace-nowrap">
              ⭐ LEGJOBB VÁLASZTÁS
            </div>
          </div>

          {/* Mobile badge - centered above table */}
          <div className="lg:hidden text-center mb-4">
            <div className="inline-block bg-yellow-400 text-navy-900 font-extrabold text-sm px-6 py-2.5 rounded-full shadow-2xl border-4 border-white whitespace-nowrap">
              ⭐ LEGJOBB VÁLASZTÁS
            </div>
          </div>

          {/* Enhanced table with better shadows and rounded corners */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-navy-900 text-white">
                    {/* Features Column - 40% width */}
                    <th
                      className="px-6 py-5 text-left font-bold text-lg align-top"
                      style={{ width: '50%' }}
                    >
                      Funkciók
                    </th>

                    {/* Competitor A - 15% width */}
                    <th
                      className="px-6 py-5 text-center font-bold text-lg align-top"
                      style={{ width: '15%' }}
                    >
                      Versenytárs A
                    </th>

                    {/* Vyndi Column - 30% width with badge area */}
                    <th
                      className="px-6 py-5 text-center font-bold text-lg bg-turquoise-600 align-top relative"
                      style={{ width: '20%' }}
                    >
                      {/* Column content */}
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-6 h-6" />
                        <span>Vyndi</span>
                      </div>
                    </th>

                    {/* Competitor B - 15% width */}
                    <th
                      className="px-6 py-5 text-center font-bold text-lg align-top"
                      style={{ width: '15%' }}
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
                        {/* Feature Name & Description - 40% width */}
                        <td className="px-6 py-6 align-middle" style={{ width: '40%' }}>
                          <div className="flex items-center gap-4">
                            {/* Feature icon in colored circle */}
                            <div
                              className={`w-12 h-12 ${feature.iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}
                            >
                              <Icon className={`w-6 h-6 ${feature.iconTextColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-navy-900 text-base mb-1">
                                {feature.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Competitor A - 15% width */}
                        <td
                          className="px-6 py-6 text-center bg-gray-50/50 align-middle"
                          style={{ width: '15%' }}
                        >
                          <div className="flex justify-center items-center">
                            {feature.competitor1 ? (
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-6 h-6 text-green-600" strokeWidth={3} />
                              </div>
                            ) : (
                              <X className="w-7 h-7 text-gray-300" strokeWidth={2.5} />
                            )}
                          </div>
                        </td>

                        {/* Vyndi Column - 30% width, highlighted */}
                        <td
                          className="px-6 py-6 text-center bg-turquoise-50/50 align-middle"
                          style={{ width: '30%' }}
                        >
                          <div className="flex justify-center items-center">
                            {feature.vyndi ? (
                              <div className="w-10 h-10 bg-turquoise-600 rounded-full flex items-center justify-center shadow-md">
                                <Check className="w-6 h-6 text-white" strokeWidth={3} />
                              </div>
                            ) : (
                              <X className="w-7 h-7 text-gray-300" strokeWidth={2.5} />
                            )}
                          </div>
                        </td>

                        {/* Competitor B - 15% width */}
                        <td className="px-6 py-6 text-center align-middle" style={{ width: '15%' }}>
                          <div className="flex justify-center items-center">
                            {feature.competitor2 ? (
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-6 h-6 text-green-600" strokeWidth={3} />
                              </div>
                            ) : (
                              <X className="w-7 h-7 text-gray-300" strokeWidth={2.5} />
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
                    <td className="px-6 py-6" style={{ width: '40%' }}>
                      <span className="font-bold text-navy-900">Összesen</span>
                    </td>

                    <td className="px-6 py-6 text-center bg-gray-50/50" style={{ width: '15%' }}>
                      <div className="text-2xl font-bold text-gray-600">{competitor1Count}/6</div>
                      <div className="text-xs text-gray-500">funkció</div>
                    </td>

                    <td
                      className="px-6 py-6 text-center bg-turquoise-50/50"
                      style={{ width: '20%' }}
                    >
                      <div className="text-3xl font-bold text-turquoise-600">{vyndiCount}/6</div>
                      <div className="text-xs text-turquoise-700 font-semibold">MINDEN funkció</div>
                    </td>

                    <td className="px-6 py-6 text-center" style={{ width: '15%' }}>
                      <div className="text-2xl font-bold text-gray-600">{competitor2Count}/6</div>
                      <div className="text-xs text-gray-500">funkció</div>
                    </td>
                  </tr>
                </tfoot>
              </table>
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
          <Link
            href="/login?redirect=/new"
            className="inline-flex items-center gap-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold px-12 py-6 rounded-xl text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 group min-h-[44px]"
          >
            Próbáld ki most ingyen
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="mt-6">
            <FeatureIndicators />
          </div>
        </div>
      </div>
    </section>
  );
}
