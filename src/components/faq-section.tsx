'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Search,
  HelpCircle,
  Settings,
  Plug,
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
      category: 'Általános',
      categoryIcon: HelpCircle,
      categoryColor: 'turquoise',
      question: 'Mennyire nehéz megtanulni a Vyndi használatát?',
      answer:
        'A Vyndi használata rendkívül egyszerű és intuitív. A legtöbb felhasználó 10-15 perc alatt képes az első professzionális ajánlatot elkészíteni. Emellett részletes videó útmutatókat és dokumentációt biztosítunk, valamint az ügyfélszolgálatunk 24/7 rendelkezésre áll, ha bármilyen kérdésed merülne fel.',
    },
    {
      id: 2,
      category: 'Funkciók',
      categoryIcon: Settings,
      categoryColor: 'blue',
      question: 'Milyen típusú ajánlatokat készíthetek a Vyndivel?',
      answer:
        'A Vyndi minden típusú üzleti ajánlat készítésére alkalmas: szolgáltatási ajánlatok, termék ajánlatok, projekt ajánlatok, marketing csomagok, IT szolgáltatások, tanácsadói ajánlatok és még sok más. 50+ iparág-specifikus sablonnal rendelkezünk, amelyek teljes mértékben testreszabhatók.',
    },
    {
      id: 3,
      category: 'Integráció',
      categoryIcon: Plug,
      categoryColor: 'purple',
      question: 'Integrálható a Vyndi a meglévő CRM rendszeremmel?',
      answer:
        'Igen, a Vyndi integrálható a legnépszerűbb CRM rendszerekkel (Salesforce, HubSpot, Pipedrive, stb.) és egyéb üzleti eszközökkel. Az integráció egyszerű és gyors, és lehetővé teszi, hogy az ügyfél adatok automatikusan szinkronizálódjanak a Vyndi és a CRM között.',
    },
    {
      id: 4,
      category: 'Díjazás',
      categoryIcon: DollarSign,
      categoryColor: 'green',
      question: 'Van ingyenes próbaidőszak?',
      answer:
        'Igen, 14 napos ingyenes próbaidőszakot kínálunk, amely során teljes hozzáférést kapsz az összes funkcióhoz. Nem kell bankkártyát megadnod a regisztrációhoz, és bármikor lemondhatod a próbaidőszakot. Ha tetszik a Vyndi, akkor válaszd ki a számodra megfelelő csomagot.',
    },
    {
      id: 5,
      category: 'Biztonság',
      categoryIcon: Shield,
      categoryColor: 'red',
      question: 'Mennyire biztonságos az adataim tárolása a Vyndiben?',
      answer:
        'Az adatbiztonság számunkra kiemelten fontos. A Vyndi vállalati szintű titkosítást használ (256-bit SSL), és minden adat biztonságos szerveren tárolódik az EU-ban. GDPR kompatibilisek vagyunk, és rendszeres biztonsági auditokat végzünk. Az adataid kizárólag a te tulajdonodban vannak.',
    },
    {
      id: 6,
      category: 'Támogatás',
      categoryIcon: Headphones,
      categoryColor: 'orange',
      question: 'Milyen támogatást kapok, ha elakadok?',
      answer:
        'Teljes körű támogatást biztosítunk minden ügyfélnek: 24/7 élő chat támogatás, email support, részletes dokumentáció, videó oktatóanyagok és rendszeres webináriumok. A Pro és Enterprise csomagok dedikált ügyfélkapcsolati menedzsert is tartalmaznak, aki segít az indulásban és a rendszer optimalizálásában.',
    },
    {
      id: 7,
      category: 'Csapat',
      categoryIcon: Users,
      categoryColor: 'indigo',
      question: 'Több munkatárs is használhatja egyszerre a Vyndit?',
      answer:
        'Igen, a Standard és Pro csomagok többfelhasználós hozzáférést biztosítanak. Beállíthatod a csapattagok jogosultságait, közösen dolgozhatnak az ajánlatokon valós időben, és minden változás automatikusan szinkronizálódik. Az együttműködési funkciók segítenek a csapatmunkában.',
    },
    {
      id: 8,
      category: 'Export',
      categoryIcon: Download,
      categoryColor: 'cyan',
      question: 'Milyen formátumban exportálhatom az ajánlatokat?',
      answer:
        'Az ajánlatokat többféle formátumban exportálhatod: PDF (nyomtatható és interaktív), Word dokumentum, online megosztható link, vagy közvetlenül elküldheted emailben az ügyfélnek. Az ajánlatok teljes mértékben tükrözik a te márkád megjelenését és professzionális formázást tartalmaznak.',
    },
  ];

  const categoryColors = {
    turquoise: 'bg-turquoise-100 text-turquoise-700 border-turquoise-300',
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300',
    green: 'bg-green-100 text-green-700 border-green-300',
    red: 'bg-red-100 text-red-700 border-red-300',
    orange: 'bg-orange-100 text-orange-700 border-orange-300',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  };

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
    <section id="faq" className="py-20 bg-white scroll-mt-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-turquoise-100 text-turquoise-700 rounded-full font-semibold text-sm mb-6 border border-turquoise-300">
            GYAKORI KÉRDÉSEK
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight text-balance">
            Válaszok a leggyakoribb kérdésekre
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-pretty">
            Minden, amit tudnod kell a Vyndiről. Ha nem találod a választ, írj nekünk!
          </p>

          {/* Enhanced Search Bar */}
          {/* Larger, more prominent search bar with icon */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Keress a kérdések között..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 text-lg rounded-2xl border-2 border-gray-200 focus:border-turquoise-500 focus:outline-none focus:ring-4 focus:ring-turquoise-100 transition-all shadow-sm min-h-[44px]"
              aria-label="Keresés a gyakori kérdések között"
            />
          </div>
        </div>

        {/* FAQ Accordion */}
        {/* Enhanced accordion with better styling and spacing */}
        <div className="max-w-4xl mx-auto space-y-4 mb-16">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openIndex === faq.id;
              const Icon = faq.categoryIcon;

              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden transition-all hover:shadow-lg"
                >
                  {/* Question Header */}
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full flex items-center gap-4 p-6 text-left hover:bg-gray-50 transition-colors min-h-[44px]"
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? 'Bezárás' : 'Megnyitás'}: ${faq.question}`}
                  >
                    {/* Category Badge */}
                    {/* Larger category badge with icon */}
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${categoryColors[faq.categoryColor as keyof typeof categoryColors]} flex-shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                      {faq.category}
                    </div>

                    {/* Question Text */}
                    <span className="flex-1 text-lg md:text-xl font-bold text-navy-900 pr-4 text-balance">
                      {faq.question}
                    </span>

                    {/* Chevron Icon */}
                    {/* Larger, animated chevron */}
                    <ChevronDown
                      className={`w-7 h-7 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Answer Content */}
                  {/* Smooth expand/collapse with better styling */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <div className="px-6 pb-6 pt-2">
                      <div className="pl-0 md:pl-32">
                        <p className="text-gray-700 text-lg leading-relaxed text-pretty">
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

        {/* Bottom CTA Box */}
        {/* More prominent CTA section with better styling */}
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-turquoise-50 to-blue-50 rounded-3xl p-12 border-2 border-turquoise-200 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-turquoise-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-turquoise-600" />
            </div>

            <h3 className="text-3xl font-bold text-navy-900 mb-4 text-balance">
              Nem találtad meg a választ?
            </h3>

            <p className="text-lg text-gray-600 text-pretty">
              Csapatunk készen áll, hogy segítsen neked. Írj nekünk bármikor!
            </p>
          </div>

          {/* CTA Buttons */}
          {/* Better differentiated buttons with icons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="mailto:info@vyndi.com?subject=Kérdés a Vyndiről"
              className="bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold px-10 py-4 rounded-xl text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-3 min-h-[44px]"
            >
              <Mail className="w-5 h-5" />
              Kapcsolatfelvétel
            </Link>

            <button className="bg-white hover:bg-gray-50 text-turquoise-600 font-bold px-10 py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all border-2 border-turquoise-600 inline-flex items-center gap-3 min-h-[44px]">
              <MessageCircle className="w-5 h-5" />
              Élő chat indítása
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Átlagos válaszidő: 2 óra</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>24/7 elérhetőség</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Magyar nyelvű támogatás</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
