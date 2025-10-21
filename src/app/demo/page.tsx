import Link from 'next/link';

export default function DemoPlaceholderPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center text-slate-900">
      <div className="max-w-xl space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Demó
        </span>
        <h1 className="text-4xl font-semibold">Interaktív demó hamarosan</h1>
        <p className="text-sm text-slate-500">
          Dolgozunk egy részletes bemutatón, ahol lépésről lépésre kipróbálhatod a Propono ajánlatkészítő folyamatát. Addig is
          regisztrálj és kezdd el ingyen a Start csomaggal!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Bejelentkezés
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    </div>
  );
}
