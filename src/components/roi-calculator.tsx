'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';

export function ROICalculator() {
  const [quotesPerMonth, setQuotesPerMonth] = useState(20);
  const [hoursPerQuote, setHoursPerQuote] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(15000);

  // Calculations
  const currentMonthlyHours = quotesPerMonth * hoursPerQuote;
  const vyndiMonthlyHours = quotesPerMonth * 0.5; // 30 min per quote with Vyndi
  const savedHours = currentMonthlyHours - vyndiMonthlyHours;
  const savedMoney = savedHours * hourlyRate;
  const savedPercentage = ((savedHours / currentMonthlyHours) * 100).toFixed(0);

  return (
    <section className="py-20 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-turquoise-400 font-semibold text-sm uppercase tracking-wide mb-3">
            ROI KALKULÁTOR
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Mennyit takaríthatnál meg a Vyndivel?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto text-pretty">
            Állítsd be a paramétereket és nézd meg, mennyi időt és pénzt spórolhatsz
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Input Controls */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-turquoise-400" />
                Add meg az adataidat
              </h3>

              <div className="space-y-8">
                {/* Quotes Per Month */}
                <div>
                  <label className="block mb-3">
                    <span className="text-lg font-semibold text-balance">
                      Hány ajánlatot készítesz havonta?
                    </span>
                    <span className="block text-turquoise-400 text-2xl font-bold mt-2">
                      {quotesPerMonth} ajánlat
                    </span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={quotesPerMonth}
                    onChange={(e) => setQuotesPerMonth(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-turquoise-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-turquoise-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                    aria-label="Ajánlatok száma havonta"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>5</span>
                    <span>100</span>
                  </div>
                </div>

                {/* Hours Per Quote */}
                <div>
                  <label className="block mb-3">
                    <span className="text-lg font-semibold text-balance">
                      Mennyi időt töltesz egy ajánlattal?
                    </span>
                    <span className="block text-turquoise-400 text-2xl font-bold mt-2">
                      {hoursPerQuote} óra
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={hoursPerQuote}
                    onChange={(e) => setHoursPerQuote(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-turquoise-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-turquoise-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                    aria-label="Órák száma ajánlatonként"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>1 óra</span>
                    <span>8 óra</span>
                  </div>
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block mb-3">
                    <span className="text-lg font-semibold text-balance">
                      Mi az óradíjad/munkaóra költséged?
                    </span>
                    <span className="block text-turquoise-400 text-2xl font-bold mt-2">
                      {hourlyRate.toLocaleString('hu-HU')} Ft/óra
                    </span>
                  </label>
                  <input
                    type="range"
                    min="5000"
                    max="50000"
                    step="1000"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-turquoise-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-turquoise-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                    aria-label="Óradíj forintban"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>5,000 Ft</span>
                    <span>50,000 Ft</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Results */}
            <div className="space-y-6">
              {/* Main Result Card */}
              <div className="bg-gradient-to-br from-turquoise-500 to-turquoise-600 rounded-2xl p-8 text-center shadow-2xl">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <TrendingUp className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">Havi megtakarítás</h3>
                </div>
                <div className="text-6xl font-bold mb-2">
                  {savedMoney.toLocaleString('hu-HU')} Ft
                </div>
                <div className="text-xl opacity-90">{savedHours.toFixed(1)} óra megtakarítás</div>
                <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold">{savedPercentage}%</div>
                  <div className="text-sm opacity-90">időmegtakarítás</div>
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-turquoise-400" />
                    <h4 className="font-semibold text-balance">Jelenlegi idő</h4>
                  </div>
                  <div className="text-3xl font-bold text-turquoise-400">
                    {currentMonthlyHours}h
                  </div>
                  <div className="text-sm text-gray-400 mt-1">havonta</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-green-400" />
                    <h4 className="font-semibold text-balance">Vyndivel</h4>
                  </div>
                  <div className="text-3xl font-bold text-green-400">{vyndiMonthlyHours}h</div>
                  <div className="text-sm text-gray-400 mt-1">havonta</div>
                </div>
              </div>

              {/* Yearly Projection */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-semibold text-lg text-balance">Éves vetítés</h4>
                </div>
                <div className="text-4xl font-bold text-yellow-400 mb-1">
                  {(savedMoney * 12).toLocaleString('hu-HU')} Ft
                </div>
                <div className="text-sm text-gray-400">
                  {(savedHours * 12).toFixed(0)} óra évente
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/login?redirect=/new"
                className="w-full bg-white text-navy-900 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg min-h-[44px] flex items-center justify-center"
              >
                Kezdd el ingyen
              </Link>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="text-center mt-12 text-gray-400 text-sm">
            <p className="text-pretty">
              * A kalkuláció átlagos értékekkel számol. Az eredmények egyéni használattól függően
              változhatnak.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
