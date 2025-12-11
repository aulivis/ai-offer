'use client';

import {
  Briefcase,
  Megaphone,
  Code,
  Users,
  Palette,
  Building2,
  Check,
  Factory,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { FeatureIndicators } from './FeatureIndicators';
import { LandingCTA } from './ui/LandingCTA';

export function IndustrySolutions() {
  const [expandedIndustry, setExpandedIndustry] = useState<number | null>(null);

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
      gradient: 'from-primary via-primary/90 to-accent',
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
      gradient: 'from-primary via-primary/85 to-primary/70',
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
      gradient: 'from-accent via-accent/90 to-primary/70',
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
      gradient: 'from-success via-success/90 to-primary',
    },
    {
      id: 5,
      icon: Building2,
      name: 'Építőipar és kivitelezés',
      description:
        'Pontos kalkulációk és ütemtervek automatikusan generálva – gyorsabb, átláthatóbb ajánlatkészítéshez.',
      features: ['Anyagköltség-kalkulátor', 'Munkadíj-becslés', 'Projektütemezés'],
      color: 'orange',
      gradient: 'from-warning via-warning/80 to-primary',
    },
    {
      id: 6,
      icon: Briefcase,
      name: 'Üzleti szolgáltatások',
      description: 'Egyszerű ajánlatkészítés minden szolgáltatás-alapú vállalkozás számára.',
      features: ['Szolgáltatás-katalógus', 'Moduláris árazás', 'Könnyen testreszabható sablonok'],
      color: 'indigo',
      gradient: 'from-primary via-primary/80 to-accent',
    },
  ];

  return (
    <section className="py-20 bg-bg">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full font-semibold text-sm mb-6 border border-accent/30">
            <Factory className="w-4 h-4" />
            IPARÁG-SPECIFIKUS MEGOLDÁSOK
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-fg mb-6 leading-tight text-balance">
            Testreszabott funkciók minden vállalkozás számára
          </h2>

          <p className="text-xl text-fg-muted max-w-3xl mx-auto text-pretty">
            A Vyndi alkalmazkodik az iparágad igényeihez — egyedi sablonokkal, automatizált
            árazással és intelligens ajánlatstruktúrával.
          </p>
        </div>

        {/* Industry Cards Grid */}
        {/* Enhanced grid with better cards, larger icons, and hover effects */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {industries.map((industry) => {
            const Icon = industry.icon;
            const isExpanded = expandedIndustry === industry.id;

            return (
              <div
                key={industry.id}
                className="group bg-bg rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-border hover:border-border/70 hover:-translate-y-2 text-center md:text-center overflow-hidden"
              >
                {/* Mobile: Accordion Header - Always visible */}
                <button
                  onClick={() => setExpandedIndustry(isExpanded ? null : industry.id)}
                  className="w-full md:hidden flex items-center justify-between p-6 text-left"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Icon with Gradient Background */}
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${industry.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}
                    >
                      <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    {/* Title - matching comparison table font size */}
                    <h3 className="text-base md:text-lg font-bold text-fg text-balance flex-1">
                      {industry.name}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-fg-muted transition-transform flex-shrink-0 ${
                      isExpanded ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Mobile: Accordion Content - Collapsible */}
                <div
                  className={`md:hidden transition-all duration-300 overflow-hidden ${
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6">
                    {/* Description */}
                    <p className="text-fg-muted mb-4 leading-relaxed text-pretty text-left">
                      {industry.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-3 flex flex-col items-start text-left">
                      <li className="text-fg text-sm font-semibold mb-2 w-full">
                        Fő funkciók:
                      </li>
                      {industry.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 w-full">
                          <Check
                            className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                            strokeWidth={3}
                          />
                          <span className="text-fg text-sm leading-relaxed text-pretty">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Desktop: Full Card - Always visible */}
                <div className="hidden md:block p-8">
                  {/* Icon with Gradient Background */}
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${industry.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg mx-auto`}
                  >
                    <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-fg mb-4 group-hover:text-primary transition-colors text-balance">
                    {industry.name}
                  </h3>

                  {/* Description */}
                  <p className="text-fg-muted mb-6 leading-relaxed text-pretty">
                    {industry.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-3 mb-6 flex flex-col items-start">
                    <li className="text-fg text-sm font-semibold mb-2 w-full">
                      Fő funkciók:
                    </li>
                    {industry.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 w-full">
                        <Check
                          className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                          strokeWidth={3}
                        />
                        <span className="text-fg text-sm leading-relaxed text-pretty">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        {/* Enhanced bottom section with better styling */}
        <div className="text-center bg-gradient-to-br from-bg-muted to-bg rounded-3xl p-12 max-w-4xl mx-auto border border-border">
          <h3 className="text-2xl md:text-3xl font-bold text-fg mb-4 text-balance">
            Nem találod a saját iparágad?
          </h3>

          <p className="text-lg text-fg-muted mb-8 text-pretty">
            A Vyndi bármilyen szolgáltatásra alkalmazható — próbáld ki most, és nézd meg, hogyan
            illik a te folyamataidhoz.
          </p>

          <LandingCTA size="md">Kezdd el ingyen – 5 perc alatt</LandingCTA>

          <div className="mt-6">
            <FeatureIndicators mobileOnly={['noCard']} />
          </div>
        </div>
      </div>
    </section>
  );
}
