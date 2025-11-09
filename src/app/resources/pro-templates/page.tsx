import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pro sablonok könyvtár | Vyndi',
  description:
    'Hozzáférj a prémium ajánlat sablonokhoz Pro előfizetéssel. Exkluzív, professzionális dizájnok, fejlett funkciók és korlátlan testreszabhatóság.',
  openGraph: {
    title: 'Pro sablonok könyvtár | Vyndi',
    description: 'Prémium ajánlat sablonok Pro előfizetőink számára.',
    type: 'website',
  },
};

export default function ProTemplatesPage() {
  // This would typically come from an API or database
  const proTemplates = [
    {
      id: 'pro.modern',
      name: 'Modern',
      description:
        'Korszerű, dinamikus dizájn, amely kiemeli a szolgáltatásokat és az értékajánlatot. Ideális tech cégeknek és start-upoknak.',
      category: 'Tech & Start-up',
      tags: ['modern', 'dinamikus', 'tech'],
      preview: '/templates/pro-modern-preview.png',
      features: [
        'Interaktív elemek',
        'Animált grafika',
        'Fejlett árazási táblázat',
        'Logo animáció',
      ],
      exclusive: true,
    },
    {
      id: 'pro.elegant',
      name: 'Elegáns',
      description:
        'Raffinált, luxus dizájn, amely tökéletesen megfelel a prémium szolgáltatások és brandek számára.',
      category: 'Luxury & Premium',
      tags: ['elegáns', 'luxus', 'prémium'],
      preview: '/templates/pro-elegant-preview.png',
      features: [
        'Prémium tipográfia',
        'Egyedi illusztrációk',
        'Fénykép galéria',
        'Interaktív timeline',
      ],
      exclusive: true,
    },
    {
      id: 'pro.bold',
      name: 'Merész',
      description:
        'Hangulatos, figyelemfelkeltő dizájn, amely segít kiemelkedni a versenytársak közül.',
      category: 'Kreatív',
      tags: ['merész', 'kreatív', 'figyelemfelkeltő'],
      preview: '/templates/pro-bold-preview.png',
      features: ['Vibráns színek', 'Egyedi illusztrációk', 'Parallax effektusok', 'Animált ikonok'],
      exclusive: true,
    },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16">
      {/* Breadcrumb Navigation */}
      <nav className="mb-8 text-sm text-fg-muted" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/resources" className="hover:text-primary transition-colors">
              Erőforrások
            </Link>
          </li>
          <li className="text-fg-muted">/</li>
          <li className="text-fg">Pro sablonok</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <header className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          Pro Sablonok
        </span>
        <h1 className="mt-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          Pro sablonok könyvtár
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-xl leading-relaxed text-fg-muted">
          Hozzáférj exkluzív, prémium ajánlat sablonokhoz Pro előfizetéssel. Fejlett funkciók,
          egyedi dizájnok és korlátlan testreszabhatóság vár rád.
        </p>
      </header>

      {/* Pro Benefits Banner */}
      <Card className="mb-12 border-2 border-amber-500/40 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-fg">Pro előfizetés szükséges</h2>
            <p className="text-fg-muted">
              A prémium sablonok eléréséhez Pro előfizetésre van szükség. Fizess elő még ma, és
              azonnal hozzáférsz az összes exkluzív sablonhoz!
            </p>
          </div>
          <Link
            href="/billing"
            className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Pro csomag megtekintése
          </Link>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {proTemplates.map((template) => (
          <Card
            key={template.id}
            className="group relative overflow-hidden border-2 border-amber-500/30 bg-white transition-all hover:border-amber-500/60 hover:shadow-xl"
          >
            {/* Pro Badge */}
            <div className="absolute right-4 top-4 z-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
              PRO
            </div>

            {/* Preview Image Placeholder */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <svg
                    className="mx-auto h-16 w-16 text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-4 text-xs font-medium text-amber-700">
                    [Helyőrző: {template.name} Pro sablon előnézet képe]
                  </p>
                  <p className="mt-1 text-xs text-amber-600">
                    Ajánlott: 800x1000px PDF előnézet vagy screenshot
                  </p>
                </div>
              </div>
              {/* Category Badge */}
              <div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                {template.category}
              </div>
            </div>

            {/* Template Info */}
            <div className="p-6">
              <h3 className="mb-2 text-xl font-bold text-fg group-hover:text-amber-600 transition-colors">
                {template.name}
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-fg-muted">{template.description}</p>

              {/* Features */}
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold uppercase text-gray-500">Főbb funkciók:</p>
                <ul className="space-y-1">
                  {template.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-fg-muted">
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-amber-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <Link
                href="/billing"
                className="block w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
              >
                Pro előfizetés indítása
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Pro Features Section */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">Miért válaszd a Pro sablonokat?</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100">
                <svg
                  className="h-8 w-8 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-fg">Exkluzív dizájnok</h3>
            <p className="text-sm text-fg-muted">
              Egyedülálló, professzionális sablonok, amelyeket csak Pro előfizetők érhetnek el.
            </p>
          </Card>

          <Card className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-fg">Fejlett funkciók</h3>
            <p className="text-sm text-fg-muted">
              Interaktív elemek, animációk és egyedi komponensek, amelyek kiemelik az ajánlatodat.
            </p>
          </Card>

          <Card className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
                <svg
                  className="h-8 w-8 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-fg">Korlátlan testreszabás</h3>
            <p className="text-sm text-fg-muted">
              Teljes kontroll minden elem felett - színek, tipográfia, elrendezés és még sok más.
            </p>
          </Card>

          <Card className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-fg">Elsőbbségi támogatás</h3>
            <p className="text-sm text-fg-muted">
              Pro előfizetőkként elsőbbséget kapsz a támogatásban és az új funkciók hozzáférésében.
            </p>
          </Card>
        </div>
      </div>

      {/* Comparison Table */}
      <Card className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-fg">
          Összehasonlítás: Ingyenes vs. Pro sablonok
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="px-4 py-3 text-left font-semibold text-fg">Funkció</th>
                <th className="px-4 py-3 text-center font-semibold text-fg">Ingyenes</th>
                <th className="px-4 py-3 text-center font-semibold text-amber-600">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-fg-muted">Sablonok száma</td>
                <td className="px-4 py-3 text-center text-fg-muted">1-2</td>
                <td className="px-4 py-3 text-center font-semibold text-amber-600">10+</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-fg-muted">Fejlett animációk</td>
                <td className="px-4 py-3 text-center text-fg-muted">❌</td>
                <td className="px-4 py-3 text-center font-semibold text-amber-600">✅</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-fg-muted">Interaktív elemek</td>
                <td className="px-4 py-3 text-center text-fg-muted">Korlátozott</td>
                <td className="px-4 py-3 text-center font-semibold text-amber-600">Teljes</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-fg-muted">Egyedi illusztrációk</td>
                <td className="px-4 py-3 text-center text-fg-muted">❌</td>
                <td className="px-4 py-3 text-center font-semibold text-amber-600">✅</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-fg-muted">Prémium tipográfia</td>
                <td className="px-4 py-3 text-center text-fg-muted">Alapvető</td>
                <td className="px-4 py-3 text-center font-semibold text-amber-600">Prémium</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-fg-muted">Fénykép galéria</td>
                <td className="px-4 py-3 text-center text-fg-muted">❌</td>
                <td className="px-4 py-3 text-center font-semibold text-amber-600">✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* CTA Section */}
      <Card className="mt-12 border-2 border-amber-500/40 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-fg">Lépj szintet Pro előfizetéssel!</h2>
          <p className="mb-8 text-lg text-fg-muted">
            Hozzáférj az összes prémium sablonhoz, fejlett funkciókhoz és exkluzív lehetőségekhez.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              Pro csomag megtekintése
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/resources/templates"
              className="inline-flex items-center gap-2 rounded-full border-2 border-amber-500/40 bg-white px-8 py-4 text-base font-semibold text-amber-600 transition-all hover:bg-amber-50"
            >
              Ingyenes sablonok
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
