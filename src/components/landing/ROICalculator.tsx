'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface ROICalculatorProps {
  className?: string;
}

export default function ROICalculator({ className = '' }: ROICalculatorProps) {
  const [offersPerMonth, setOffersPerMonth] = useState(10);
  const [hoursPerOffer, setHoursPerOffer] = useState(4);
  const [hourlyRate, setHourlyRate] = useState(5000);

  const timeSavedPerOffer = hoursPerOffer * 0.7; // 70% time savings
  const totalTimeSaved = offersPerMonth * timeSavedPerOffer;
  const monthlySavings = totalTimeSaved * hourlyRate;
  const yearlySavings = monthlySavings * 12;

  return (
    <Card className={`p-8 ${className}`}>
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-semibold text-fg">Számítsd ki a megtakarításod</h3>
        <p className="mt-2 text-base text-fg-muted">
          Mennyi időt és pénzt takaríthatnál meg a Propono-val?
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="offers" className="mb-2 block text-sm font-medium text-fg">
            Hány ajánlatot készítesz havonta?
          </label>
          <input
            id="offers"
            type="number"
            min="1"
            max="100"
            value={offersPerMonth}
            onChange={(e) => setOffersPerMonth(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2 text-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="hours" className="mb-2 block text-sm font-medium text-fg">
            Hány órát töltesz egy ajánlat elkészítésével?
          </label>
          <input
            id="hours"
            type="number"
            min="1"
            max="20"
            value={hoursPerOffer}
            onChange={(e) => setHoursPerOffer(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2 text-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="rate" className="mb-2 block text-sm font-medium text-fg">
            Mennyi az órabéred? (Ft)
          </label>
          <input
            id="rate"
            type="number"
            min="1000"
            step="1000"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2 text-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base text-fg-muted">Megtakarított idő havonta:</span>
              <span className="text-xl font-bold text-primary">{totalTimeSaved.toFixed(1)} óra</span>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <span className="text-base font-semibold text-fg">Havi megtakarítás:</span>
              <span className="text-2xl font-bold text-primary">
                {monthlySavings.toLocaleString('hu-HU')} Ft
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <span className="text-lg font-semibold text-fg">Éves megtakarítás:</span>
              <span className="text-3xl font-bold text-primary">
                {yearlySavings.toLocaleString('hu-HU')} Ft
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="text-sm text-fg-muted">
            A Propono segítségével <strong className="text-fg">70%-kal gyorsabban</strong> készíthetsz
            ajánlatokat
          </p>
        </div>
      </div>
    </Card>
  );
}







