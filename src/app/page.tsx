import Link from 'next/link';

export default function Home() {
  const features = [
    {
      title: 'Egységes arculat minden ajánlatban',
      description: 'Mentett sablonok, logó és vizuális elemek automatikusan kerülnek bele minden dokumentumba.'
    },
    {
      title: 'Percek helyett másodpercek',
      description: 'Az AI feldolgozza a briefet, javaslatot tesz a szövegre és tételes kalkulációt készít.'
    },
    {
      title: 'Megosztható és mérhető',
      description: 'Nyomon követheted az ajánlat megnyitását, elfogadását és visszajelzéseit.'
    }
  ];

  const steps = [
    {
      title: '1. Projekt részletek',
      description: 'Add meg az ügyfél igényeit, az iparágat és a fontos határidőket.'
    },
    {
      title: '2. Tételek & árazás',
      description: 'Válassz sablonokból vagy add meg saját tételeidet, automatikus ÁFA-számítással.'
    },
    {
      title: '3. Előnézet & küldés',
      description: 'Finomhangold az AI által készített szöveget, majd generáld le a PDF-et egy kattintással.'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)]" />

      <div className="relative">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-wide text-slate-800">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white font-display text-base">P</span>
            Propono
          </Link>
          <nav className="flex items-center gap-3 text-sm text-slate-500">
            <Link className="rounded-full px-3 py-1.5 transition hover:bg-slate-200/60 hover:text-slate-900" href="/dashboard">Termék</Link>
            <Link className="rounded-full px-3 py-1.5 transition hover:bg-slate-200/60 hover:text-slate-900" href="/billing">Csomagok</Link>
            <Link className="rounded-full border border-slate-300 px-3 py-1.5 font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900" href="/login">Bejelentkezés</Link>
          </nav>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col gap-20 px-6 pb-20">
          <section className="grid gap-12 lg:grid-cols-[0.95fr_1fr] lg:items-center">
            <div className="space-y-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Új: 30 másodperces ajánlatgenerálás
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                Profi, magyar nyelvű árajánlat <span className="text-slate-500">AI asszisztenssel</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                A Propono megírja, megszerkeszti és PDF-be rendezi az ajánlataidat. Gyors ügyfélkommunikáció, egységes márkaélmény és mérhető eredmények – mindez a csapatod munkáját támogatva.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/new"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Ajánlat készítése
                </Link>
                <Link
                  href="/billing"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Csomagok megtekintése
                </Link>
              </div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Próbáld ki kártya nélkül – Propono Start: 5 ajánlat / hó</p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -translate-x-6 rounded-[32px] bg-gradient-to-br from-slate-200 via-white to-white blur-2xl" />
              <div className="relative rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                  <span>Előnézet</span>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold text-slate-600">PDF draft</span>
                </div>
                <div className="mt-4 space-y-4 text-sm text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">„Webfejlesztési árajánlat”</p>
                        <p className="text-xs text-slate-400">Generálva 18 másodperce</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" /> AI kész
                      </span>
                    </div>
                  </div>
                  {['Projekt összefoglaló', 'Tételes kalkuláció', 'Letölthető PDF'].map((item) => (
                    <div key={item} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4">
                      <div>
                        <p className="font-semibold text-slate-800">{item}</p>
                        <p className="text-xs text-slate-500">Személyre szabott tartalom a márkád hangján</p>
                      </div>
                      <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0-6 6m6-6-6-6" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{feature.description}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-10 rounded-[32px] border border-slate-200 bg-white/80 p-10 shadow-sm lg:grid-cols-[0.6fr_1fr]">
            <div className="space-y-6">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Hogyan működik</span>
              <h2 className="text-3xl font-semibold text-slate-900">Három lépés a jobb ügyfélélményhez</h2>
              <p className="text-sm text-slate-500">A Propono végigvisz a brief felvételétől a jóváhagyott ajánlatig. Tiszta folyamat, amit az ügyfelek is szeretnek.</p>
            </div>
            <ol className="space-y-4">
              {steps.map((step) => (
                <li key={step.title} className="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-600">
                    {step.title.slice(0, 2)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-900">{step.title}</p>
                    <p className="text-sm text-slate-500">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-8 lg:grid-cols-[1fr_0.6fr]">
            <div className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-slate-900">Szerkeszthető, márkázott PDF percek alatt</h3>
              <p className="mt-3 text-sm text-slate-500">Logó, színek, aláírás – minden automatikusan kerül az ajánlatba. A generált dokumentumot élőben szerkesztheted, majd elküldheted megosztható linken vagy PDF-ben.</p>
              <div className="mt-6 grid gap-3 text-sm text-slate-500 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="font-semibold text-slate-800">Dinamikus sablonok</p>
                  <p>Mentett iparágakhoz igazított blokkstruktúrák.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="font-semibold text-slate-800">Átlátható státuszok</p>
                  <p>Kövesd, mikor nyitotta meg vagy fogadta el az ügyfél.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
              „A Propono-val a csapatunk 70%-kal gyorsabban készít ajánlatokat, miközben az ügyfelek egységes márkaélményt kapnak.”
              <p className="mt-4 font-semibold text-slate-800">— Kiss Júlia, ügynökségvezető</p>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-10 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Ajánlatkészítés újragondolva</span>
                <h2 className="text-3xl font-semibold">Kezdd el ma, és ments meg órákat minden héten</h2>
                <p className="max-w-xl text-sm text-white/70">Ingyenes kipróbálás, bármikor lemondható. A Propono AI valós ügyféladatokon tanult, így te a szakmai munkára koncentrálhatsz.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/new" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100">
                  Indítás ingyen
                </Link>
                <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60">
                  Nézd meg a demót
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
