'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, DollarSign } from 'lucide-react';

export function AnimatedDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Main Mockup Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Mockup Header */}
        <div className="bg-gradient-to-r from-turquoise-500 to-turquoise-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-bold text-lg">Ajánlat #2024-001</div>
              <div className="text-turquoise-100 text-sm">Webfejlesztés projekt</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-sm font-semibold">AI Kész!</span>
            </div>
          </div>
        </div>

        {/* Mockup Content */}
        <div className="p-6 space-y-4">
          {/* Project Details Section */}
          <div
            className={`transition-all duration-500 ${
              step === 0 ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-turquoise-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-turquoise-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Projekt részletek</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="h-2 bg-turquoise-200 rounded w-full animate-pulse"></div>
              <div className="h-2 bg-turquoise-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-2 bg-turquoise-200 rounded w-4/6 animate-pulse"></div>
            </div>
          </div>

          {/* Timeline Section */}
          <div
            className={`transition-all duration-500 ${
              step === 1 ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Ütemterv</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-turquoise-500 rounded-full"></div>
                <div className="h-2 bg-gray-200 rounded flex-1"></div>
                <span className="text-xs text-gray-500">2 hét</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-turquoise-500 rounded-full"></div>
                <div className="h-2 bg-gray-200 rounded flex-1"></div>
                <span className="text-xs text-gray-500">3 hét</span>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div
            className={`transition-all duration-500 ${
              step === 2 ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Árazás</h3>
            </div>
            <div className="bg-gradient-to-br from-turquoise-50 to-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-gray-900">2.500.000 Ft</div>
              <div className="text-sm text-gray-600">Teljes projekt ár</div>
            </div>
          </div>
        </div>

        {/* Mockup Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Generálva AI-val</span>
            <span>3 másodperc</span>
          </div>
        </div>
      </div>

      {/* Floating Badge */}
      <div className="absolute -top-3 -right-3 bg-turquoise-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm animate-bounce">
        AI Kész!
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-turquoise-500/20 blur-3xl -z-10 animate-pulse"></div>
    </div>
  );
}
