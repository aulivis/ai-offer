import {
  Briefcase,
  Megaphone,
  Code,
  Users,
  Palette,
  Building2,
  Check,
  Factory,
} from 'lucide-react';
import Link from 'next/link';
import { FeatureIndicators } from './FeatureIndicators';

export function IndustrySolutions() {
  const industries = [
    {
      id: 1,
      icon: Megaphone,
      name: 'Marketing ügynökségek',
      description:
        'Gyors, egységes ajánlatok kampányokra és szolgáltatáscsomagokra – automatizált árazással és előre elkészített sablonokkal.',
      features: [
        'Kampányköltség-kalkulátor',
        'Előre definiált ajánlatsablonok',
        'Szolgáltatáslista-alapú árazás',
      ],
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 2,
      icon: Code,
      name: 'IT és szoftverfejlesztés',
      description:
        'Projektajánlatok átlátható szerkezettel, moduláris felépítéssel és mérföldkő-tervezéssel.',
      features: [
        'Technikai követelménydokumentum csatolás',
        'Sprint-alapú árazás',
        'Projekt-mérföldkő ütemezés',
      ],
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 3,
      icon: Palette,
      name: 'Kreatív és dizájn',
      description:
        'Esztétikus, strukturált ajánlatok vizuális szolgáltatásokhoz és portfólió-bemutatáshoz.',
      features: [
        'Portfólió-galéria beágyazás',
        'Mockup és koncepció feltöltés',
        'Testreszabható ajánlatsablonok',
      ],
      color: 'pink',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      id: 4,
      icon: Users,
      name: 'Tanácsadás és coaching',
      description:
        'Professzionális ajánlatok konzultációkhoz, workshopokhoz és szolgáltatáscsomagokhoz.',
      features: [
        'Csomag-alapú árazás',
        'Workshop-ajánlat sablonok',
        'Folyamatos támogatási lehetőségek',
      ],
      color: 'green',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      id: 5,
      icon: Building2,
      name: 'Építőipar és kivitelezés',
      description:
        'Pontos kalkulációk és ütemtervek automatikusan generálva – gyorsabb, átláthatóbb ajánlatkészítéshez.',
      features: ['Anyagköltség-kalkulátor', 'Munkadíj-becslés', 'Projektütemezés'],
      color: 'orange',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      id: 6,
      icon: Briefcase,
      name: 'Üzleti szolgáltatások',
      description: 'Egyszerű ajánlatkészítés minden szolgáltatás-alapú vállalkozás számára.',
      features: ['Szolgáltatás-katalógus', 'Moduláris árazás', 'Könnyen testreszabható sablonok'],
      color: 'indigo',
      gradient: 'from-indigo-500 to-blue-500',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-turquoise-100 text-turquoise-700 rounded-full font-semibold text-sm mb-6 border border-turquoise-300">
            <Factory className="w-4 h-4" />
            IPARÁG-SPECIFIKUS MEGOLDÁSOK
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight text-balance">
            Testreszabott funkciók minden vállalkozás számára
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            A Vyndi alkalmazkodik az iparágad igényeihez — egyedi sablonokkal, automatizált
            árazással és intelligens ajánlatstruktúrával.
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
                className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:-translate-y-2 text-center"
              >
                {/* Icon with Gradient Background */}
                {/* Much larger icon with gradient background */}
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${industry.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg mx-auto`}
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
                <ul className="space-y-3 mb-6 flex flex-col items-start">
                  <li className="text-gray-700 text-sm font-semibold mb-2 w-full">Fő funkciók:</li>
                  {industry.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 w-full">
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
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        {/* Enhanced bottom section with better styling */}
        <div className="text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-12 max-w-4xl mx-auto border border-gray-200">
          <h3 className="text-2xl md:text-3xl font-bold text-navy-900 mb-4 text-balance">
            Nem találod a saját iparágad?
          </h3>

          <p className="text-lg text-gray-600 mb-8 text-pretty">
            A Vyndi bármilyen szolgáltatásra alkalmazható — próbáld ki most, és nézd meg, hogyan
            illik a te folyamataidhoz.
          </p>

          <Link
            href="/login?redirect=/new"
            className="inline-block bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold px-8 py-4 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 min-h-[44px]"
          >
            Kezdd el ingyen – 5 perc alatt
          </Link>

          <div className="mt-6">
            <FeatureIndicators />
          </div>
        </div>
      </div>
    </section>
  );
}
