import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';

export default function DemoPlaceholderPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)]" />
      <div className="relative flex min-h-screen flex-col">
        <LandingHeader />
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Demó
            </span>
            <h1 className="text-4xl font-semibold">Interaktív demó hamarosan</h1>
            <p className="text-sm text-slate-500">
              Dolgozunk egy részletes bemutatón, ahol lépésről lépésre kipróbálhatod a Propono ajánlatkészítő folyamatát. Addig is
              regisztrálj és kezdd el ingyen az Ingyenes csomaggal, vagy lépj tovább a Propono Standard 10 ajánlatos keretével.
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
        </main>
      </div>
    </div>
  );
}
