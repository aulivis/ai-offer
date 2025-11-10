import {
  Briefcase,
  Megaphone,
  Code,
  Users,
  Palette,
  Building2,
  ArrowRight,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export function IndustrySolutions() {
  const industries = [
    {
      id: 1,
      icon: Megaphone,
      name: 'Marketing Ügynökségek',
      description:
        'Gyorsabb kampánykínálatok, automatizált árazás és branding sablonok ügyfélspecifikus eszközláshoz.',
      features: [
        'Kampány költségvetés kalkulátor',
        'Telekamintás ajánlatok',
        'ROI előrejelzés',
        'Ügyfél brand integráció',
      ],
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 2,
      icon: Code,
      name: 'IT és Szoftverfejlesztés',
      description:
        'Projekt scope-ajánlatok, rés alapú árazással, mérföldkő tervezéssel és részletes specifikációkkal.',
      features: [
        'Technikai követelményköt',
        'Sprint alapú árazás',
        'API dokumentáció csatolás',
        'Karbantartás csomagok',
      ],
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 3,
      icon: Palette,
      name: 'Kreatív és Dizájn',
      description:
        'Vizuális portfólió beágyazás, kreatív koncepció bemutatás és revíziós kerenderszer ajánlatokban.',
      features: [
        'Portfólió galéria',
        'Vizuális mock up csatolás',
        'Revíziós körök',
        'Branding package opciók',
      ],
      color: 'pink',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      id: 4,
      icon: Users,
      name: 'Tanácsadás és Coaching',
      description:
        'Egyéni tanácsadó csomagok, workshop ajánlatok és onboarding vagy projekt alapú konstrukciók.',
      features: [
        'Csomag alapú árazás',
        'Workshop bemutató',
        'Folyamatos támogatás opciók',
        'Személyre szabott megközelítés',
      ],
      color: 'green',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      id: 5,
      icon: Building2,
      name: 'Építőipar és Kivitelezés',
      description:
        'Anyagkalkuláció, munkadíjász becslés és projekt ütemterv automatikusan generálva minden ajánlatban.',
      features: [
        'Anyagkalkulás kalkulátor',
        'Munkadíjasz becslés',
        'Projekt ütemterv',
        'Garanciális feltételek',
      ],
      color: 'orange',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      id: 6,
      icon: Briefcase,
      name: 'Üzleti Szolgáltatások',
      description:
        'Általános szolgáltatási ajánlatok egyszerű testreszabással és gyors kilenc jóváhagyásnak.',
      features: [
        'Szolgáltatás katalógus',
        'Moduláris árazás',
        'Online aláírás',
        'SLA meghatározás',
      ],
      color: 'indigo',
      gradient: 'from-indigo-500 to-blue-500',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-turquoise-100 text-turquoise-700 rounded-full font-semibold text-sm mb-6 border border-turquoise-300">
            IPARÁG-SPECIFIKUS MEGOLDÁSOK
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight text-balance">
            Minden iparághoz megfelelő megoldás
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            A Vyndi alkalmazkodik a te iparágadhoz: speciális sablonokkal és funkciókkal minden
            területre
          </p>
        </div>

        {/* Industry Cards Grid */}
        {/* Enhanced grid with better cards, larger icons, and hover effects */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {industries.map((industry) => {
            const Icon = industry.icon;

            return (
              <div
                key={industry.id}
                className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:-translate-y-2"
              >
                {/* Icon with Gradient Background */}
                {/* Much larger icon with gradient background */}
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${industry.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-navy-900 mb-4 group-hover:text-turquoise-600 transition-colors text-balance">
                  {industry.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed text-pretty">
                  {industry.description}
                </p>

                {/* Features List */}
                {/* Better styled bullet points with checkmarks */}
                <ul className="space-y-3 mb-6">
                  {industry.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check
                        className="w-5 h-5 text-turquoise-500 flex-shrink-0 mt-0.5"
                        strokeWidth={3}
                      />
                      <span className="text-gray-700 text-sm leading-relaxed text-pretty">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Link */}
                {/* Transformed text link into prominent button-style link */}
                <Link
                  href="/login?redirect=/new"
                  className="inline-flex items-center gap-2 text-turquoise-600 font-bold hover:text-turquoise-700 group/link transition-colors"
                >
                  <span>Ismerd meg a megoldást</span>
                  <ArrowRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        {/* Enhanced bottom section with better styling */}
        <div className="text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-12 max-w-4xl mx-auto border border-gray-200">
          <h3 className="text-2xl md:text-3xl font-bold text-navy-900 mb-4 text-balance">
            Nem találod az iparágad?
          </h3>

          <p className="text-lg text-gray-600 mb-8 text-pretty">
            A Vyndi bármilyen idézet területen használható. Próbáld ki ingyen!
          </p>

          <Link
            href="/login?redirect=/new"
            className="inline-flex items-center gap-2 bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold px-12 py-5 rounded-xl text-lg shadow-2xl hover:shadow-2xl transition-all transform hover:scale-105 min-h-[44px]"
          >
            Próbáld ki ingyen
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="text-sm text-gray-500 mt-6 text-pretty">
            Ingyenes próba • Nincs bankkártya szükséges • Minden funkció elérhető
          </p>
        </div>
      </div>
    </section>
  );
}
