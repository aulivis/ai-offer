import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import { Card } from '@/components/ui/Card';

export default function Home() {
  const features = [
    {
      title: 'Egyetlen esztétikus felület',
      description:
        'A Propono sötét és világos témában is igazodik a márkád színeihez, így minden ajánlat magabiztos, prémium hatást kelt.'
    },
    {
      title: 'AI, ami érti a briefet',
      description:
        'A magyar nyelvű AI lépésről lépésre állítja össze a szöveget, árkalkulációt és moduláris blokkokat.'
    },
    {
      title: 'Ügyfélközpontú megosztás',
      description:
        'Élő link, interaktív visszajelzések, aláírás – minden egy irányítópulton, automatikus státuszokkal.'
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
        'Egy kattintással készül a márkázott PDF, közben valós időben látod, mit olvasott el az ügyfél.'
    }
  ];

  const spotlight = [
    'Szabadszavas promptok iparági sablonokkal',
    'Rugalmas rács, ahol minden komponens mozgatható',
    'Automatikus költség-blokkok és összegek'
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-fg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(0,229,176,0.18),_transparent_65%)]" />
      <div className="pointer-events-none absolute -left-32 top-72 h-80 w-80 rounded-full bg-accent/16 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-40 h-72 w-72 rounded-full bg-primary/14 blur-3xl" />

      <div className="relative">
        <LandingHeader className="border-b border-border/60 bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60" />

        <main id="main" className="flex flex-col gap-28 md:gap-32">
          {/* HERO */}
          <section className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-32 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-xl flex-1 flex-col gap-8">
              <span className="inline-flex w-fit items-center rounded-full border border-[#00E5B0] bg-[#00E5B0]/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00E5B0]">
                Ajánlatkészítés újragondolva
              </span>

              <h1 className="max-w-[14ch] text-5xl font-extrabold leading-[1.1] tracking-tight text-fg md:text-6xl">
                Készíts lenyűgöző ajánlatokat.
                <br />
                <span className="text-[#00E5B0]">Villámgyorsan.</span>
              </h1>

              <p className="max-w-[48ch] text-base leading-[1.6] text-fg-muted md:text-lg">
                A Propono AI-alapú ajánlatkészítő automatizálja az árajánlatok létrehozását teljesen személyre szabva, hogy te a növekedésre koncentrálhass.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/new"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00E5B0] to-[#22FFC9] px-7 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 ease-out hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0]"
                >
                  Próbáld ki ingyen!
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center rounded-full border border-white/60 px-7 py-3 text-sm font-semibold text-white transition duration-200 ease-out hover:border-[#00E5B0] hover:text-[#00E5B0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0]/40"
                >
                  Nézd meg a bemutatót
                </Link>
              </div>
            </div>

            {/* Jobb oldali „app preview” kártya */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[36px] bg-[radial-gradient(circle,_rgba(34,255,201,0.6)_1px,transparent_1px)] opacity-20 mix-blend-overlay [background-size:22px_22px]" />
              <div className="absolute inset-0 -translate-y-8 translate-x-6 rounded-[32px] bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-[rgb(var(--color-bg-muted-rgb)/0.96)] shadow-pop">
                <div className="flex items-center justify-between border-b border-border/60 px-6 py-5 text-xs font-semibold uppercase tracking-[0.32em] text-fg-muted">
                  <span>Propono canvas</span>
                  <span className="rounded-full bg-bg px-4 py-1 text-[10px] font-semibold text-primary">
                    Real-time preview
                  </span>
                </div>

                <div className="space-y-4 p-6 text-sm">
                  <Card className="flex items-center justify-between bg-bg px-5 py-4 shadow-none">
                    <div>
                      <p className="font-semibold">Webfejlesztési ajánlat</p>
                      <p className="text-xs text-fg-muted">AI draft • frissítve 18 mp ezelőtt</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                      <span className="h-2 w-2 rounded-full bg-primary" /> Live sync
                    </span>
                  </Card>

                  <div className="grid gap-3 md:grid-cols-2">
                    {spotlight.map((item) => (
                      <Card key={item} className="p-4 text-sm text-fg-muted bg-bg shadow-none">
                        <p className="font-medium text-fg">{item}</p>
                      </Card>
                    ))}
                  </div>

                  <Card className="p-5 border-primary/30 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">AI kalkuláció</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-fg-muted">
                        <span>UI tervezés (20 óra)</span>
                        <span className="font-semibold text-fg">220 000 Ft</span>
                      </div>
                      <div className="flex items-center justify-between text-fg-muted">
                        <span>Fejlesztés (60 óra)</span>
                        <span className="font-semibold text-fg">660 000 Ft</span>
                      </div>
                      <div className="flex items-center justify-between text-primary">
                        <span>Összesen</span>
                        <span className="text-lg font-semibold text-primary">880 000 Ft</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* BENEFITS */}
          <section className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden p-8 transition duration-200 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-pop"
              >
                <div className="absolute -top-24 right-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl transition duration-200 ease-out group-hover:scale-125" />
                <h3 className="text-xl font-semibold text-fg">{feature.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-fg-muted">{feature.description}</p>
              </Card>
            ))}
          </section>

          {/* HOW IT WORKS */}
          <div className="mx-auto w-full max-w-6xl px-6">
            <Card as="section" className="grid gap-12 p-12 md:gap-14 lg:grid-cols-[0.55fr_1fr]">
              <div className="space-y-7">
                <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
                  Folyamat vizuálisan
                </span>
                <h2 className="text-3xl font-semibold text-fg">Három lépés, ahol a csapatod együtt dolgozik</h2>
                <p className="text-base leading-relaxed text-fg-muted">
                  A Propono felülete szabad vászonként működik. A blokkokat mozgathatod, kommentelhetsz, és a háttérben az AI mindig egységes arculatot tart.
                </p>
              </div>

              <ol className="relative space-y-5 border-l border-border/60 pl-6">
                {steps.map((step, index) => (
                  <Card
                    as="li"
                    key={step.title}
                    className="relative space-y-2 bg-bg p-5"
                  >
                    <span className="absolute -left-[38px] grid h-8 w-8 place-items-center rounded-full bg-primary/10 font-mono text-xs text-primary">
                      {index + 1}
                    </span>
                    <p className="text-base font-semibold">{step.title}</p>
                    <p className="text-base leading-relaxed text-fg-muted">{step.description}</p>
                  </Card>
                ))}
              </ol>
            </Card>
          </div>

          {/* QUOTE + FEATURE GRID */}
          <section className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_0.55fr]">
            <Card className="p-10">
              <h3 className="text-2xl font-semibold text-fg">
                Márkázott PDF, ami úgy néz ki, mintha egy design stúdió készítette volna
              </h3>
              <p className="mt-5 text-base leading-relaxed text-fg-muted">
                Feltöltött logó, betűtípus és színkód – mind bekerül az ajánlat minden oldalára.
                Az AI segít az összegzésekben, de a vizuális layout a te irányításod alatt marad.
              </p>
              <div className="mt-8 grid gap-4 text-base md:grid-cols-2">
                <Card className="p-5 bg-bg shadow-none">
                  <p className="font-semibold">Dinamikus komponensek</p>
                  <p className="mt-1 text-fg-muted">Drag & drop blokkok, reszponzív rács a Penpot logikájával.</p>
                </Card>
                <Card className="p-5 bg-bg shadow-none">
                  <p className="font-semibold">Átlátható státuszok</p>
                  <p className="mt-1 text-fg-muted">Megnyitási, elfogadási és komment történet – mind visszamérhető.</p>
                </Card>
              </div>
            </Card>

            <Card className="flex flex-col justify-between gap-8 border border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-8 text-base shadow-pop">
              <p className="text-lg font-semibold text-fg">
                „A Propono olyan, mintha az ajánlatkészítéshez kapnánk egy Penpotot. Végre ugyanabban a térben dolgozik designer, sales és vezető.”
              </p>
              <div className="space-y-1 text-xs font-semibold uppercase tracking-[0.32em] text-fg-muted">
                <p>Kiss Júlia</p>
                <p>Ügynökségvezető • Studio Fluo</p>
              </div>
            </Card>
          </section>

          {/* CTA STRIP */}
          <div className="mx-auto w-full max-w-6xl px-6">
            <Card
              as="section"
              className="overflow-hidden border border-primary/40 bg-gradient-to-r from-primary/12 via-transparent to-accent/12 p-12 shadow-pop"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
                    Ajánlatkészítés újrafogalmazva
                  </span>
                  <h2 className="text-3xl font-semibold text-fg">
                    Csatlakozz a vizuális workflow-hoz, és spórolj órákat minden ajánlaton
                  </h2>
                  <p className="text-base leading-relaxed text-fg-muted">
                    Ingyenes kipróbálás, azonnali meghívás a csapattagoknak. A Propono AI az eddigi ajánlataidból tanul,
                    hogy minden új dokumentum pontos, esztétikus és márkahű legyen.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/new"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-7 py-3 text-sm font-semibold text-primary-ink transition duration-200 ease-out hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Indítsd el ingyen
                  </Link>
                  <Link
                    href="/billing"
                    className="inline-flex items-center justify-center rounded-full border border-primary/60 px-7 py-3 text-sm font-semibold text-primary transition duration-200 ease-out hover:border-primary hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Csomagok
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </main>
        <footer aria-label="Oldal lábléc" className="sr-only" />
      </div>
    </div>
  );
}
