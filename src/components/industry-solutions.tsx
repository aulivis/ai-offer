import { Briefcase, Megaphone, Code, Users, PenTool, Building2 } from 'lucide-react';
import Link from 'next/link';

export function IndustrySolutions() {
  const industries = [
    {
      icon: Megaphone,
      name: 'Marketing Ügynökségek',
      description:
        'Gyorsabb kampányajánlatok, automatizált árazás és brandelt sablonok ügyfélkapcsolataid erősítéséhez.',
      features: [
        'Kampány költségvetés kalkulátor',
        'Többcsatornás ajánlatok',
        'ROI előrejelzés',
        'Ügyfél brand integráció',
      ],
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Code,
      name: 'IT és Szoftverfejlesztés',
      description:
        'Projekt scope ajánlatok óra alapú árazással, milestone tervezéssel és műszaki specifikációkkal.',
      features: [
        'Technikai követelmények',
        'Sprint alapú árazás',
        'API dokumentáció csatolás',
        'Karbantartási csomagok',
      ],
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: PenTool,
      name: 'Kreatív és Dizájn',
      description:
        'Vizuális portfolió beágyazás, kreatív koncepció bemutatás és revíziós keretrendszer ajánlatokban.',
      features: [
        'Portfolio galéria',
        'Vizuális mock-up csatolás',
        'Revíziós keretek',
        'Branding package opciók',
      ],
      color: 'pink',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: Users,
      name: 'Tanácsadás és Coaching',
      description:
        'Egyedi tanácsadói csomagok, workshop ajánlatok és óraalapú vagy projekt alapú konstrukciók.',
      features: [
        'Csomag alapú árazás',
        'Workshop tematikák',
        'Folyamatos támogatás opciók',
        'Személyre szabott megközelítés',
      ],
      color: 'green',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Building2,
      name: 'Építőipar és Kivitelezés',
      description:
        'Anyagkalkuláció, munkaóra becslés és projekt ütemterv automatikusan generálva minden ajánlatban.',
      features: [
        'Anyagköltség kalkulátor',
        'Munkaóra becslés',
        'Projekt ütemterv',
        'Garanciális feltételek',
      ],
      color: 'orange',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: Briefcase,
      name: 'Üzleti Szolgáltatások',
      description:
        'Általános szolgáltatási ajánlatok egyszerű testreszabással és gyors kliens jóváhagyással.',
      features: [
        'Szolgáltatás katalógus',
        'Moduláris árazás',
        'Online aláírás',
        'SLA meghatározás',
      ],
      color: 'indigo',
      gradient: 'from-indigo-500 to-purple-500',
    },
  ];

  const colorClasses = {
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-100 text-purple-600',
      border: 'border-purple-200',
      hover: 'hover:border-purple-400',
      text: 'text-purple-600',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:border-blue-400',
      text: 'text-blue-600',
    },
    pink: {
      bg: 'bg-pink-50',
      icon: 'bg-pink-100 text-pink-600',
      border: 'border-pink-200',
      hover: 'hover:border-pink-400',
      text: 'text-pink-600',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-100 text-green-600',
      border: 'border-green-200',
      hover: 'hover:border-green-400',
      text: 'text-green-600',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'bg-orange-100 text-orange-600',
      border: 'border-orange-200',
      hover: 'hover:border-orange-400',
      text: 'text-orange-600',
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'bg-indigo-100 text-indigo-600',
      border: 'border-indigo-200',
      hover: 'hover:border-indigo-400',
      text: 'text-indigo-600',
    },
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-turquoise-600 font-semibold text-sm uppercase tracking-wide mb-3">
            IPARÁG-SPECIFIKUS MEGOLDÁSOK
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
            Minden iparághoz megfelelő megoldás
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            A Vyndi alkalmazkodik a te iparágadhoz, speciális sablonokkal és funkciókkal minden
            területre
          </p>
        </div>

        {/* Industry Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            const colors = colorClasses[industry.color as keyof typeof colorClasses];

            return (
              <div
                key={index}
                className={`group bg-white rounded-xl p-8 border-2 ${colors.border} ${colors.hover} transition-all hover:shadow-xl hover:-translate-y-1`}
              >
                {/* Icon with gradient background */}
                <div className="mb-6 relative">
                  <div
                    className={`w-16 h-16 rounded-lg ${colors.icon} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${industry.gradient} opacity-0 group-hover:opacity-10 rounded-lg transition-opacity`}
                  />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-navy-900 mb-3 text-balance">
                  {industry.name}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6 text-pretty">
                  {industry.description}
                </p>

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  {industry.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${colors.text} mt-2 flex-shrink-0`}
                      />
                      <span className="text-sm text-gray-700 text-pretty">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  href="/login?redirect=/new"
                  className={`w-full ${colors.text} border-2 ${colors.border} hover:bg-gradient-to-r ${industry.gradient} hover:text-white hover:border-transparent font-semibold py-3 px-4 rounded-lg transition-all min-h-[44px] flex items-center justify-center text-balance`}
                >
                  Ismerd meg a megoldást
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4 text-lg text-pretty">
            Nem találod az iparágad? A Vyndi bármilyen üzleti területen használható.
          </p>
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
