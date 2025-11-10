import {
  Check,
  X,
  Sparkles,
  FileText,
  Users,
  Bell,
  Link2,
  Smartphone,
  BarChart3,
  Headphones,
} from 'lucide-react';
import Link from 'next/link';

export function ComparisonTable() {
  const features = [
    {
      name: 'AI-alapú ajánlatkészítés',
      icon: Sparkles,
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Automatikus tartalom generálás AI-val',
      highlight: true, // Key differentiator
    },
    {
      name: 'Testreszabható sablonok',
      icon: FileText,
      vyndi: true,
      competitor1: true,
      competitor2: true,
      description: 'Saját márka dizájn alkalmazása',
    },
    {
      name: 'Valós idejű együttműködés',
      icon: Users,
      vyndi: true,
      competitor1: false,
      competitor2: true,
      description: 'Csapat tagokkal való közös munka',
    },
    {
      name: 'Automatikus follow-up',
      icon: Bell,
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Email emlékeztetés és nyomon követés',
      highlight: true,
    },
    {
      name: 'Integrációk (CRM, email)',
      icon: Link2,
      vyndi: true,
      competitor1: true,
      competitor2: false,
      description: 'Összeköttetés meglévő eszközökkel',
    },
    {
      name: 'Mobilalkalmazás',
      icon: Smartphone,
      vyndi: true,
      competitor1: false,
      competitor2: true,
      description: 'iOS és Android támogatás',
    },
    {
      name: 'Analitika és riportok',
      icon: BarChart3,
      vyndi: true,
      competitor1: true,
      competitor2: false,
      description: 'Részletes teljesítmény metrikák',
    },
    {
      name: '24/7 Ügyfélszolgálat',
      icon: Headphones,
      vyndi: true,
      competitor1: false,
      competitor2: false,
      description: 'Non-stop támogatás minden csatornán',
      highlight: true,
    },
  ];

  // Calculate feature counts
  const vyndiCount = features.filter((f) => f.vyndi).length;
  const competitor1Count = features.filter((f) => f.competitor1).length;
  const competitor2Count = features.filter((f) => f.competitor2).length;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm mb-6">
            ÖSSZEHASONLÍTÁS
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight text-balance">
            Vyndi vs. versenytársak
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            Miért választják a legjobb vállalkozások a Vyndit az ajánlatkészítéshez?
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-6xl mx-auto">
          {/* Enhanced table with better shadows and rounded corners */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-navy-900">
              {/* Features Column Header */}
              <div className="p-6 flex items-center">
                <h3 className="font-bold text-white text-lg">Funkciók</h3>
              </div>

              {/* Competitor A Header */}
              <div className="p-6 text-center border-l border-white/10">
                <h3 className="font-semibold text-gray-400 text-base">Versenytárs A</h3>
              </div>

              {/* Vyndi Header - Prominent turquoise highlight with badge */}
              <div className="p-6 text-center border-l border-white/10 bg-gradient-to-b from-turquoise-600 to-turquoise-700 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-yellow-400 text-navy-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    LEGJOBB VÁLASZTÁS
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-white text-xl">Vyndi</h3>
                </div>
              </div>

              {/* Competitor B Header */}
              <div className="p-6 text-center border-l border-white/10">
                <h3 className="font-semibold text-gray-400 text-base">Versenytárs B</h3>
              </div>
            </div>

            {/* Feature Rows */}
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`grid grid-cols-4 border-t border-gray-200 hover:bg-gray-50 transition-colors ${
                    feature.highlight ? 'bg-turquoise-50/30' : ''
                  }`}
                >
                  {/* Feature Name & Description */}
                  <div className="p-6 flex items-start gap-4">
                    {/* Added feature icons in colored circles */}
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-navy-900 mb-1 text-balance">
                        {feature.name}
                      </div>
                      <div className="text-sm text-gray-500 text-pretty">{feature.description}</div>
                    </div>
                  </div>

                  {/* Competitor A */}
                  <div className="p-6 flex items-center justify-center border-l border-gray-200">
                    {/* Larger icons with color-coding */}
                    {feature.competitor1 ? (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <X className="w-5 h-5 text-gray-400" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Vyndi Column - Highlighted */}
                  {/* Strong turquoise background to emphasize Vyndi column */}
                  <div className="p-6 flex items-center justify-center border-l border-gray-200 bg-turquoise-50">
                    {feature.vyndi ? (
                      <div className="w-10 h-10 bg-turquoise-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-6 h-6 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <X className="w-6 h-6 text-gray-400" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Competitor B */}
                  <div className="p-6 flex items-center justify-center border-l border-gray-200">
                    {feature.competitor2 ? (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <X className="w-5 h-5 text-gray-400" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Summary Row */}
            {/* Added summary footer showing feature count */}
            <div className="grid grid-cols-4 bg-gray-50 border-t-2 border-gray-300">
              <div className="p-6 flex items-center">
                <span className="font-bold text-navy-900">Összesen</span>
              </div>

              <div className="p-6 text-center border-l border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{competitor1Count}/8</div>
                <div className="text-xs text-gray-500">funkció</div>
              </div>

              <div className="p-6 text-center border-l border-gray-200 bg-turquoise-50">
                <div className="text-3xl font-bold text-turquoise-600">{vyndiCount}/8</div>
                <div className="text-xs text-turquoise-700 font-semibold">MINDEN funkció</div>
              </div>

              <div className="p-6 text-center border-l border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{competitor2Count}/8</div>
                <div className="text-xs text-gray-500">funkció</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6 text-pretty">Készen állsz a váltásra?</p>
          <Link
            href="/login?redirect=/new"
            className="inline-block bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold px-12 py-5 rounded-xl text-lg shadow-2xl hover:shadow-2xl transition-all transform hover:scale-105 min-h-[44px]"
          >
            Kezdd el ingyen →
          </Link>
          <p className="text-sm text-gray-500 mt-4 text-pretty">
            Minden funkció elérhető • Nincs kártyaszám szükséges
          </p>
        </div>
      </div>
    </section>
  );
}
