'use client';

import { Mail, Linkedin, Twitter, Facebook, Instagram, MapPin, Phone, Send } from 'lucide-react';
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
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'footer',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hiba történt a feliratkozás során');
      }

      trackEmailCapture('footer_newsletter');
      setNewsletterStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setNewsletterStatus('idle');
    }
  };

  return (
    <footer className="bg-navy-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column - 40% */}
          {/* Enhanced brand section with better newsletter styling */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-turquoise-400 mb-4">Vyndi</h3>
              <p className="text-gray-300 text-lg leading-relaxed text-pretty">
                AI-alapú ajánlatkészítő platform, amellyel percek alatt készíthetsz professzionális,
                automatizált ajánlatokat – gyorsan, egységesen és márkahűen.
              </p>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-navy-800 rounded-2xl p-6 border border-navy-700 mb-6">
              <h4 className="font-bold text-xl mb-3">Iratkozz fel a Vyndi hírlevelére</h4>
              <p className="text-gray-400 text-sm mb-4 text-pretty">
                Havi egyszer hasznos tippeket, új funkciókat és inspirációkat küldünk az
                ajánlatkészítés hatékonyabbá tételéhez.
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
                    className="flex-1 px-4 py-3 rounded-lg bg-navy-900 border border-navy-600 focus:outline-none focus:ring-2 focus:ring-turquoise-500 text-white placeholder-gray-500 min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={newsletterStatus === 'loading'}
                    className="bg-turquoise-600 hover:bg-turquoise-700 p-3 rounded-lg transition-colors min-h-[44px] min-w-[44px] disabled:opacity-50 flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              )}
            </div>

            {/* Social Links */}
            {/* Larger, better styled social icons */}
            <div>
              <p className="text-gray-400 text-sm mb-3 font-semibold">Kövess minket</p>
              <div className="flex gap-3">
                <a
                  href="https://linkedin.com/company/vyndi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-navy-800 hover:bg-turquoise-600 rounded-lg flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/vyndi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-navy-800 hover:bg-turquoise-600 rounded-lg flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://facebook.com/vyndi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-navy-800 hover:bg-turquoise-600 rounded-lg flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com/vyndi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-navy-800 hover:bg-turquoise-600 rounded-lg flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Termék Column - 20% */}
          {/* Better organized columns with larger text */}
          <div className="lg:col-span-1">
            <h4 className="font-bold text-lg mb-6 text-turquoise-400">Termék</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#product-demo"
                  className="text-gray-300 hover:text-turquoise-400 transition-colors text-base"
                >
                  Funkciók
                </Link>
              </li>
              <li>
                <Link
                  href="/billing"
                  className="text-gray-300 hover:text-turquoise-400 transition-colors text-base"
                >
                  Árazás
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-300 hover:text-turquoise-400 transition-colors text-base"
                >
                  Sablonok
                </Link>
              </li>
            </ul>
          </div>

          {/* Erőforrások Column - 20% */}
          <div className="lg:col-span-1">
            <h4 className="font-bold text-lg mb-6 text-turquoise-400">Erőforrások</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/resources"
                  className="text-gray-300 hover:text-turquoise-400 transition-colors text-base"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="text-gray-300 hover:text-turquoise-400 transition-colors text-base"
                >
                  Súgó központ
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-300 hover:text-turquoise-400 transition-colors text-base"
                >
                  Útmutatók
                </Link>
              </li>
              <li>
                <Link
                  href="/success-stories"
                  className="text-gray-300 hover:text-turquoise-400 transition-colors text-base"
                >
                  Esettanulmányok
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column - 20% */}
          {/* Enhanced contact section with icons */}
          <div className="lg:col-span-1">
            <h4 className="font-bold text-lg mb-6 text-turquoise-400">Kapcsolat</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-turquoise-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-base">
                  Budapest, 1052
                  <br />
                  Magyarország
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-turquoise-400 flex-shrink-0" />
                <a
                  href="tel:+3612345678"
                  className="text-gray-300 hover:text-turquoise-400 transition-colors text-base"
                >
                  +36 1 234 5678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-turquoise-400 flex-shrink-0" />
                <a
                  href="mailto:hello@vyndi.hu"
                  className="text-gray-300 hover:text-turquoise-400 transition-colors text-base"
                >
                  hello@vyndi.hu
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        {/* Better organized bottom section */}
        <div className="pt-8 border-t border-navy-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-gray-400 text-sm text-pretty">
              © {new Date().getFullYear()} Vyndi. Minden jog fenntartva.
            </p>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
