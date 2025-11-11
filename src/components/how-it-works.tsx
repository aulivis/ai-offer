'use client';

import { Upload, Wand2, Send, Zap, Sparkles } from 'lucide-react';
import { FeatureIndicators } from './FeatureIndicators';
import { LandingCTA } from './ui/LandingCTA';

export function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      number: '01',
      title: 'Add meg az alapadatokat',
      description:
        'Add meg az alapadatokat – ügyfél, projekt, költségek – vagy használd a mentett sablonokat.',
    },
    {
      icon: Wand2,
      number: '02',
      title: 'A Vyndi elkészíti az ajánlatot',
      description:
        'A Vyndi elkészíti az ajánlatot – néhány perc alatt, egységes dizájnnal és árazással.',
    },
    {
      icon: Send,
      number: '03',
      title: 'Töltsd le és küldd el',
      description: 'Töltsd le és küldd el – azonnal, PDF-ben vagy linkként.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center space-y-8 md:space-y-12 mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 font-bold text-sm rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            EGYSZERŰ FOLYAMAT
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-navy-900 mb-4 leading-tight">
            Hogyan működik?
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto text-pretty leading-relaxed">
            Készíts professzionális, személyre szabott ajánlatokat 3 egyszerű lépésben
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative max-w-7xl mx-auto mt-16">
          {/* Cards grid */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-6 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isMiddle = idx === 1;
              const bgColors = ['bg-turquoise-100', 'bg-blue-100', 'bg-green-100'];
              const checkTextColors = ['text-turquoise-600', 'text-blue-600', 'text-green-600'];
              const gradients = [
                'from-turquoise-500 to-turquoise-600',
                'from-blue-500 to-blue-600',
                'from-green-500 to-green-600',
              ];
              const glowColors = ['bg-turquoise-400', 'bg-blue-400', 'bg-green-400'];

              return (
                <div
                  key={step.number}
                  className={`relative bg-white rounded-xl md:rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border ${
                    isMiddle
                      ? 'border-2 border-turquoise-200 md:scale-105 shadow-xl'
                      : 'border border-gray-100'
                  } group h-full flex flex-col`}
                >
                  {/* Number badge at top - larger for mobile */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="relative">
                      {/* Glow effect */}
                      <div
                        className={`absolute inset-0 ${glowColors[idx]} rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity`}
                      ></div>
                      {/* Badge - larger size for mobile: w-14 h-14 on mobile, w-10 h-10 on desktop */}
                      <div
                        className={`relative w-14 h-14 md:w-10 md:h-10 bg-gradient-to-br ${gradients[idx]} rounded-full flex items-center justify-center shadow-lg`}
                      >
                        <span className="text-xl md:text-xl font-bold text-white">
                          {step.number}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Centered icon - larger for mobile */}
                  <div className="mt-6 mb-6 flex justify-center">
                    <div
                      className={`w-20 h-20 md:w-20 md:h-20 ${bgColors[idx]} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-10 h-10 ${checkTextColors[idx]}`} />
                    </div>
                  </div>

                  {/* Centered content with improved spacing */}
                  <div className="text-center mb-4 md:mb-6 flex-1 flex flex-col">
                    <h3 className="text-xl md:text-2xl font-bold text-navy-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed text-pretty mb-4">
                      {step.description}
                    </p>
                  </div>

                  {/* AI-powered badge at bottom of middle card */}
                  {isMiddle && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-blue-500 to-turquoise-500 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                        AI-VEZÉRELT
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time indicator below cards */}
        <div className="flex justify-center mt-12">
          <div className="inline-flex items-center gap-4 bg-white rounded-2xl px-8 py-4 shadow-lg border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-turquoise-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">
                TELJES FOLYAMAT
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-turquoise-600 to-blue-600 bg-clip-text text-transparent">
                ~5 perc
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="text-center mt-12">
          {/* Main CTA Button - Mobile optimized */}
          <div className="mb-6">
            <LandingCTA size="md" className="w-full md:w-auto justify-center">
              Próbáld ki most ingyen
            </LandingCTA>
          </div>

          {/* Trust indicators with icons */}
          <FeatureIndicators mobileOnly={['noCard']} />
        </div>
      </div>
    </section>
  );
}
