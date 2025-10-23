import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';

export default function Home() {
  const features = [
    {
      title: 'Egyetlen esztétikus felület',
      description:
        'A Propono sötét témás felülete követi a márkád színeit, így minden ajánlat magabiztos, prémium hatást kelt.'
    },
    {
      title: 'AI, ami érti a briefet',
      description:
        'A magyar nyelvű AI lépésről lépésre állítja össze a szöveget, árkalkulációt és moduláris blokkokat.'
    },
    {
      title: 'Ügyfélközpontú megosztás',
      description:
        'Élő link, interaktív visszajelzések, aláírás – minden egy irányítópulton, automatikus státuszjelzéssel.'
    }
  ];

  const steps = [
    {
      title: 'Brief & mood',
      description:
        'Importáld a projekt részleteit vagy illessz be egy e-mailt – az AI azonnal kiemeli a lényeges pontokat.'
    },
    {
      title: 'Moduláris blokkok',
      description:
        'Válaszd ki a sablonjaidat, kérj új AI-szöveget vagy szerkeszd vizuálisan a szekciókat, mint egy dizájn eszközben.'
    },
    {
      title: 'Megosztás & mérés',
      description:
        'Egy kattintással készül a márkázott PDF, közben realtime látod, hogy az ügyfél mit olvasott el.'
    }
  ];

  const spotlight = [
    'Szabadszavas promptok iparági sablonokkal',
    'RTL grid, ahol minden komponens mozgatható',
    'Automatikus költség-blokkok és összegek'
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-night-900 text-graphite-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(73,240,192,0.18),_transparent_55%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='320' height='320' viewBox='0 0 320 320' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath opacity='0.16' d='M0 80H320M0 160H320M0 240H320M80 0V320M160 0V320M240 0V320' stroke=%22%2349F0C0%22 stroke-width='1'/%3E%3C/svg%3E\")"
        }}
      />

      <div className="relative">
        <LandingHeader className="bg-night-900/60 backdrop-blur supports-[backdrop-filter]:bg-night-900/40" />

        <main className="mx-auto flex max-w-6xl flex-col gap-24 px-6 pb-24 pt-6">
          <section className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-mint-500/50 bg-night-800/60 px-4 py-1 text-xs font-medium uppercase tracking-[0.4em] text-mint-400">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-400" /> ÚJ GENERÁCIÓS AJÁNLAT
              </span>
              <h1 className="text-4xl font-medium leading-tight text-graphite-100 md:text-6xl">
                Magyar <span className="bg-gradient-to-r from-mint-500 via-mint-300 to-mint-500 bg-clip-text font-display text-transparent">AI ajánlat designer</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-graphite-400">
                A Propono egy vizuális ajánlatkészítő felület, ami a Penpot szabad formavilágát ötvözi az AI sebességével. Húzd, szerkeszd, promptolj, majd küldd tovább percek alatt – pixelpontos PDF-ben.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/new"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-mint-600 via-mint-500 to-mint-300 px-7 py-3 text-sm font-semibold text-night-900 shadow-pop transition hover:brightness-110"
                >
                  Kezdj el egy ajánlatot
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center rounded-full border border-graphite-500/40 px-7 py-3 text-sm font-semibold text-graphite-100 transition hover:border-mint-400 hover:text-mint-300"
                >
                  Nézd meg a demót
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-graphite-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint-500" /> Stripe védelem
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint-300" /> Ingyenes próba 3 ajánlattal
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -translate-y-6 translate-x-8 rounded-[40px] bg-gradient-to-br from-night-800 via-night-900 to-night-800 blur-3xl" />
              <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-night-800/80 shadow-pop">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 text-xs uppercase tracking-[0.3em] text-graphite-500">
                  <span>Propono canvas</span>
                  <span className="rounded-full bg-night-900 px-4 py-1 text-[10px] font-semibold text-mint-400">Real-time preview</span>
                </div>
                <div className="space-y-4 p-6 text-sm text-graphite-200">
                  <div className="flex items-center justify-between rounded-3xl border border-white/5 bg-night-900/80 px-5 py-4">
                    <div>
                      <p className="font-semibold text-graphite-100">Webfejlesztési ajánlat</p>
                      <p className="text-xs text-graphite-500">AI draft • frissítve 18 mp ezelőtt</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-mint-500/10 px-3 py-1 text-[11px] font-medium text-mint-300">
                      <span className="h-2 w-2 rounded-full bg-mint-400" /> Live sync
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {spotlight.map((item) => (
                      <div
                        key={item}
                        className="rounded-3xl border border-white/5 bg-night-900/60 p-4 text-xs text-graphite-400"
                      >
                        <p className="font-medium text-graphite-100">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-3xl border border-mint-500/20 bg-gradient-to-r from-night-900 via-night-800 to-night-900 p-5">
                    <p className="text-xs uppercase tracking-[0.4em] text-mint-400">AI kalkuláció</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-graphite-300">
                        <span>UI tervezés (20 óra)</span>
                        <span className="font-semibold text-graphite-100">220 000 Ft</span>
                      </div>
                      <div className="flex items-center justify-between text-graphite-300">
                        <span>Fejlesztés (60 óra)</span>
                        <span className="font-semibold text-graphite-100">660 000 Ft</span>
                      </div>
                      <div className="flex items-center justify-between text-mint-300">
                        <span>Összesen</span>
                        <span className="text-lg font-semibold text-mint-300">880 000 Ft</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-white/5 bg-night-800/70 p-6 shadow-card transition duration-300 hover:border-mint-500/40 hover:shadow-pop"
              >
                <div className="absolute -top-24 right-0 h-40 w-40 rounded-full bg-mint-500/10 blur-3xl transition duration-300 group-hover:scale-125" />
                <h3 className="text-lg font-semibold text-graphite-100">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-graphite-400">{feature.description}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-12 rounded-3xl border border-white/5 bg-night-800/70 p-10 shadow-card lg:grid-cols-[0.55fr_1fr]">
            <div className="space-y-6">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-mint-400">Folyamat vizuálisan</span>
              <h2 className="text-3xl font-medium text-graphite-100">Három lépés, ahol a csapatod együtt dolgozik</h2>
              <p className="text-sm leading-relaxed text-graphite-400">
                A Propono felülete szabad vászonként működik. A blokkokat mozgathatod, kommentelhetsz, és a háttérben az AI mindig egységes arculatot tart.
              </p>
            </div>
            <ol className="relative space-y-5 border-l border-white/10 pl-6">
              {steps.map((step, index) => (
                <li key={step.title} className="relative space-y-2 rounded-3xl border border-white/5 bg-night-900/80 p-5">
                  <span className="absolute -left-[38px] grid h-8 w-8 place-items-center rounded-full bg-mint-500/10 font-mono text-xs text-mint-300">
                    {index + 1}
                  </span>
                  <p className="text-base font-semibold text-graphite-100">{step.title}</p>
                  <p className="text-sm leading-relaxed text-graphite-400">{step.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-10 lg:grid-cols-[1fr_0.55fr]">
            <div className="rounded-3xl border border-white/5 bg-night-800/70 p-9 shadow-card">
              <h3 className="text-2xl font-medium text-graphite-100">Márkázott PDF, ami úgy néz ki, mintha egy design stúdió készítette volna</h3>
              <p className="mt-4 text-sm leading-relaxed text-graphite-400">
                Feltöltött logó, betűtípus és színkód – mind bekerül az ajánlat minden oldalára. Az AI segít az összegzésekben, de a vizuális layout a te irányításod alatt marad.
              </p>
              <div className="mt-7 grid gap-4 text-sm text-graphite-300 md:grid-cols-2">
                <div className="rounded-3xl border border-white/5 bg-night-900/70 p-4">
                  <p className="font-semibold text-graphite-100">Dinamikus komponensek</p>
                  <p className="mt-1 text-graphite-400">Drag & drop blokkok, reszponzív rács a Penpot logikájával.</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-night-900/70 p-4">
                  <p className="font-semibold text-graphite-100">Átlátható státuszok</p>
                  <p className="mt-1 text-graphite-400">Megnyitási, elfogadási és komment történet – mind visszamérhető.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-night-800 via-night-900 to-night-800 p-8 text-sm text-graphite-300 shadow-pop">
              <p className="text-lg font-semibold text-graphite-100">
                „A Propono olyan, mintha az ajánlatkészítéshez kapnánk egy Penpotot. Végre ugyanabban a térben dolgozik designer, sales és vezető.”
              </p>
              <div className="space-y-1 text-xs uppercase tracking-[0.3em] text-graphite-500">
                <p>Kiss Júlia</p>
                <p>Ügynökségvezető • Studio Fluo</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-mint-500/20 bg-gradient-to-r from-night-900 via-night-800 to-night-900 p-12 shadow-pop">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-mint-400">Ajánlatkészítés újrafogalmazva</span>
                <h2 className="text-3xl font-medium text-graphite-100">Csatlakozz a vizuális workflow-hoz, és spórolj órákat minden ajánlaton</h2>
                <p className="text-sm leading-relaxed text-graphite-400">
                  Ingyenes kipróbálás, azonnali meghívás a csapattagoknak. A Propono AI az eddigi ajánlataidból tanul, hogy minden új dokumentum pontos, esztétikus és márkahű legyen.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/new"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-mint-600 via-mint-500 to-mint-300 px-7 py-3 text-sm font-semibold text-night-900 transition hover:brightness-110"
                >
                  Indítsd el ingyen
                </Link>
                <Link
                  href="/billing"
                  className="inline-flex items-center justify-center rounded-full border border-mint-500/40 px-7 py-3 text-sm font-semibold text-mint-300 transition hover:border-mint-300"
                >
                  Csomagok
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
