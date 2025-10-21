export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Hero szöveg */}
        <section>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            Profi árajánlatok<br /> 30 másodperc alatt
          </h1>
          <p className="mt-4 text-neutral-700 leading-relaxed">
            A <b>Propono</b> AI egyedi, magyar nyelvű ajánlatot ír, PDF-be rendezi és elmenti.
            Spórolj időt, nézz ki profin.
          </p>

          <div className="mt-6 flex gap-3">
            <a href="/new" className="px-4 py-2 rounded bg-black text-white">Ajánlat készítése</a>
            <a href="/billing" className="px-4 py-2 rounded border">Csomagok megtekintése</a>
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            Nem kell kártya a kipróbáláshoz — Propono Start: 5 ajánlat / hó.
          </p>
        </section>

        {/* Előnézet doboz */}
        <aside className="rounded-2xl bg-white border p-5">
          <div className="text-sm text-neutral-600 mb-2">Előnézet</div>
          <div className="rounded-xl border p-4">
            <div className="font-medium">„Webfejlesztési árajánlat” – PDF</div>
            <ul className="list-disc ml-5 mt-2 text-sm text-neutral-700">
              <li>AI által írt, professzionális szöveg</li>
              <li>Tételes árkalkuláció (nettó/ÁFA/bruttó)</li>
              <li>Letölthető PDF – logóval</li>
            </ul>
          </div>
          <a href="/dashboard" className="inline-block mt-4 text-sm underline">
            Ugrás az irányítópultra →
          </a>
        </aside>
      </div>
    </div>
  );
}
