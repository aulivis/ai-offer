'use client';

import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Clock, DollarSign, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';

// Animate number from 0 to target
const useCountUp = (target: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Reset count when target changes
    setCount(0);
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(Math.round(target));
        clearInterval(timer);
      } else {
        setCount(Math.round(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
};

export function ROICalculator() {
  const [proposals, setProposals] = useState(5);
  const [timePerProposal, setTimePerProposal] = useState(1);
  const [hourlyRate, setHourlyRate] = useState(5000);

  // Calculate savings (assuming 70% time reduction)
  const currentMonthlyHours = proposals * timePerProposal;
  const vyndiMonthlyHours = currentMonthlyHours * 0.3; // 70% reduction
  const hoursSaved = currentMonthlyHours - vyndiMonthlyHours;
  const monthlySavings = hoursSaved * hourlyRate;
  const yearlySavings = monthlySavings * 12;
  const savingsPercentage = 70;

  // Animated values
  const animatedSavings = useCountUp(monthlySavings, 800);
  const animatedYearlySavings = useCountUp(yearlySavings, 1000);

  return (
    <section className="py-20 bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900 relative overflow-hidden text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-turquoise-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Enhanced badge with icon */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-turquoise-500/20 text-turquoise-300 rounded-full font-semibold text-sm mb-6 border border-turquoise-500/30">
            <Sparkles className="w-4 h-4" />
            ROI KALKULÁTOR
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight text-balance">
            Mennyit takaríthatnál meg a Vyndivel?
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto text-pretty">
            Állítsd be a paramétereket és nézd meg, mennyi időt és pénzt spórolhatsz
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Panel - Inputs */}
          {/* Enhanced input panel with better styling */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-turquoise-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-turquoise-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Add meg az adataidat</h3>
            </div>

            {/* Input 1: Number of Proposals */}
            <div className="mb-8">
              <label className="block text-white font-semibold mb-3 text-lg">
                Hány ajánlatot készítesz havonta?
              </label>
              {/* Prominent value display */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-turquoise-400">{proposals}</span>
                <span className="text-xl text-gray-400">ajánlat</span>
              </div>
              {/* Styled slider with turquoise accent */}
              <input
                type="range"
                min="1"
                max="100"
                value={proposals}
                onChange={(e) => setProposals(Number(e.target.value))}
                className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 
                  [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-turquoise-500 [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:bg-turquoise-400
                  [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-turquoise-500 [&::-moz-range-thumb]:border-0 
                  [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg"
                aria-label="Ajánlatok száma havonta"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>1</span>
                <span>100</span>
              </div>
            </div>

            {/* Input 2: Time per Proposal */}
            <div className="mb-8">
              <label className="block text-white font-semibold mb-3 text-lg">
                Mennyi időt töltesz egy ajánlattal?
              </label>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-turquoise-400">{timePerProposal}</span>
                <span className="text-xl text-gray-400">óra</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={timePerProposal}
                onChange={(e) => setTimePerProposal(Number(e.target.value))}
                className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 
                  [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-turquoise-500 [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:bg-turquoise-400
                  [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-turquoise-500 [&::-moz-range-thumb]:border-0 
                  [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg"
                aria-label="Órák száma ajánlatonként"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>0.5 óra</span>
                <span>8 óra</span>
              </div>
            </div>

            {/* Input 3: Hourly Rate */}
            <div>
              <label className="block text-white font-semibold mb-3 text-lg">
                Mi az óradíjad/munkadíja költséged?
              </label>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-turquoise-400">
                  {hourlyRate.toLocaleString('hu-HU')}
                </span>
                <span className="text-xl text-gray-400">Ft/óra</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 
                  [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-turquoise-500 [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:bg-turquoise-400
                  [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-turquoise-500 [&::-moz-range-thumb]:border-0 
                  [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg"
                aria-label="Óradíj forintban"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>1,000 Ft</span>
                <span>50,000 Ft</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          {/* Enhanced results panel with celebration design */}
          <div className="space-y-6">
            {/* Main Savings Card */}
            <div className="bg-gradient-to-br from-turquoise-500 to-turquoise-600 rounded-3xl p-8 shadow-2xl border-2 border-turquoise-400 relative overflow-hidden">
              {/* Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                  <h3 className="text-white font-bold text-xl">Havi megtakarítás</h3>
                </div>

                {/* Huge, dramatic savings number */}
                <div className="mb-6">
                  <div className="text-6xl md:text-7xl font-bold text-white mb-2">
                    {animatedSavings.toLocaleString('hu-HU')} Ft
                  </div>
                  <div className="text-xl text-turquoise-100">
                    {hoursSaved.toFixed(1)} óra megtakarítás havonta
                  </div>
                </div>

                {/* Prominent percentage badge */}
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
                  <Sparkles className="w-5 h-5 text-white" />
                  <span className="text-2xl font-bold text-white">{savingsPercentage}%</span>
                  <span className="text-white">időmegtakarítás</span>
                </div>
              </div>
            </div>

            {/* Time Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Current Time */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-red-400" />
                  <span className="text-gray-300 font-semibold">Jelenlegi idő</span>
                </div>
                <div className="text-4xl font-bold text-white mb-1">{currentMonthlyHours}h</div>
                <div className="text-sm text-gray-400">havonta</div>
              </div>

              {/* Vyndi Time */}
              <div className="bg-turquoise-500/20 backdrop-blur-lg rounded-2xl p-6 border border-turquoise-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-turquoise-400" />
                  <span className="text-turquoise-300 font-semibold">Vyndivel</span>
                </div>
                <div className="text-4xl font-bold text-turquoise-400 mb-1">
                  {vyndiMonthlyHours.toFixed(1)}h
                </div>
                <div className="text-sm text-turquoise-300">havonta</div>
              </div>
            </div>

            {/* Annual Projection */}
            {/* More dramatic annual projection card */}
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 shadow-xl border-2 border-yellow-400">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-6 h-6 text-white" />
                <h4 className="text-white font-bold text-lg">Éves vetítés</h4>
              </div>
              <div className="text-5xl font-bold text-white mb-2">
                {animatedYearlySavings.toLocaleString('hu-HU')} Ft
              </div>
              <div className="text-white/90 text-lg">{(hoursSaved * 12).toFixed(0)} óra évente</div>
            </div>

            {/* CTA Button */}
            {/* Turquoise button instead of white */}
            <Link
              href="/login?redirect=/new"
              className="w-full bg-white hover:bg-gray-100 text-navy-900 font-bold px-8 py-5 rounded-xl text-lg shadow-2xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span>Próbáld ki ingyen</span>
              <TrendingUp className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm max-w-3xl mx-auto text-pretty">
            * A kalkulátor átlagos értékeken alapul. Az eredmények egyéni használattól függően
            változhatnak.
          </p>
        </div>
      </div>
    </section>
  );
}
