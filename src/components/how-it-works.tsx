'use client';

import { Upload, Wand2, Send, Zap, ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { FeatureIndicators } from './FeatureIndicators';

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

        {/* Process Steps with Progress Arrows */}
        <div className="relative max-w-7xl mx-auto mt-16">
          {/* Desktop curved arrows - positioned to connect number badges */}
          <div
            className="hidden lg:block absolute inset-0"
            style={{ height: '180px', top: '-160px', pointerEvents: 'none' }}
          >
            <svg
              className="w-full h-full text-turquoise-400"
              viewBox="0 -140 100 160"
              preserveAspectRatio="none"
            >
              <defs>
                <marker
                  id="arrowhead-howitworks-1"
                  markerWidth="3"
                  markerHeight="3"
                  refX="2.5"
                  refY="1.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 3 1.5, 0 3" fill="currentColor" />
                </marker>
                <marker
                  id="arrowhead-howitworks-2"
                  markerWidth="3"
                  markerHeight="3"
                  refX="2.5"
                  refY="1.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 3 1.5, 0 3" fill="currentColor" />
                </marker>
              </defs>
              {/* Curved Arrow 1 -> 2: from badge 1 right edge (~18%) to badge 2 left edge (~47%) - dramatic arc with y=-100 */}
              <path
                d="M 18 15 Q 32.5 -100, 47 15"
                stroke="currentColor"
                strokeWidth="0.6"
                strokeLinecap="round"
                strokeDasharray="3 3"
                fill="none"
                markerEnd="url(#arrowhead-howitworks-1)"
              />
              {/* Curved Arrow 2 -> 3: from badge 2 right edge (~53%) to badge 3 left edge (~82%) - dramatic arc with y=-100 */}
              <path
                d="M 53 15 Q 67.5 -100, 82 15"
                stroke="currentColor"
                strokeWidth="0.6"
                strokeLinecap="round"
                strokeDasharray="3 3"
                fill="none"
                markerEnd="url(#arrowhead-howitworks-2)"
              />
            </svg>
          </div>

          {/* Cards grid */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-6 relative z-10 pt-12">
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
                  <div className="text-center mb-6 flex-1 flex flex-col">
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

                  {/* Mobile arrow down (except for last card) */}
                  {idx < steps.length - 1 && (
                    <div className="md:hidden flex justify-center mt-8">
                      <div
                        className={`w-12 h-12 ${bgColors[idx]} rounded-full flex items-center justify-center`}
                      >
                        <ChevronDown className={`w-6 h-6 ${checkTextColors[idx]} animate-bounce`} />
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
        <div className="text-center mt-12 relative">
          {/* Curved arrow from bottom of TELJES FOLYAMAT box to CTA */}
          <div
            className="hidden lg:block absolute left-1/2 -translate-x-1/2 -top-24 w-full max-w-md"
            style={{ height: '100px' }}
          >
            <svg
              className="w-full h-full text-turquoise-400"
              viewBox="0 0 200 100"
              preserveAspectRatio="none"
            >
              <defs>
                <marker
                  id="arrowhead-cta"
                  markerWidth="4"
                  markerHeight="4"
                  refX="3.5"
                  refY="2"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 4 2, 0 4" fill="currentColor" />
                </marker>
              </defs>
              {/* Curved arrow from bottom center of TELJES FOLYAMAT box with subtle rightward bow */}
              <path
                d="M 100 100 Q 130 50, 100 0"
                stroke="currentColor"
                strokeWidth="0.6"
                strokeLinecap="round"
                strokeDasharray="2.5 2.5"
                fill="none"
                markerEnd="url(#arrowhead-cta)"
              />
            </svg>
          </div>

          {/* Main CTA Button - Mobile optimized */}
          <div className="mb-6">
            <Link
              href="/login?redirect=/new"
              className="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 md:px-12 md:py-6 rounded-xl text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 group min-h-[56px] w-full md:w-auto justify-center"
            >
              <span>Próbáld ki most ingyen</span>
              <ArrowRight className="w-5 h-5 md:w-7 md:h-7 flex-shrink-0 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          {/* Trust indicators with icons */}
          <FeatureIndicators />
        </div>
      </div>
    </section>
  );
}
