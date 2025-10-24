import Link from 'next/link';

export default function DemoPlaceholderPage() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pb-20 pt-24 text-center"
    >
      <div className="max-w-xl space-y-6 rounded-3xl border border-border/60 bg-bg/90 p-12 shadow-card backdrop-blur">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Demó
        </span>
        <h1 className="text-4xl font-bold tracking-[-0.125rem] text-[#151035]">
          Interaktív demó hamarosan
        </h1>
        <p className="text-base leading-relaxed text-fg-muted">
          Dolgozunk egy részletes bemutatón, ahol lépésről lépésre kipróbálhatod a Propono
          ajánlatkészítő folyamatát. Addig is regisztrálj és kezdd el ingyen az Ingyenes csomaggal,
          vagy lépj tovább a Propono Standard 10 ajánlatos keretével.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-ink shadow-lg transition duration-200 ease-out hover:shadow-pop"
          >
            Bejelentkezés
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-fg transition duration-200 ease-out hover:border-primary hover:text-primary"
          >
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    </main>
  );
}
