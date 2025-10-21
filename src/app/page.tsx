export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
        <div className="absolute -top-40 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.35),_transparent_65%)]" />
        <div className="absolute top-1/3 -left-32 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(192,132,252,0.35),_transparent_65%)]" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(96,165,250,0.25),_transparent_65%)]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col px-6 pb-20 pt-10 md:pt-16">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.28em] text-slate-400">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 shadow-lg ring-1 ring-slate-700">
              <span className="text-base font-semibold text-slate-100">P</span>
            </span>
            Propono AI ajánlatkészítő
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <a href="/dashboard" className="transition hover:text-white">
              Termék
            </a>
            <a href="/billing" className="transition hover:text-white">
              Csomagok
            </a>
            <a href="/login" className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-200 transition hover:border-white hover:text-white">
              Bejelentkezés
            </a>
          </nav>
        </header>

        <main className="mt-16 grid gap-16 md:mt-20">
          <section className="grid items-start gap-14 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:gap-20">
            <div className="flex flex-col gap-7">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-1 text-xs font-medium text-slate-300 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Új: 30 másodperces ajánlatgenerálás
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl">
                Profi, magyar nyelvű árajánlat <span className="text-sky-300">AI asszisztenssel</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-300">
                A <strong>Propono</strong> megírja, megszerkeszti és PDF-be rendezi az ajánlataidat. Gyorsabb ügyfélkommunikáció, egységes márkaélmény és mérhető eredmények – minden vállalkozásnak, aki komolyan veszi a növekedést.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/new"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-500/20 transition hover:bg-slate-100"
                >
                  Ajánlat készítése
                </a>
                <a
                  href="/billing"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white hover:text-white"
                >
                  Csomagok megtekintése
                </a>
              </div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Próbáld ki kártya nélkül – Propono Start: 5 ajánlat / hó
              </p>
            </div>

            <div className="relative flex flex-col gap-5 rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 backdrop-blur">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>Élő előnézet</span>
                <span className="rounded-full border border-sky-500/40 px-3 py-1 text-[10px] font-semibold text-sky-300">PDF draft</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-inner shadow-slate-900/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-200">„Webfejlesztési árajánlat”</p>
                    <p className="text-xs text-slate-500">Generálva 18 másodperce</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    AI kész
                  </span>
                </div>
                <div className="mt-5 space-y-4 text-sm text-slate-300">
                  <div className="flex items-start justify-between rounded-lg border border-slate-800/80 bg-slate-900/80 p-4">
                    <div>
                      <p className="font-medium text-slate-200">Projekt összefoglaló</p>
                      <p className="mt-1 text-xs text-slate-500">Személyre szabott intro, ami vállalkozásod hangján szól</p>
                    </div>
                    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0-6 6m6-6-6-6" />
                    </svg>
                  </div>
                  <div className="flex items-start justify-between rounded-lg border border-slate-800/80 bg-slate-900/80 p-4">
                    <div>
                      <p className="font-medium text-slate-200">Tételes kalkuláció</p>
                      <p className="mt-1 text-xs text-slate-500">Nettó, ÁFA és bruttó számítás automatikusan</p>
                    </div>
                    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0-6 6m6-6-6-6" />
                    </svg>
                  </div>
                  <div className="flex items-start justify-between rounded-lg border border-slate-800/80 bg-slate-900/80 p-4">
                    <div>
                      <p className="font-medium text-slate-200">Letölthető PDF</p>
                      <p className="mt-1 text-xs text-slate-500">Logó, színek, aláírás – minden egy dokumentumban</p>
                    </div>
                    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0-6 6m6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-8 rounded-3xl border border-slate-800/60 bg-slate-900/50 p-8 backdrop-blur md:grid-cols-3">
            {[
              {
                title: 'Egységes arculat minden ajánlatban',
                description:
                  'Mentett sablonok, logó és vizuális elemek automatikusan kerülnek bele minden dokumentumba.',
              },
              {
                title: 'Percek helyett másodpercek',
                description:
                  'A mesterséges intelligencia feldolgozza a briefet, felajánlja a szöveget, és azonnal kalkulálja a tételeket.',
              },
              {
                title: 'Megosztható és mérhető',
                description:
                  'Az ügyfél megnyitása, elfogadása és visszajelzése is követhető – így tudod, hol tart az üzlet.',
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-inner shadow-slate-900/30">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-300">{item.description}</p>
              </div>
            ))}
          </section>

          <section className="grid items-center gap-10 rounded-3xl border border-slate-800/60 bg-slate-900/50 p-10 backdrop-blur md:grid-cols-[0.65fr_1fr]">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Hogyan működik</p>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                Három lépés a jobb ügyfélélményhez
              </h2>
              <p className="text-sm text-slate-300">
                A Propono végigvisz a brief felvételétől a jóváhagyott ajánlatig. Tiszta folyamat, amit az ügyfelek is szeretnek.
              </p>
            </div>
            <ol className="space-y-6 text-sm text-slate-200">
              {[
                {
                  title: '1. Add meg az ügyfél igényeit',
                  description:
                    'Töltsd ki a rövid kérdőívet vagy másold be a briefet – a Propono felismeri a kulcspontokat.',
                },
                {
                  title: '2. Finomhangold a szöveget',
                  description:
                    'A generált ajánlatot élőben szerkesztheted, hozzáadhatsz saját tételeket és megjegyzéseket.',
                },
                {
                  title: '3. Küldd és kövesd az elfogadást',
                  description:
                    'Egy kattintással PDF vagy megosztható link. Értesítést kapsz, ha az ügyfél megnyitja vagy elfogadja.',
                },
              ].map((step) => (
                <li key={step.title} className="flex gap-4 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 font-semibold text-slate-200">
                    {step.title.slice(0, 2)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-white">{step.title}</p>
                    <p className="text-sm text-slate-300">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-gradient-to-r from-sky-500/20 via-sky-400/10 to-transparent p-10">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-200">Ajánlatkészítés újragondolva</p>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">Kezdd el ma, és ments meg órákat minden héten</h2>
              <p className="max-w-xl text-sm text-slate-200">
                Ingyenes kipróbálás, bármikor lemondható. A Propono AI valós ügyféladatokon tanult, így te a szakmai munkára koncentrálhatsz.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/new"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-500/30 transition hover:bg-slate-100"
                >
                  Indítás ingyen
                </a>
                <a
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
                >
                  Nézd meg a demót
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
