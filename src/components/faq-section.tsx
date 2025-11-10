'use client';

import { useState } from 'react';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'Általános',
      question: 'Mennyire nehéz megtanulni a Vyndi használatát?',
      answer:
        'A Vyndi használata rendkívül egyszerű és intuitív. A legtöbb felhasználó 10-15 perc alatt képes az első professzionális ajánlatot elkészíteni. Emellett részletes videó útmutatókat és dokumentációt biztosítunk, valamint az ügyfélszolgálatunk 24/7 rendelkezésre áll, ha bármilyen kérdésed merülne fel.',
    },
    {
      category: 'Funkciók',
      question: 'Milyen típusú ajánlatokat készíthetek a Vyndivel?',
      answer:
        'A Vyndi minden típusú üzleti ajánlat készítésére alkalmas: szolgáltatási ajánlatok, termék ajánlatok, projekt ajánlatok, marketing csomagok, IT szolgáltatások, tanácsadói ajánlatok és még sok más. 50+ iparág-specifikus sablonnal rendelkezünk, amelyek teljes mértékben testreszabhatók.',
    },
    {
      category: 'Integráció',
      question: 'Integrálható a Vyndi a meglévő CRM rendszeremmel?',
      answer:
        'Igen, a Vyndi integrálható a legnépszerűbb CRM rendszerekkel (Salesforce, HubSpot, Pipedrive, stb.) és egyéb üzleti eszközökkel. Az integráció egyszerű és gyors, és lehetővé teszi, hogy az ügyfél adatok automatikusan szinkronizálódjanak a Vyndi és a CRM között.',
    },
    {
      category: 'Díjszabás',
      question: 'Van ingyenes próbaidőszak?',
      answer:
        'Igen, 14 napos ingyenes próbaidőszakot kínálunk, amely során teljes hozzáférést kapsz az összes funkcióhoz. Nem kell bankkártyát megadnod a regisztrációhoz, és bármikor lemondhatod a próbaidőszakot. Ha tetszik a Vyndi, akkor válaszd ki a számodra megfelelő csomagot.',
    },
    {
      category: 'Biztonság',
      question: 'Mennyire biztonságos az adataim tárolása a Vyndiben?',
      answer:
        'Az adatbiztonság számunkra kiemelten fontos. A Vyndi vállalati szintű titkosítást használ (256-bit SSL), és minden adat biztonságos szerveren tárolódik az EU-ban. GDPR kompatibilisek vagyunk, és rendszeres biztonsági auditokat végzünk. Az adataid kizárólag a te tulajdonodban vannak.',
    },
    {
      category: 'Támogatás',
      question: 'Milyen támogatást kapok, ha elakadok?',
      answer:
        'Teljes körű támogatást biztosítunk minden ügyfélnek: 24/7 élő chat támogatás, email support, részletes dokumentáció, videó oktatóanyagok és rendszeres webináriumok. A Pro és Enterprise csomagok dedikált ügyfélkapcsolati menedzsert is tartalmaznak, aki segít az indulásban és a rendszer optimalizálásában.',
    },
    {
      category: 'Csapat',
      question: 'Több munkatárs is használhatja egyszerre a Vyndit?',
      answer:
        'Igen, a Standard és Pro csomagok többfelhasználós hozzáférést biztosítanak. Beállíthatod a csapattagok jogosultságait, közösen dolgozhatnak az ajánlatokon valós időben, és minden változás automatikusan szinkronizálódik. Az együttműködési funkciók segítenek a csapatmunkában.',
    },
    {
      category: 'Export',
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

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gradient-to-b from-white to-gray-50 scroll-mt-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-turquoise-600 font-semibold text-sm uppercase tracking-wide mb-3">
            GYAKORI KÉRDÉSEK
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
            Válaszok a leggyakoribb kérdésekre
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
            Minden, amit tudnod kell a Vyndiről. Ha nem találod a választ, írj nekünk!
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Keress a kérdések között..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-lg border-2 border-gray-200 focus:border-turquoise-500 focus:outline-none focus:ring-2 focus:ring-turquoise-500/20 text-base sm:text-lg transition-colors min-h-[44px]"
              aria-label="Keresés a gyakori kérdések között"
            />
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          {filteredFaqs.length > 0 ? (
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-turquoise-200 transition-all overflow-hidden shadow-sm hover:shadow-md"
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-6 py-5 flex items-start gap-4 text-left transition-colors hover:bg-gray-50 min-h-[44px]"
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Bezárás' : 'Megnyitás'}: ${faq.question}`}
                    >
                      {/* Category Badge */}
                      <div className="flex-shrink-0 mt-1">
                        <span className="inline-block bg-turquoise-100 text-turquoise-700 text-xs font-semibold px-3 py-1 rounded-full">
                          {faq.category}
                        </span>
                      </div>

                      {/* Question */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-navy-900 leading-snug text-balance">
                          {faq.question}
                        </h3>
                      </div>

                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <ChevronDown
                          className={`w-6 h-6 text-turquoise-600 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Answer */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-6 pb-6 pt-2">
                        <div className="pl-4 border-l-4 border-turquoise-200">
                          <p className="text-gray-700 leading-relaxed text-pretty">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500 text-balance">
                Nem találtunk eredményt a keresésedre.
              </p>
              <p className="text-gray-400 mt-2 text-pretty">
                Próbálj meg másik kulcsszót használni!
              </p>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="max-w-4xl mx-auto mt-12 bg-gradient-to-r from-turquoise-50 to-blue-50 rounded-2xl p-8 border-2 border-turquoise-200 text-center">
          <h3 className="text-2xl font-bold text-navy-900 mb-3 text-balance">
            Nem találtad meg a választ?
          </h3>
          <p className="text-gray-600 mb-6 text-pretty">
            Csapatunk készen áll, hogy segítsen neked. Írj nekünk bármikor!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="mailto:info@vyndi.com?subject=Kérdés a Vyndiről"
              className="bg-turquoise-600 hover:bg-turquoise-700 text-white font-semibold px-6 py-3 rounded-lg transition-all min-h-[44px] flex items-center justify-center"
            >
              Kapcsolatfelvétel
            </Link>
            <button className="border-2 border-turquoise-600 text-turquoise-600 hover:bg-turquoise-600 hover:text-white font-semibold px-6 py-3 rounded-lg transition-all min-h-[44px]">
              Élő chat indítása
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
