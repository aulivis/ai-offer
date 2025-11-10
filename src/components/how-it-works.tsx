'use client';

import { Upload, Wand2, Send } from 'lucide-react';
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
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line between steps (desktop only) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-turquoise-200 via-blue-200 to-green-200 -z-10"></div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="relative">
                  {/* Larger numbered badge with better positioning */}
                  <div className="absolute -top-4 left-8 w-12 h-12 bg-navy-900 text-white rounded-full flex items-center justify-center font-bold text-lg z-10 shadow-lg">
                    {step.number}
                  </div>

                  {/* Enhanced card with hover effects and shadows */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                    {/* Larger gradient icon with background */}
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-navy-900 mb-3">{step.title}</h3>

                    {/* Detailed description */}
                    <p className="text-gray-600 mb-4">{step.description}</p>

                    {/* Detailed bullet points */}
                    <ul className="space-y-2 text-sm text-gray-600">
                      {step.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-start gap-2">
                          <svg
                            className={`w-5 h-5 ${step.bulletColor} flex-shrink-0 mt-0.5`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
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

        {/* Enhanced CTA with prominent button and time badge */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg mb-6">
            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold text-gray-900">Teljes folyamat:</span>
            <span className="text-turquoise-600 font-bold text-lg">~5 perc</span>
          </div>

          <Link
            href="/login?redirect=/new"
            className="inline-block bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold px-10 py-4 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Próbáld ki ingyen →
          </Link>
        </div>
      </div>
    </section>
  );
}
