'use client';

import { Upload, Wand2, Send, Zap, ArrowRight, Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      number: '01',
      title: 'Töltsd fel az adatokat',
      description: 'Add meg az ügyfél adatait vagy használd a meglévő adatbázist',
      bullets: ['Ügyfél adatok hozzáadása', 'Projekt részletek megadása', 'Opcionális sablonok'],
      gradient: 'from-turquoise-400 to-turquoise-600',
      bulletColor: 'text-turquoise-600',
    },
    {
      icon: Wand2,
      number: '02',
      title: 'AI generálja az ajánlatot',
      description: 'Az AI 2 perc alatt professzionális ajánlatot készít',
      bullets: ['Automatikus tartalomgenerálás', 'Professzionális formázás', 'Árazás kalkuláció'],
      gradient: 'from-blue-400 to-blue-600',
      bulletColor: 'text-blue-600',
    },
    {
      icon: Send,
      number: '03',
      title: 'Küldd el azonnal',
      description: 'Testreszabás után küldd el PDF-ben',
      bullets: [
        'Szerkesztés és testreszabás',
        'PDF export egy kattintással',
        'Email vagy link megosztás',
      ],
      gradient: 'from-green-400 to-green-600',
      bulletColor: 'text-green-600',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-turquoise-100 text-turquoise-700 font-bold text-sm rounded-full mb-6">
            EGYSZERŰ FOLYAMAT
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">Hogyan működik?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            Három egyszerű lépésben professzionális ajánlatokat készíthetsz
          </p>
        </div>

        {/* Process Steps with Progress Arrows */}
        <div className="relative max-w-7xl mx-auto mt-16">
          {/* Desktop arrows - positioned absolutely between cards */}
          <div className="hidden lg:block">
            {/* Arrow 1 -> 2 */}
            <div className="absolute top-32 left-[32%] -translate-x-1/2 z-0">
              <svg className="w-16 h-8 text-turquoise-400" viewBox="0 0 64 32" fill="none">
                <path
                  d="M0 16 L56 16 M56 16 L48 8 M56 16 L48 24"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>

            {/* Arrow 2 -> 3 */}
            <div className="absolute top-32 left-[66%] -translate-x-1/2 z-0">
              <svg className="w-16 h-8 text-turquoise-400" viewBox="0 0 64 32" fill="none">
                <path
                  d="M0 16 L56 16 M56 16 L48 8 M56 16 L48 24"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-6 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isMiddle = idx === 1;
              const bgColors = ['bg-turquoise-100', 'bg-blue-100', 'bg-green-100'];
              const checkBgColors = ['bg-turquoise-100', 'bg-blue-100', 'bg-green-100'];
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
                  className={`relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border ${
                    isMiddle
                      ? 'border-2 border-turquoise-200 md:scale-105 shadow-xl'
                      : 'border border-gray-100'
                  } group h-full flex flex-col`}
                >
                  {/* Featured badge for middle card */}
                  {isMiddle && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-blue-500 to-turquoise-500 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                        AI-POWERED
                      </div>
                    </div>
                  )}

                  {/* Large circular number badge at top center */}
                  <div className="flex justify-center mb-6 mt-2">
                    <div className="relative">
                      {/* Glow effect */}
                      <div
                        className={`absolute inset-0 ${glowColors[idx]} rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity`}
                      ></div>
                      {/* Badge */}
                      <div
                        className={`relative w-20 h-20 bg-gradient-to-br ${gradients[idx]} rounded-full flex items-center justify-center shadow-lg`}
                      >
                        <span className="text-3xl font-bold text-white">{step.number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Centered icon */}
                  <div className="flex justify-center mb-6">
                    <div
                      className={`w-20 h-20 ${bgColors[idx]} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-10 h-10 ${checkTextColors[idx]}`} />
                    </div>
                  </div>

                  {/* Centered content */}
                  <div className="text-center mb-6 flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-navy-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-pretty mb-4">
                      {step.description}
                    </p>

                    {/* Centered feature list with better styling */}
                    <ul className="space-y-3 mt-auto flex flex-col items-center">
                      {step.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-center gap-3 text-gray-700">
                          <div
                            className={`w-5 h-5 ${checkBgColors[idx]} rounded-full flex items-center justify-center flex-shrink-0`}
                          >
                            <Check className={`w-3 h-3 ${checkTextColors[idx]} stroke-[3]`} />
                          </div>
                          <span className="text-sm">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

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
        <div className="text-center mt-12">
          {/* Main CTA Button - Larger and more prominent */}
          <div className="mb-6">
            <Link
              href="/login?redirect=/new"
              className="inline-flex items-center gap-3 bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold px-12 py-6 rounded-xl text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 group min-h-[44px]"
            >
              Próbáld ki most ingyen
              <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
              <span>Nincs bankkártya szükséges</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
              <span>30 napos ingyenes próba</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
              <span>Bármikor lemondható</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
