'use client';

import { Mail, Linkedin, Twitter, Facebook, Instagram, MapPin, Phone } from 'lucide-react';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { trackEmailCapture } from '@/lib/analytics';

export function Footer() {
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setNewsletterStatus('loading');
    try {
      // Integrate with newsletter service
      await new Promise((resolve) => setTimeout(resolve, 1000));
      trackEmailCapture('footer_newsletter');
      setNewsletterStatus('success');
      setEmail('');
    } catch {
      setNewsletterStatus('idle');
    }
  };

  return (
    <footer className="bg-navy-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Company Info & Newsletter */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-turquoise-400 mb-2">Vyndi</h3>
              <p className="text-gray-400 leading-relaxed text-pretty">
                AI-alapú ajánlatkészítő platform, amely segít professzionális ajánlatokat készíteni
                percek alatt.
              </p>
            </div>

            {/* Newsletter Signup */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-balance">Iratkozz fel hírlevelünkre</h4>
              <p className="text-sm text-gray-400 mb-3 text-pretty">
                Hasznos tippek és frissítések havonta
              </p>
              {newsletterStatus === 'success' ? (
                <p className="text-sm text-green-400">Köszönjük a feliratkozást!</p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email címed"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={newsletterStatus === 'loading'}
                    required
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-turquoise-400 transition-colors min-h-[44px] text-base"
                  />
                  <button
                    type="submit"
                    disabled={newsletterStatus === 'loading'}
                    className="bg-turquoise-500 hover:bg-turquoise-600 px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap min-h-[44px] disabled:opacity-50"
                  >
                    {newsletterStatus === 'loading' ? 'Küldés...' : 'Feliratkozás'}
                  </button>
                </form>
              )}
            </div>

            {/* Social Links */}
            <div>
              <h4 className="font-semibold mb-3">Kövess minket</h4>
              <div className="flex gap-3">
                <a
                  href="https://linkedin.com/company/vyndi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-turquoise-500 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/vyndi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-turquoise-500 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://facebook.com/vyndi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-turquoise-500 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com/vyndi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-turquoise-500 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Termék</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#product-demo"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Funkciók
                </Link>
              </li>
              <li>
                <Link
                  href="/billing"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Árazás
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Integráció
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Sablonok
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Mobilapp
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Erőforrások</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Súgó központ
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Útmutatók
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Webináriumok
                </Link>
              </li>
              <li>
                <Link
                  href="/success-stories"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Esettanulmányok
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Közösség
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Cég</h4>
            <ul className="space-y-2 mb-6">
              <li>
                <Link
                  href="/success-stories"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Rólunk
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Karrier
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Partnerek
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@vyndi.hu"
                  className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
                >
                  Kapcsolat
                </a>
              </li>
            </ul>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-pretty">
                  Budapest, 1052
                  <br />
                  Magyarország
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+36123456789" className="hover:text-turquoise-400 transition-colors">
                  +36 1 234 5678
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a
                  href="mailto:hello@vyndi.hu"
                  className="hover:text-turquoise-400 transition-colors"
                >
                  hello@vyndi.hu
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-gray-400 text-sm text-pretty">
              © {new Date().getFullYear()} Vyndi. Minden jog fenntartva.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap gap-6 text-sm">
              <Link
                href="/privacy-policy"
                className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
              >
                Adatvédelmi szabályzat
              </Link>
              <Link
                href="/privacy-policy"
                className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
              >
                Felhasználási feltételek
              </Link>
              <Link
                href="/cookie-policy"
                className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
              >
                Cookie szabályzat
              </Link>
              <Link
                href="/privacy-policy"
                className="text-gray-400 hover:text-turquoise-400 transition-colors text-pretty"
              >
                GDPR
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
