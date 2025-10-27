import Link from 'next/link';
import HighlightUnderline from '@/components/HighlightUnderline';
import { Card } from '@/components/ui/Card';
import { t } from '@/copy';

export default function Home() {
  const features = [
    {
      title: 'Egyetlen esztétikus felület',
      description:
        'A Propono sötét és világos témában is igazodik a márkád színeihez, így minden ajánlat magabiztos, prémium hatást kelt.',
    },
    {
      title: 'AI, ami érti a briefet',
      description:
        'A magyar nyelvű AI lépésről lépésre állítja össze a szöveget, árkalkulációt és moduláris blokkokat.',
    },
    {
      title: 'Ügyfélközpontú megosztás',
      description:
        'Élő link, interaktív visszajelzések, aláírás – minden egy irányítópulton, automatikus státuszokkal.',
    },
  ];

  const steps = [
    {
      title: 'Brief & mood',
      description:
        'Importáld a projekt részleteit vagy illessz be egy e-mailt – az AI azonnal kiemeli a lényeges pontokat.',
    },
    {
      title: 'Moduláris blokkok',
      description:
        'Válaszd ki a sablonjaidat, kérj új AI-szöveget vagy szerkeszd vizuálisan a szekciókat, mint egy dizájn eszközben.',
    },
    {
      title: 'Megosztás & mérés',
      description:
        'Egy kattintással készül a márkázott PDF, közben valós időben látod, mit olvasott el az ügyfél.',
    },
  ];

  const spotlight = [
    'Szabadszavas promptok iparági sablonokkal',
    'Rugalmas rács, ahol minden komponens mozgatható',
    'Automatikus költség-blokkok és összegek',
  ];

  return (
    <main id="main" className="flex flex-col gap-28 pb-24 md:gap-32">
      {/* HERO */}
      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
        <div className="flex flex-col gap-8 lg:max-w-none">
          <span className="inline-flex w-fit items-center rounded-full border border-primary bg-primary/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Ajánlatkészítés újragondolva
          </span>

          <h1 className="relative isolate group max-w-[14ch] text-5xl font-bold leading-[1.1] tracking-[-0.125rem] text-[#151035] md:text-6xl">
            Készíts lenyűgöző <HighlightUnderline>ajánlatokat</HighlightUnderline>.
            <br />
            <span className="text-primary">Villámgyorsan.</span>
          </h1>

          <p className="max-w-[52ch] text-base leading-[1.6] text-fg-muted md:text-lg">
            A Propono AI-alapú ajánlatkészítő automatizálja az árajánlatok létrehozását teljesen
            személyre szabva, hogy te a növekedésre koncentrálhass.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/new"
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-ink shadow-lg transition duration-200 ease-out hover:shadow-pop"
            >
              Próbáld ki ingyen!
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-semibold text-fg transition duration-200 ease-out hover:border-primary hover:text-primary"
            >
              Nézd meg a bemutatót
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-3xl border border-border/70 bg-bg/90 p-8 shadow-card lg:ml-auto">
          <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
            Mit kapsz azonnal?
          </span>
          <p className="text-base leading-relaxed text-fg-muted">
            A Propono a csapatod workflow-jába simul, így az ügyfél már az első prezentációtól
            kezdve prémium élményt kap.
          </p>
          <ul className="space-y-4 text-base text-fg">
            {spotlight.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-2 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-primary"
                  aria-hidden="true"
                />
                <span className="text-fg-muted">{item}</span>
              </li>
            ))}
          </ul>
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
            <h2 className="text-3xl font-semibold text-fg">
              Három lépés, ahol a csapatod együtt dolgozik
            </h2>
            <p className="text-base leading-relaxed text-fg-muted">
              A Propono felülete szabad vászonként működik. A blokkokat mozgathatod, kommentelhetsz,
              és a háttérben az AI mindig egységes arculatot tart.
            </p>
          </div>

          <ol className="relative space-y-5 border-l border-border/60 pl-6">
            {steps.map((step, index) => (
              <Card as="li" key={step.title} className="relative space-y-2 bg-bg p-5">
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
            Feltöltött logó, betűtípus és színkód – mind bekerül az ajánlat minden oldalára. Az AI
            segít az összegzésekben, de a vizuális layout a te irányításod alatt marad.
          </p>
          <div className="mt-8 grid gap-4 text-base md:grid-cols-2">
            <Card className="p-5 bg-bg shadow-none">
              <p className="font-semibold">Dinamikus komponensek</p>
              <p className="mt-1 text-fg-muted">
                Drag & drop blokkok, reszponzív rács a Penpot logikájával.
              </p>
            </Card>
            <Card className="p-5 bg-bg shadow-none">
              <p className="font-semibold">Átlátható státuszok</p>
              <p className="mt-1 text-fg-muted">
                Megnyitási, elfogadási és komment történet – mind visszamérhető.
              </p>
            </Card>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-8 border border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-8 text-base shadow-pop">
          <p className="text-lg font-semibold text-fg">
            „A Propono olyan, mintha az ajánlatkészítéshez kapnánk egy Penpotot. Végre ugyanabban a
            térben dolgozik designer, sales és vezető.”
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
                Ingyenes kipróbálás, azonnali meghívás a csapattagoknak. A Propono AI az eddigi
                ajánlataidból tanul, hogy minden új dokumentum pontos, esztétikus és márkahű legyen.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/new"
                className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-7 py-3 text-sm font-semibold text-primary-ink transition duration-200 ease-out hover:brightness-110"
              >
                Indítsd el ingyen
              </Link>
              <Link
                href="/billing"
                className="inline-flex items-center justify-center rounded-full border border-primary/60 px-7 py-3 text-sm font-semibold text-primary transition duration-200 ease-out hover:border-primary hover:bg-primary/10"
              >
                Csomagok
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <footer aria-label="Oldal lábléc" className="sr-only" />
    </main>
  );
}
