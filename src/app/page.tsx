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
      {/* Lágy, Penpot-szerű háttérrétegek */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% -10%, rgba(49,239,184,0.18), transparent 55%)"
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='320' height='320' viewBox='0 0 320 320' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath opacity='0.16' d='M0 80H320M0 160H320M0 240H320M80 0V320M160 0V320M240 0V320' stroke='%23777' stroke-width='1'/%3E%3C/svg%3E\")",
          mixBlendMode: 'overlay'
        }}
      />

      <div className="relative">
        {/* Sticky átlátszó fejléc Penpot-hangulattal */}
        <LandingHeader className="bg-bg/60 backdrop-blur supports-[backdrop-filter]:bg-bg/40 border-b border-border" />

        <main id="main" className="mx-auto flex max-w-6xl flex-col gap-24 px-6 pb-24 pt-6">
          {/* HERO */}
          <section className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[rgb(var(--color-bg-muted-rgb)/0.6)] px-4 py-1 text-xs font-medium uppercase tracking-[0.35em] text-fg-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> ÚJ GENERÁCIÓS AJÁNLAT
              </span>

              <h1 className="text-4xl md:text-6xl font-semibold tracking-[-0.02em]">
                Magyar{' '}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  AI ajánlat designer
                </span>
              </h1>

              <p className="max-w-2xl text-lg leading-relaxed text-fg-muted">
                A Propono vizuális ajánlatkészítő felület, amely a Penpot szabad formavilágát ötvözi az AI sebességével. Húzd, szerkeszd, promptolj, majd küldd tovább percek alatt – pixeltiszta, márkahű PDF-ben.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/new"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-7 py-3 text-sm font-semibold text-primary-ink shadow-pop transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Kezdj el egy ajánlatot
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-semibold text-fg transition hover:border-fg hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Nézd meg a demót
                </Link>
              </div>

              <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-fg-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Stripe védelem
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Ingyenes próba 3 ajánlattal
                </span>
              </div>
            </div>

            {/* Jobb oldali „app preview” kártya */}
            <div className="relative">
              <div className="absolute inset-0 -translate-y-6 translate-x-8 rounded-[40px] bg-gradient-to-br from-bg-muted via-bg to-bg-muted blur-3xl" />
              <div className="relative overflow-hidden rounded-[40px] border border-border bg-[rgb(var(--color-bg-muted-rgb)/0.8)] shadow-pop">
                <div className="flex items-center justify-between border-b border-border px-6 py-5 text-xs uppercase tracking-[0.3em] text-fg-muted">
                  <span>Propono canvas</span>
                  <span className="rounded-full bg-bg px-4 py-1 text-[10px] font-semibold text-accent">
                    Real-time preview
                  </span>
                </div>

                <div className="space-y-4 p-6 text-sm">
                  <Card className="p-0 flex items-center justify-between bg-bg px-5 py-4 shadow-none">
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
                      <Card
                        key={item}
                        className="p-4 text-xs text-fg-muted bg-bg/80 shadow-none"
                      >
                        <p className="font-medium text-fg">{item}</p>
                      </Card>
                    ))}
                  </div>

                  <Card className="p-5 border-primary/25 bg-gradient-to-r from-bg via-bg-muted to-bg shadow-none">
                    <p className="text-xs uppercase tracking-[0.4em] text-primary">AI kalkuláció</p>
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
          <section className="grid gap-6 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden p-6 transition duration-300 hover:border-primary/40 hover:shadow-pop"
              >
                <div className="absolute -top-24 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition duration-300 group-hover:scale-125" />
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{feature.description}</p>
              </Card>
            ))}
          </section>

          {/* HOW IT WORKS */}
          <Card as="section" className="grid gap-12 p-10 lg:grid-cols-[0.55fr_1fr]">
            <div className="space-y-6">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                Folyamat vizuálisan
              </span>
              <h2 className="text-3xl font-semibold">Három lépés, ahol a csapatod együtt dolgozik</h2>
              <p className="text-sm leading-relaxed text-fg-muted">
                A Propono felülete szabad vászonként működik. A blokkokat mozgathatod, kommentelhetsz, és a háttérben az AI mindig egységes arculatot tart.
              </p>
            </div>

            <ol className="relative space-y-5 border-l border-border pl-6">
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
                  <p className="text-sm leading-relaxed text-fg-muted">{step.description}</p>
                </Card>
              ))}
            </ol>
          </Card>

          {/* QUOTE + FEATURE GRID */}
          <section className="grid gap-10 lg:grid-cols-[1fr_0.55fr]">
            <Card className="p-9">
              <h3 className="text-2xl font-semibold">
                Márkázott PDF, ami úgy néz ki, mintha egy design stúdió készítette volna
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-fg-muted">
                Feltöltött logó, betűtípus és színkód – mind bekerül az ajánlat minden oldalára.
                Az AI segít az összegzésekben, de a vizuális layout a te irányításod alatt marad.
              </p>
              <div className="mt-7 grid gap-4 text-sm md:grid-cols-2">
                <Card className="p-4 bg-bg shadow-none">
                  <p className="font-semibold">Dinamikus komponensek</p>
                  <p className="mt-1 text-fg-muted">Drag & drop blokkok, reszponzív rács a Penpot logikájával.</p>
                </Card>
                <Card className="p-4 bg-bg shadow-none">
                  <p className="font-semibold">Átlátható státuszok</p>
                  <p className="mt-1 text-fg-muted">Megnyitási, elfogadási és komment történet – mind visszamérhető.</p>
                </Card>
              </div>
            </Card>

            <Card className="flex flex-col justify-between gap-6 bg-gradient-to-br from-bg-muted via-bg to-bg-muted p-8 text-sm shadow-pop">
              <p className="text-lg font-semibold">
                „A Propono olyan, mintha az ajánlatkészítéshez kapnánk egy Penpotot. Végre ugyanabban a térben dolgozik designer, sales és vezető.”
              </p>
              <div className="space-y-1 text-xs uppercase tracking-[0.3em] text-fg-muted">
                <p>Kiss Júlia</p>
                <p>Ügynökségvezető • Studio Fluo</p>
              </div>
            </Card>
          </section>

          {/* CTA STRIP */}
          <Card
            as="section"
            className="overflow-hidden border-primary/25 bg-gradient-to-r from-bg via-bg-muted to-bg p-12 shadow-pop"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                  Ajánlatkészítés újrafogalmazva
                </span>
                <h2 className="text-3xl font-semibold">
                  Csatlakozz a vizuális workflow-hoz, és spórolj órákat minden ajánlaton
                </h2>
                <p className="text-sm leading-relaxed text-fg-muted">
                  Ingyenes kipróbálás, azonnali meghívás a csapattagoknak. A Propono AI az eddigi ajánlataidból tanul,
                  hogy minden új dokumentum pontos, esztétikus és márkahű legyen.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/new"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-7 py-3 text-sm font-semibold text-primary-ink transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Indítsd el ingyen
                </Link>
                <Link
                  href="/billing"
                  className="inline-flex items-center justify-center rounded-full border border-primary/40 px-7 py-3 text-sm font-semibold text-primary transition hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Csomagok
                </Link>
              </div>
            </div>
          </Card>
        </main>
        <footer aria-label="Oldal lábléc" className="sr-only" />
      </div>
    </div>
  );
}
