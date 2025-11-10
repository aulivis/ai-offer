'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';

export function ROICalculator() {
  const [proposals, setProposals] = useState(10);
  const [timePerProposal, setTimePerProposal] = useState(4);
  const [hourlyRate, setHourlyRate] = useState(15000);

  // Calculate savings
  const timeSavedPerProposal = timePerProposal * 0.7; // 70% time savings
  const totalTimeSavedPerMonth = proposals * timeSavedPerProposal;
  const monthlySavings = totalTimeSavedPerMonth * hourlyRate;
  const annualSavings = monthlySavings * 12;
  const proPlanCost = 69900; // Annual cost in HUF

  return (
    <div className="bg-gradient-to-br from-turquoise-50 to-blue-50 rounded-3xl p-8 border-2 border-turquoise-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-turquoise-500 rounded-xl flex items-center justify-center">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-navy-900">ROI Kalkulátor</h3>
          <p className="text-gray-600">Számold ki a megtakarításodat</p>
        </div>
      </div>

      {/* Input fields */}
      <div className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-2">
            Hány ajánlatot készítesz havonta?
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={proposals}
            onChange={(e) => setProposals(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-right text-2xl font-bold text-turquoise-600 mt-2">
            {proposals} ajánlat
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-2">
            Mennyi időt töltesz egy ajánlattal? (óra)
          </label>
          <input
            type="range"
            min="0.5"
            max="12"
            step="0.5"
            value={timePerProposal}
            onChange={(e) => setTimePerProposal(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-right text-2xl font-bold text-turquoise-600 mt-2">
            {timePerProposal} óra
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-2">
            Mi az óradíjad? (Ft)
          </label>
          <input
            type="range"
            min="5000"
            max="50000"
            step="1000"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-right text-2xl font-bold text-turquoise-600 mt-2">
            {hourlyRate.toLocaleString('hu-HU')} Ft/óra
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-2xl p-8 shadow-xl">
        <h4 className="text-lg font-bold text-navy-900 mb-6 text-center">
          A Vyndi-vel való megtakarításod:
        </h4>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-turquoise-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-turquoise-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-turquoise-600 mb-2">
              {totalTimeSavedPerMonth.toFixed(1)} óra
            </div>
            <div className="text-sm text-gray-600">havonta megtakarított idő</div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {monthlySavings.toLocaleString('hu-HU')} Ft
            </div>
            <div className="text-sm text-gray-600">havi megtakarítás</div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {annualSavings.toLocaleString('hu-HU')} Ft
            </div>
            <div className="text-sm text-gray-600">éves megtakarítás</div>
          </div>
        </div>

        {/* Pro plan cost comparison */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Vyndi Pro éves költség:</span>
            <span className="font-bold text-navy-900">
              {proPlanCost.toLocaleString('hu-HU')} Ft
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Éves megtakarításod:</span>
            <span className="font-bold text-green-600">
              {annualSavings.toLocaleString('hu-HU')} Ft
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
            <span className="font-bold text-navy-900">Nettó hasznod:</span>
            <span className="text-2xl font-bold text-green-600">
              {(annualSavings - proPlanCost).toLocaleString('hu-HU')} Ft
            </span>
          </div>
          <div className="text-center mt-4 text-sm text-gray-600">
            <strong className="text-turquoise-600">
              {Math.round((annualSavings - proPlanCost) / proPlanCost)}x ROI
            </strong>{' '}
            egy év alatt!
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/login?redirect=/new"
          className="w-full bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold py-4 px-6 rounded-xl mt-6 transition-all inline-flex items-center justify-center min-h-[44px]"
        >
          Kezdd el 14 napig ingyen
        </Link>
      </div>

      <div className="text-xs text-gray-500 text-center mt-4">
        * A számítás a 70%-os átlagos időmegtakarításon alapul, amit ügyfeleink tapasztaltak
      </div>
    </div>
  );
}
