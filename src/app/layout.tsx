import './globals.css';

export const metadata = {
  title: 'Propono',
  description: 'AI-alapú, villámgyors árajánlat-készítés',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body className="bg-neutral-50 text-neutral-900">
        <header className="border-b bg-white/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="font-semibold">Propono</a>
            <nav className="flex gap-4 text-sm">
              <a href="/new" className="hover:underline">Új ajánlat</a>
              <a href="/dashboard" className="hover:underline">Irányítópult</a>
              <a href="/billing" className="hover:underline">Előfizetés</a>
              <a href="/settings" className="hover:underline">Beállítások</a>
              <a href="/login" className="px-3 py-1 rounded bg-black text-white">Bejelentkezés</a>
            </nav>
          </div>
        </header>

        <main className="min-h-[calc(100vh-6rem)]">
          {children}
        </main>

        <footer className="h-10 border-t bg-white text-xs text-neutral-600">
          <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
            <div>© {new Date().getFullYear()} Propono</div>
            <div className="flex gap-3">
              <a href="/terms" className="hover:underline">ÁSZF</a>
              <a href="/privacy" className="hover:underline">Adatkezelés</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
