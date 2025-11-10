import { Check, X, Star } from 'lucide-react';
import Link from 'next/link';

export function ComparisonTable() {
  const features = [
    {
      name: 'AI-alapú ajánlatkészítés',
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Automatikus tartalom generálás AI-val',
    },
    {
      name: 'Testreszabható sablonok',
      vyndi: true,
      competitor1: true,
      competitor2: true,
      description: 'Saját márka dizájn alkalmazása',
    },
    {
      name: 'Valós idejű együttműködés',
      vyndi: true,
      competitor1: false,
      competitor2: true,
      description: 'Csapat tagokkal való közös munka',
    },
    {
      name: 'Automatikus follow-up',
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Email emlékeztetők és státusz követés',
    },
    {
      name: 'Integrációk (CRM, email)',
      vyndi: true,
      competitor1: true,
      competitor2: false,
      description: 'Összekapcsolás meglévő eszközökkel',
    },
    {
      name: 'Mobilalkalmazás',
      vyndi: true,
      competitor1: false,
      competitor2: true,
      description: 'iOS és Android támogatás',
    },
    {
      name: 'Analitika és riportok',
      vyndi: true,
      competitor1: true,
      competitor2: false,
      description: 'Részletes teljesítmény metrikák',
    },
    {
      name: '24/7 ügyfélszolgálat',
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Non-stop támogatás minden csatornán',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-turquoise-600 font-semibold text-sm uppercase tracking-wide mb-3">
            ÖSSZEHASONLÍTÁS
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
            Vyndi vs. versenytársak
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            Miért választják a legtöbb vállalkozás a Vyndit az ajánlatkészítéshez?
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-6xl mx-auto">
          {/* Desktop View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 bg-gradient-to-r from-navy-900 to-navy-800 text-white p-6">
              <div className="font-bold text-lg">Funkciók</div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center gap-2 bg-turquoise-500 px-4 py-2 rounded-full">
                  <Star className="w-4 h-4 fill-white" />
                  <span className="font-bold">Vyndi</span>
                </div>
              </div>
              <div className="text-center font-semibold text-gray-300">Versenytárs A</div>
              <div className="text-center font-semibold text-gray-300">Versenytárs B</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-4 p-6 hover:bg-gray-50 transition-colors group"
                >
                  <div>
                    <div className="font-semibold text-navy-900 mb-1 text-balance">
                      {feature.name}
                    </div>
                    <div className="text-sm text-gray-500 text-pretty">{feature.description}</div>
                  </div>

                  {/* Vyndi Column - Highlighted */}
                  <div className="flex items-center justify-center">
                    {feature.vyndi ? (
                      <div className="w-10 h-10 rounded-full bg-turquoise-100 flex items-center justify-center group-hover:scale-110 transition-transform min-h-[44px] min-w-[44px]">
                        <Check className="w-6 h-6 text-turquoise-600 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center min-h-[44px] min-w-[44px]">
                        <X className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Competitor 1 */}
                  <div className="flex items-center justify-center">
                    {feature.competitor1 ? (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center min-h-[44px] min-w-[44px]">
                        <Check className="w-5 h-5 text-gray-500" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center min-h-[44px] min-w-[44px]">
                        <X className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Competitor 2 */}
                  <div className="flex items-center justify-center">
                    {feature.competitor2 ? (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center min-h-[44px] min-w-[44px]">
                        <Check className="w-5 h-5 text-gray-500" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center min-h-[44px] min-w-[44px]">
                        <X className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile View - Card Stack */}
          <div className="md:hidden space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6"
              >
                <h3 className="font-bold text-navy-900 mb-2 text-balance">{feature.name}</h3>
                <p className="text-sm text-gray-600 mb-4 text-pretty">{feature.description}</p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-turquoise-600 mb-2">Vyndi</div>
                    {feature.vyndi ? (
                      <div className="flex items-center justify-center min-h-[44px]">
                        <Check className="w-6 h-6 text-turquoise-600" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center min-h-[44px]">
                        <X className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Verseny A</div>
                    {feature.competitor1 ? (
                      <div className="flex items-center justify-center min-h-[44px]">
                        <Check className="w-6 h-6 text-gray-500" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center min-h-[44px]">
                        <X className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Verseny B</div>
                    {feature.competitor2 ? (
                      <div className="flex items-center justify-center min-h-[44px]">
                        <Check className="w-6 h-6 text-gray-500" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center min-h-[44px]">
                        <X className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4 text-pretty">Készen állsz a váltásra?</p>
          <Link
            href="/login?redirect=/new"
            className="inline-flex items-center justify-center bg-turquoise-600 hover:bg-turquoise-700 text-white font-semibold px-8 py-4 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 min-h-[44px]"
          >
            Kezdd el ingyen
          </Link>
        </div>
      </div>
    </section>
  );
}
