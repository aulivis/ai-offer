import { CaseStudy } from '@/types/case-study';
import { t } from '@/copy';

export function getCaseStudies(): CaseStudy[] {
  return [
    {
      id: '1',
      slug: 'studio-ikon',
      companyName: 'Studio Fluo',
      companyLogo: '/logos/studio-ikon.png',
      industry: 'creative',
      industryLabel: t('landing.caseStudiesInline.studioFluo.industry'),
      companySize: '15 fő',
      plan: 'Pro',
      timeline: '1 hónap',
      featured: true,
      shortDescription:
        'Egy marketing ügynökség története, amely 70%-kal gyorsabb lett az ajánlatkészítésben',
      mainResult: 'Studio Fluo | +35% Konverzió 1 Hónap Alatt',
      metrics: [
        {
          id: 'm1',
          value: '70%',
          label: 'gyorsabb ajánlatkészítés',
          description: 'Az ajánlatok átlagos elkészítési ideje 4 óráról 1.2 órára csökkent',
          before: '4 óra',
          after: '1.2 óra',
          improvement: '70% időmegtakarítás',
        },
        {
          id: 'm2',
          value: '25+',
          label: 'projekt havonta',
          description: 'A lezárt projektek száma havi 15-ről 25-re nőtt',
          before: '15',
          after: '25+',
          improvement: '+67% projektnövekedés',
        },
        {
          id: 'm3',
          value: '+35%',
          label: 'Konverzió növekedés',
          description: 'A konverzió 32%-ról 43%-ra nőtt',
          before: '32%',
          after: '43%',
          improvement: '+35% növekedés',
        },
      ],
      challenge: t('landing.caseStudiesInline.studioFluo.challenge'),
      challengePoints: [
        'Egy ajánlat elkészítése átlagosan 4 órát vett igénybe',
        'Inkonzisztens ajánlat formátumok különböző ügyfeleknek',
        'Nehéz volt követni, hogy melyik ajánlat milyen státuszban van',
        'Az ajánlatok nem voltak elég vizuálisak és professzionálisak',
        'Sok idő ment el formázással és szerkesztéssel',
      ],
      solution: t('landing.caseStudiesInline.studioFluo.solution'),
      featuresUsed: [
        'AI szöveggenerálás ügyféligényekhez',
        'Testreszabható ajánlat sablonok',
        'Automatikus márka-konzisztencia',
        'Valós idejű együttműködés csapattagokkal',
        'Ajánlat státusz követés',
        'Professzionális PDF export',
        'Egyedi branding és logók',
        'Analitika és jelentések',
      ],
      resultTimeline: [
        {
          week: '1',
          period: '1. hét',
          title: 'Onboarding és sablon létrehozás',
          description:
            'A csapat beállította a Vyndi-t, létrehozta az első sablonokat és áthelyezte a meglévő tartalmakat.',
          metrics: '3 sablon létrehozva',
        },
        {
          week: '2-4',
          period: '2-4. hét',
          title: 'Átállás és tanulás',
          description:
            'A csapattagok elkezdték használni a Vyndi-t napi munkájukban. Kezdetben párhuzamosan futtatták a régi folyamattal.',
          metrics: '30%-os időmegtakarítás',
        },
        {
          week: '5-8',
          period: '5-8. hét',
          title: 'Teljes átállás',
          description:
            'Minden ajánlatot már a Vyndi-vel készítettek. A csapat optimalizálta a sablonokat és folyamatokat.',
          metrics: '60%-os időmegtakarítás',
        },
        {
          week: '12',
          period: '3. hónap',
          title: 'Maximális hatékonyság',
          description:
            'A csapat teljesen elsajátította a rendszert. Az ajánlatkészítési idő stabilizálódott 1.2 óra körül.',
          metrics: '70% időmegtakarítás + 35% magasabb konverzió',
        },
      ],
      implementationSteps: [
        {
          title: 'Sablonok létrehozása',
          description:
            'Az első lépésben létrehoztuk a leggyakrabban használt ajánlattípusokhoz a sablonokat, beépítve a Studio Ikon branding elemeit és logóját.',
        },
        {
          title: 'AI prompting finomhangolás',
          description:
            'Beállítottuk az AI szöveggenerálást úgy, hogy tükrözze a Studio Ikon kommunikációs stílusát és hangvételét.',
        },
        {
          title: 'Csapat képzés',
          description:
            'Online workshop keretében megtanítottuk a csapatot a Vyndi használatára, a legjobb gyakorlatokra és tippekre.',
        },
        {
          title: 'Folyamat optimalizálás',
          description:
            'Beállítottuk a workflow-kat, értesítéseket és együttműködési szabályokat, hogy a csapat zökkenőmentesen tudjon dolgozni.',
        },
      ],
      testimonial: {
        quote:
          'A legnagyobb változás a professzionális megjelenés. Egy potenciális ügyfél azt mondta: "Ez az ajánlat annyira átlátható, hogy azonnal igent mondtunk." A konverziónk 32%-ról 43%-ra nőtt, és 3 nappal csökkent az átfutási idő.',
        fullQuote:
          'A legnagyobb változás a professzionális megjelenés. Egy potenciális ügyfél azt mondta: "Ez az ajánlat annyira átlátható, hogy azonnal igent mondtunk." A konverziónk 32%-ról 43%-ra nőtt, és 3 nappal csökkent az átfutási idő. Korábban napi 3-4 órát töltöttünk ajánlatkészítéssel, ami elég frusztráló volt, mert ez idő alatt nem tudtunk a kreatív munkára koncentrálni. A Vyndi bevezetése óta mindez megváltozott. Most egy ajánlat elkészítése átlagosan 1 óra, az AI segít a szövegekben, a sablonok pedig biztosítják, hogy minden ajánlat professzionális legyen.',
        author: t('landing.caseStudiesInline.studioFluo.author'),
        authorInitials: 'KJ',
        role: t('landing.caseStudiesInline.studioFluo.role'),
      },
      publishedDate: '2025-01-15',
      featuredImage: '/case-studies/studio-ikon-hero.jpg',
      relatedCaseStudies: ['tech-solutions', 'marketing-ugynokseg-sablon-automatizacio'],
      // Legacy support
      company: 'Studio Fluo',
      results: [
        {
          metric: '70%',
          label: t('landing.caseStudiesInline.studioFluo.results.timeSaved'),
        },
        {
          metric: '25+',
          label: t('landing.caseStudiesInline.studioFluo.results.offersPerWeek'),
        },
        {
          metric: '+35%',
          label: t('landing.caseStudiesInline.studioFluo.results.acceptanceRate'),
        },
      ],
      stats: {
        timeSaved: '150+ óra/hó',
        revenue: '+40% árbevétel',
        proposals: '500+ ajánlat',
      },
      hasVideo: false,
      hasPDF: false,
    },
    {
      id: '2',
      slug: 'tech-solutions',
      companyName: 'Tech Solutions Kft.',
      companyLogo: '/logos/tech-solutions.png',
      industry: 'it',
      industryLabel: t('landing.caseStudiesInline.techSolutions.industry'),
      companySize: '25 fő',
      plan: 'Pro',
      timeline: '3 hét',
      featured: true,
      shortDescription: 'IT szolgáltató, amely 65%-kal csökkentette az ajánlatkészítési idejét',
      mainResult: 'Tech Solutions Kft. | 65% Gyorsulás 3 Hét Alatt',
      metrics: [
        {
          id: 'm1',
          value: '2.8',
          label: 'Heti szabadidő',
          description: 'Heti 2.8 óra többet tudnak stratégiai munkára fordítani',
          before: '0 óra',
          after: '2.8 óra',
          improvement: '65% időmegtakarítás',
        },
        {
          id: 'm2',
          value: '50+',
          label: 'sablon',
          description: '50+ testreszabható sablon különböző projekttípusokhoz',
          before: '5',
          after: '50+',
          improvement: '10x több sablon',
        },
        {
          id: 'm3',
          value: '98%',
          label: 'ügyfél elégedettség',
          description: 'Az ügyfelek 98%-a elégedett az ajánlatokkal',
          before: '75%',
          after: '98%',
          improvement: '+23% elégedettség',
        },
      ],
      challenge: t('landing.caseStudiesInline.techSolutions.challenge'),
      challengePoints: [
        'A technikai ajánlatok összetettek voltak és sok időt vettek igénybe',
        'Különböző projektekhez különböző sablonokra volt szükség',
        'Nehéz volt követni az ajánlatok státuszát',
        'A technikai leírások manuális írása időigényes volt',
        'Inkonzisztens formátumok és stílusok',
      ],
      solution: t('landing.caseStudiesInline.techSolutions.solution'),
      featuresUsed: [
        'Moduláris blokkrendszer',
        'AI-alapú technikai leírások',
        'Valós idejű státusz követés',
        'Testreszabható sablonok',
        'Többnyelvű támogatás',
        'Integrációk projektmenedzsment eszközökkel',
      ],
      resultTimeline: [
        {
          week: '1-2',
          period: '1-2. hét',
          title: 'Sablon létrehozás és beállítás',
          description: 'Létrehozták a technikai sablonokat és beállították a rendszert.',
          metrics: '20 sablon létrehozva',
        },
        {
          week: '3-4',
          period: '3-4. hét',
          title: 'Csapat képzés',
          description: 'A csapat megtanulta a Vyndi használatát és elkezdte alkalmazni.',
          metrics: '40%-os időmegtakarítás',
        },
        {
          week: '8',
          period: '2. hónap',
          title: 'Teljes átállás',
          description: 'Minden ajánlatot a Vyndi-vel készítettek.',
          metrics: '60%-os időmegtakarítás',
        },
        {
          week: '16',
          period: '4. hónap',
          title: 'Optimalizált folyamatok',
          description: 'A folyamatok teljesen optimalizálva lettek, 65%-os időmegtakarítás elérve.',
          metrics: '65% időmegtakarítás + 98% elégedettség',
        },
      ],
      implementationSteps: [
        {
          title: 'Sablon fejlesztés',
          description:
            'Létrehoztuk a technikai ajánlatokhoz szükséges sablonokat, beleértve a moduláris blokkokat.',
        },
        {
          title: 'AI beállítás',
          description:
            'Beállítottuk az AI-t a technikai leírások generálásához, specifikus iparági kifejezésekkel.',
        },
        {
          title: 'Integrációk',
          description: 'Beállítottuk az integrációkat a meglévő projektmenedzsment eszközökkel.',
        },
        {
          title: 'Csapat képzés',
          description: 'Képzést tartottunk a csapatnak a legjobb gyakorlatokról és tippekről.',
        },
      ],
      testimonial: {
        quote:
          'Mielőtt a Vyndit használtuk, egy árajánlat 4,5 óránkba került - sablonkereséssel, árazással, egyeztetéssel. Most 1,7 óra alatt kész vagyunk. A csapat 2,8 órával többet tud stratégiai munkára fordítani, és az ügyfelek is érzik a gyorsaságot.',
        fullQuote:
          'Mielőtt a Vyndit használtuk, egy árajánlat 4,5 óránkba került - sablonkereséssel, árazással, egyeztetéssel. Most 1,7 óra alatt kész vagyunk. A csapat 2,8 órával többet tud stratégiai munkára fordítani, és az ügyfelek is érzik a gyorsaságot. A Vyndi moduláris rendszere és AI funkciói lehetővé tették, hogy gyorsan és pontosan válaszoljunk az ügyfelek kéréseire. Az ajánlatkészítési időnk 65%-kal csökkent, és az ügyfeleink 98%-a elégedett az új ajánlatokkal.',
        author: t('landing.caseStudiesInline.techSolutions.author'),
        authorInitials: 'NP',
        role: t('landing.caseStudiesInline.techSolutions.role'),
      },
      publishedDate: '2025-01-20',
      featuredImage: '/case-studies/tech-solutions-hero.jpg',
      relatedCaseStudies: ['studio-ikon', 'marketing-ugynokseg-sablon-automatizacio'],
      // Legacy support
      company: 'Tech Solutions Kft.',
      results: [
        {
          metric: '-65%',
          label: t('landing.caseStudiesInline.techSolutions.results.offerTime'),
        },
        {
          metric: '50+',
          label: t('landing.caseStudiesInline.techSolutions.results.templatesCount'),
        },
        {
          metric: '98%',
          label: t('landing.caseStudiesInline.techSolutions.results.satisfaction'),
        },
      ],
      stats: {
        timeSaved: '200+ óra/hó',
        revenue: '+55% megrendelés',
        proposals: '800+ ajánlat',
      },
      hasVideo: false,
      hasPDF: false,
    },
    {
      id: '3',
      slug: 'marketing-ugynokseg-sablon-automatizacio',
      companyName: 'Creative Agency (Budapest)',
      companyLogo: '/logos/creative-agency.png',
      industry: 'marketing',
      industryLabel: t('landing.caseStudiesInline.creativeAgency.industry'),
      companySize: '12 fős csapat',
      plan: 'Pro',
      timeline: '2 hónap alatt',
      featured: false,
      shortDescription:
        'A Vyndi előtt egy hónapban 20 ajánlatot tudtunk készíteni. Most 40-et. Ugyanannyi emberrel, dupla bevétellel.',
      mainResult: 'Hogyan Spórolt 96 Munkaórát Havonta a 12 Fős Creative Agency',
      metrics: [
        {
          id: 'm1',
          value: '10 óra → 2 óra',
          label: 'Sablonkészítés idő',
          description: '10 óra → 2 óra egy sablonra. Ez évi 96 munkaóra megtakarítás a csapatnak.',
          before: '10 óra',
          after: '2 óra',
          improvement: '80% időmegtakarítás',
        },
        {
          id: 'm2',
          value: '60% → 100%',
          label: 'Márkakonzisztencia',
          description: '60% → 100% konzisztens ajánlatok. 0 visszautasítás dizájn miatt.',
          before: '60%',
          after: '100%',
          improvement: '+40% konzisztencia',
        },
        {
          id: 'm3',
          value: '20 → 40+',
          label: 'Ajánlat/hónap',
          description: '20 → 40+ ajánlat ugyanannyi emberrel. +100% kapacitás = dupla bevétel.',
          before: '20',
          after: '40+',
          improvement: '+100% kapacitás',
        },
      ],
      challenge: 'Egy hétvége alatt 5 ajánlat - lehetetlen',
      challengePoints: [
        'Egy sablon készítése 10 óra - mire kész, addigra már elavult',
        'Minden ajánlat kinézete más volt - az ügyfelek megkérdőjelezték a profizmusunkat',
        'A csapat túlórázott, 2 designer majdnem felmondott',
        'Egy ajánlat elkészítése 60.000 Ft-ba került munkaidőben',
      ],
      solution: 'Egy héten belül 5 sablon, 0 túlóra',
      featuresUsed: [
        'Sablonkönyvtár',
        'Márkaidentitás-kezelés',
        'AI-alapú marketing szövegek',
        'Vizuális editor',
        'Automatikus márka-konzisztencia',
        'Egyszerű testreszabás',
      ],
      resultTimeline: [
        {
          week: '1',
          period: 'Január',
          title: 'Márka identitás feltöltése',
          description:
            'Logó, színek, betűtípusok - 30 perc alatt beállítva. A csapat 5 alapsablonnal kezdett.',
          metrics: '5 sablon kész, 0 túlóra',
        },
        {
          week: '2-4',
          period: 'Január',
          title: 'AI tanítása a szövegstílusunkra',
          description:
            '10 korábbi ajánlat feltöltése, az AI megtanulta a stílusunkat. Most 3 perc alatt generál ütős szöveget.',
          metrics: '50% időmegtakarítás',
        },
        {
          week: '6',
          period: 'Február',
          title: 'Teljes átállás a Vyndire',
          description:
            'A csapat már nem a Word/PDF-et használja. Az első 40 ajánlatot zökkenőmentesen küldtük ki.',
          metrics: '70% gyorsulás',
        },
        {
          week: '8',
          period: 'Február vége',
          title: 'Optimalizált folyamatok',
          description: 'A folyamatok teljesen optimalizálva lettek, 80%-os időmegtakarítás elérve.',
          metrics: '80% időmegtakarítás + 100% konzisztencia',
        },
      ],
      implementationSteps: [
        {
          title: 'Márka identitás feltöltése',
          description:
            'Logó, színek, betűtípusok - 30 perc alatt beállítva. A csapat 5 alapsablonnal kezdett.',
        },
        {
          title: 'AI tanítása a szövegstílusunkra',
          description:
            '10 korábbi ajánlat feltöltése, az AI megtanulta a stílusunkat. Most 3 perc alatt generál ütős szöveget.',
        },
        {
          title: 'Teljes átállás a Vyndire',
          description:
            'A csapat már nem a Word/PDF-et használja. Az első 40 ajánlatot zökkenőmentesen küldtük ki.',
        },
      ],
      testimonial: {
        quote:
          'A Vyndi előtt egy hónapban 20 ajánlatot tudtunk készíteni. Most 40-et. Ugyanannyi emberrel, dupla bevétellel.',
        fullQuote:
          '2024. januárjában Szabó Anna, a Creative Agency projektmenedzsere azzal a problémával küzdött, hogy egy nagy kampányhoz 5 komplex ajánlatot kellett volna készíteniük 3 nap alatt. A csapat már teljes kapacitáson dolgozott. Az egyik ügyfél visszaküldte az ajánlatot, mert "nem nézett ki professzionálisan". Pedig a tartalom tökéletes volt. A dizájn rombolt meg mindent. Anna először szkeptikus volt. "Már megpróbáltunk sablonrendszert, de sose működött." Aztán látta a Vyndi moduláris megoldását és a AI szövegvarázslót. Az a pillanat, amikor az egyik designer azt mondta: "Most végre a kreatív munkára tudok koncentrálni, a sablonozást hagyom a robotra." Akkor tudtam, hogy ez működik.',
        author: t('landing.caseStudiesInline.creativeAgency.author'),
        authorInitials: 'SA',
        role: t('landing.caseStudiesInline.creativeAgency.role'),
      },
      publishedDate: '2025-01-25',
      featuredImage: '/case-studies/creative-agency-hero.jpg',
      relatedCaseStudies: ['studio-ikon', 'tech-solutions'],
      // Legacy support
      company: 'Creative Agency (Budapest)',
      results: [
        {
          metric: '10 óra → 2 óra',
          label: 'Sablonkészítés idő',
        },
        {
          metric: '60% → 100%',
          label: 'Márkakonzisztencia',
        },
        {
          metric: '20 → 40+',
          label: 'Ajánlat/hónap',
        },
      ],
      stats: {
        timeSaved: '120+ óra/hó',
        revenue: '+30% árbevétel',
        proposals: '400+ ajánlat',
      },
      hasVideo: false,
      hasPDF: false,
    },
  ];
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return getCaseStudies().find((study) => study.slug === slug);
}

export function getRelatedCaseStudies(currentSlug: string, limit: number = 3): CaseStudy[] {
  const currentStudy = getCaseStudyBySlug(currentSlug);
  if (!currentStudy) return [];

  return getCaseStudies()
    .filter((study) => study.slug !== currentSlug)
    .slice(0, limit);
}
