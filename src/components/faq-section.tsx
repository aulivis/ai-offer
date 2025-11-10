'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Search,
  HelpCircle,
  Settings,
  Puzzle,
  DollarSign,
  Shield,
  Headphones,
  Users,
  Download,
  MessageCircle,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(1); // First FAQ open by default
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      id: 1,
      category: 'általános',
      categoryIcon: HelpCircle,
      iconColor: 'text-turquoise-600',
      iconBg: 'bg-turquoise-50',
      question: 'Mennyire nehéz megtanulni a Vyndi használatát?',
      answer:
        'A Vyndi használata rendkívül egyszerű és intuitív. A legtöbb felhasználó 10-15 perc alatt képes az első professzionális ajánlatot elkészíteni. Emellett részletes videó útmutatókat és dokumentációt biztosítunk, valamint az ügyfélszolgálatunk 24/7 rendelkezésre áll, ha bármilyen kérdésed merülne fel.',
    },
    {
      id: 2,
      category: 'funkció',
      categoryIcon: Settings,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      question: 'Milyen típusú ajánlatokat készíthetek a Vyndivel?',
      answer:
        'A Vyndi minden típusú üzleti ajánlat készítésére alkalmas: szolgáltatási ajánlatok, termék ajánlatok, projekt ajánlatok, marketing csomagok, IT szolgáltatások, tanácsadói ajánlatok és még sok más. 50+ iparág-specifikus sablonnal rendelkezünk, amelyek teljes mértékben testreszabhatók.',
    },
    {
      id: 3,
      category: 'integráció',
      categoryIcon: Puzzle,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      question: 'Integrálható a Vyndi a meglévő CRM rendszeremmel?',
      answer:
        'Igen, a Vyndi integrálható a legnépszerűbb CRM rendszerekkel (Salesforce, HubSpot, Pipedrive, stb.) és egyéb üzleti eszközökkel. Az integráció egyszerű és gyors, és lehetővé teszi, hogy az ügyfél adatok automatikusan szinkronizálódjanak a Vyndi és a CRM között.',
    },
    {
      id: 4,
      category: 'díjazás',
      categoryIcon: DollarSign,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
      question: 'Van ingyenes próbaidőszak?',
      answer:
        'Igen, 14 napos ingyenes próbaidőszakot kínálunk, amely során teljes hozzáférést kapsz az összes funkcióhoz. Nem kell bankkártyát megadnod a regisztrációhoz, és bármikor lemondhatod a próbaidőszakot. Ha tetszik a Vyndi, akkor válaszd ki a számodra megfelelő csomagot.',
    },
    {
      id: 5,
      category: 'biztonság',
      categoryIcon: Shield,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      question: 'Mennyire biztonságos az adataim tárolása a Vyndiben?',
      answer:
        'Az adatbiztonság számunkra kiemelten fontos. A Vyndi vállalati szintű titkosítást használ (256-bit SSL), és minden adat biztonságos szerveren tárolódik az EU-ban. GDPR kompatibilisek vagyunk, és rendszeres biztonsági auditokat végzünk. Az adataid kizárólag a te tulajdonodban vannak.',
    },
    {
      id: 6,
      category: 'támogatás',
      categoryIcon: Headphones,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
      question: 'Milyen támogatást kapok, ha elakadok?',
      answer:
        'Teljes körű támogatást biztosítunk minden ügyfélnek: 24/7 élő chat támogatás, email support, részletes dokumentáció, videó oktatóanyagok és rendszeres webináriumok. A Pro és Enterprise csomagok dedikált ügyfélkapcsolati menedzsert is tartalmaznak, aki segít az indulásban és a rendszer optimalizálásában.',
    },
    {
      id: 7,
      category: 'csapat',
      categoryIcon: Users,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      question: 'Több munkatárs is használhatja egyszerre a Vyndit?',
      answer:
        'Igen, a Standard és Pro csomagok többfelhasználós hozzáférést biztosítanak. Beállíthatod a csapattagok jogosultságait, közösen dolgozhatnak az ajánlatokon valós időben, és minden változás automatikusan szinkronizálódik. Az együttműködési funkciók segítenek a csapatmunkában.',
    },
    {
      id: 8,
      category: 'export',
      categoryIcon: Download,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
      question: 'Milyen formátumban exportálhatom az ajánlatokat?',
      answer:
        'Az ajánlatokat többféle formátumban exportálhatod: PDF (nyomtatható és interaktív), Word dokumentum, online megosztható link, vagy közvetlenül elküldheted emailben az ügyfélnek. Az ajánlatok teljes mértékben tükrözik a te márkád megjelenését és professzionális formázást tartalmaznak.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleFAQ = (id: number) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 bg-gradient-to-b from-white to-gray-50 scroll-mt-20">
      <div className="container mx-auto px-4">
        {/* Enhanced Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-turquoise-100 text-turquoise-700 font-bold text-sm rounded-full mb-6">
            GYAKORI KÉRDÉSEK
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
            Válaszok a leggyakoribb kérdésekre
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-pretty">
            Minden, amit tudnod kell a Vyndi-ról, egy helyen.
          </p>

          {/* Enhanced Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Keress a kérdések között..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-12 bg-white border-2 border-gray-200 rounded-2xl focus:border-turquoise-500 focus:outline-none text-gray-700 placeholder-gray-400 transition-colors min-h-[44px]"
                aria-label="Keresés a gyakori kérdések között"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Redesigned Accordion with Fixed-Width Icons */}
        <div className="max-w-4xl mx-auto mt-12 space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openIndex === faq.id;
              const Icon = faq.categoryIcon;

              return (
                <div
                  key={faq.id}
                  className={`
                    bg-white rounded-2xl overflow-hidden transition-all duration-300
                    ${
                      isOpen
                        ? 'shadow-xl border-2 border-turquoise-400'
                        : 'shadow-md border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg'
                    }
                  `}
                >
                  {/* Question button with icon on left, perfectly aligned */}
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 md:px-8 py-5 md:py-6 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors group min-h-[44px]"
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? 'Bezárás' : 'Megnyitás'}: ${faq.question}`}
                  >
                    {/* Icon container - fixed width for perfect alignment */}
                    <div
                      className={`
                        w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center
                        ${faq.iconBg} ${isOpen ? 'ring-2 ring-offset-2 ring-turquoise-400' : ''}
                        group-hover:scale-110 transition-transform
                      `}
                    >
                      <Icon className={`w-6 h-6 ${faq.iconColor}`} />
                    </div>

                    {/* Question text - always starts at same position */}
                    <span
                      className={`
                        flex-1 text-lg md:text-xl font-bold text-navy-900 leading-tight pr-4 text-balance
                        ${isOpen ? 'text-turquoise-900' : ''}
                      `}
                    >
                      {faq.question}
                    </span>

                    {/* Chevron icon */}
                    <div
                      className={`
                        w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center
                        ${isOpen ? 'bg-turquoise-100' : 'bg-gray-100 group-hover:bg-gray-200'}
                        transition-colors
                      `}
                    >
                      <ChevronDown
                        className={`
                          w-5 h-5 transition-all duration-300
                          ${isOpen ? 'rotate-180 text-turquoise-600' : 'text-gray-600'}
                        `}
                      />
                    </div>
                  </button>

                  {/* Answer section with smooth animation */}
                  <div
                    className={`
                      overflow-hidden transition-all duration-300
                      ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="px-6 md:px-8 pb-6 md:pb-8">
                      {/* Left padding to align with question text (icon width + gap = 48px + 16px = 64px = pl-16) */}
                      <div className="pl-16 border-l-4 border-turquoise-200">
                        <p className="text-gray-700 text-base md:text-lg leading-relaxed text-pretty">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg text-pretty">
                Nem találtunk eredményt a keresésedre. Próbálj más kulcsszavakat!
              </p>
            </div>
          )}
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-turquoise-50 to-blue-50 rounded-2xl p-8 border border-turquoise-200 max-w-2xl">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MessageCircle className="w-8 h-8 text-turquoise-600" />
            </div>
            <h3 className="text-2xl font-bold text-navy-900 mb-3">Nem találtad meg a választ?</h3>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto text-pretty">
              Lépj kapcsolatba velünk, és szakértő csapatunk szívesen segít az összes kérdésedben!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="mailto:hello@vyndi.com?subject=Kérdés a Vyndiről"
                className="inline-flex items-center gap-2 px-8 py-4 bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all min-h-[44px]"
              >
                <Mail className="w-5 h-5" />
                Írj nekünk emailt
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-navy-900 font-bold rounded-xl border-2 border-gray-300 hover:border-turquoise-500 transition-all min-h-[44px]"
              >
                <MessageCircle className="w-5 h-5" />
                Élő chat indítása
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
