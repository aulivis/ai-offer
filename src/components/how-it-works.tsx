'use client';

import { Upload, Wand2, Send, Zap, ArrowRight, Check } from 'lucide-react';
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
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-turquoise-100 text-turquoise-700 rounded-full font-semibold text-sm mb-4">
            EGYSZERŰ FOLYAMAT
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">Hogyan működik?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Három egyszerű lépésben professzionális ajánlatokat készíthetsz
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative max-w-6xl mx-auto">
          {/* Connecting line between steps (desktop only) */}
          <div className="hidden lg:block absolute top-32 left-0 right-0 h-1 bg-gradient-to-r from-turquoise-300 via-blue-300 to-green-300 mx-32 -z-10"></div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const checkColors = ['text-turquoise-600', 'text-blue-600', 'text-green-600'];

              return (
                <div key={step.number} className="relative group">
                  {/* Enhanced card with hover effects and shadows */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 relative overflow-hidden">
                    {/* Integrated step number - larger and positioned at top-left corner */}
                    <div className="absolute -top-4 -left-4 w-16 h-16 bg-navy-900 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-xl z-10 group-hover:scale-110 transition-transform">
                      {step.number}
                    </div>

                    {/* Larger gradient icon with background - Updated positioning */}
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mb-6 mt-8 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-navy-900 mb-3">{step.title}</h3>

                    {/* Detailed description */}
                    <p className="text-gray-600 mb-4 leading-relaxed">{step.description}</p>

                    {/* Detailed bullet points with Check icons */}
                    <ul className="space-y-2 text-sm text-gray-600">
                      {step.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-start gap-2">
                          <Check
                            className={`w-5 h-5 ${checkColors[idx]} flex-shrink-0 mt-0.5`}
                            strokeWidth={3}
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced CTA Section - Redesigned for better visual prominence */}
        <div className="text-center mt-20">
          {/* Duration Badge - More prominent card-style design */}
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-white to-gray-50 rounded-2xl px-8 py-5 shadow-xl border border-gray-200 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-turquoise-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Teljes folyamat
              </div>
              <div className="text-3xl font-bold text-turquoise-600">~5 perc</div>
            </div>
          </div>

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
