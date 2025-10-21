// src/components/PriceTableEditor.tsx
export function PriceTableEditor() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:bg-ink-900 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 sticky top-0 dark:bg-slate-800">
          <tr className="text-left text-slate-600 dark:text-slate-300">
            <th className="px-4 py-3">Tétel</th>
            <th className="px-4 py-3">Menny.</th>
            <th className="px-4 py-3">Egység</th>
            <th className="px-4 py-3 text-right">Egységár</th>
            <th className="px-4 py-3 text-right">ÁFA %</th>
            <th className="px-4 py-3 text-right">Nettó</th>
            <th className="px-2 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {/* ide jönnek a sorok (map) */}
          <tr>
            <td className="px-4 py-3">
              <input className="w-full rounded-md border border-slate-300 px-2 py-1 dark:bg-slate-800 dark:border-slate-700" />
            </td>
            <td className="px-4 py-3">
              <input type="number" className="w-20 rounded-md border border-slate-300 px-2 py-1 dark:bg-slate-800 dark:border-slate-700" />
            </td>
            <td className="px-4 py-3">
              <input className="w-24 rounded-md border border-slate-300 px-2 py-1 dark:bg-slate-800 dark:border-slate-700" />
            </td>
            <td className="px-4 py-3 text-right">
              <input type="number" className="w-28 text-right rounded-md border border-slate-300 px-2 py-1 dark:bg-slate-800 dark:border-slate-700 tabular" />
            </td>
            <td className="px-4 py-3 text-right">
              <input type="number" className="w-20 text-right rounded-md border border-slate-300 px-2 py-1 dark:bg-slate-800 dark:border-slate-700 tabular" />
            </td>
            <td className="px-4 py-3 text-right tabular">0</td>
            <td className="px-2 py-3 text-right">
              <button className="text-red-500 hover:text-red-600">Törlés</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
