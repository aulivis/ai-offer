import { getRequestLanguage } from '@/app/lib/language';
import { withLanguage } from '@/state/lang.server';

export default async function OfferLayout({ children }: { children: React.ReactNode }) {
  const language = await getRequestLanguage();

  return withLanguage(language, () => (
    <div className="min-h-screen bg-bg flex flex-col">
      <main className="flex-1">{children}</main>
      {/* Only show footer's last row */}
      <footer className="bg-navy-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-fg-muted text-sm text-pretty">
              © {new Date().getFullYear()} Vyndi. Minden jog fenntartva.
            </p>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a
                href="/privacy-policy"
                className="text-fg-muted hover:text-primary transition-colors text-pretty"
              >
                Adatvédelmi szabályzat
              </a>
              <a
                href="/privacy-policy"
                className="text-fg-muted hover:text-primary transition-colors text-pretty"
              >
                Felhasználási feltételek
              </a>
              <a
                href="/cookie-policy"
                className="text-fg-muted hover:text-primary transition-colors text-pretty"
              >
                Cookie szabályzat
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  ));
}
