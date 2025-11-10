import { CaseStudy } from '@/types/case-study';
import { t } from '@/copy';

export function getCaseStudies(): CaseStudy[] {
  return [
    {
      id: '1',
      slug: 'studio-ikon',
      companyName: t('landing.caseStudiesInline.studioFluo.company'),
      companyLogo: '/logos/studio-ikon.png',
      industry: 'creative',
      industryLabel: t('landing.caseStudiesInline.studioFluo.industry'),
      companySize: '15 fő',
      plan: 'Pro',
      timeline: '3 hónap',
      featured: true,
      shortDescription:
        'Egy marketing ügynökség története, amely 70%-kal gyorsabb lett az ajánlatkészítésben',
      mainResult: '70%-kal gyorsabb ajánlatkészítés és +35% konverziós ráta',
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
          label: 'konverziós ráta',
          description: 'Az ajánlatok elfogadási aránya jelentősen javult',
          before: '15%',
          after: '50%',
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
        quote: t('landing.caseStudiesInline.studioFluo.quote'),
        fullQuote:
          'Korábban napi 3-4 órát töltöttünk ajánlatkészítéssel, ami elég frusztráló volt, mert ez idő alatt nem tudtunk a kreatív munkára koncentrálni. A Vyndi bevezetése óta mindez megváltozott. Most egy ajánlat elkészítése átlagosan 1 óra, az AI segít a szövegekben, a sablonok pedig biztosítják, hogy minden ajánlat professzionális legyen. Az ügyfelek visszajelzései alapján az ajánlataink minősége is jelentősen javult, ami +35%-os konverziós ráta növekedésben is megmutatkozik. Már nem tudom elképzelni, hogyan dolgoznánk Vyndi nélkül.',
        author: t('landing.caseStudiesInline.studioFluo.author'),
        authorInitials: 'KJ',
        role: t('landing.caseStudiesInline.studioFluo.role'),
      },
      publishedDate: '2025-01-15',
      featuredImage: '/case-studies/studio-ikon-hero.jpg',
      relatedCaseStudies: ['tech-solutions', 'creative-agency'],
      // Legacy support
      company: t('landing.caseStudiesInline.studioFluo.company'),
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
      companyName: t('landing.caseStudiesInline.techSolutions.company'),
      companyLogo: '/logos/tech-solutions.png',
      industry: 'it',
      industryLabel: t('landing.caseStudiesInline.techSolutions.industry'),
      companySize: '25 fő',
      plan: 'Pro',
      timeline: '4 hónap',
      featured: true,
      shortDescription: 'IT szolgáltató, amely 65%-kal csökkentette az ajánlatkészítési idejét',
      mainResult: '65%-kal rövidebb ajánlatkészítési idő és 98% ügyfél elégedettség',
      metrics: [
        {
          id: 'm1',
          value: '-65%',
          label: 'ajánlatkészítési idő',
          description: 'Az ajánlatkészítési idő 8 óráról 2.8 órára csökkent',
          before: '8 óra',
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
        quote: t('landing.caseStudiesInline.techSolutions.quote'),
        fullQuote:
          'A Vyndi moduláris rendszere és AI funkciói lehetővé tették, hogy gyorsan és pontosan válaszoljunk az ügyfelek kéréseire. Az ajánlatkészítési időnk 65%-kal csökkent, és az ügyfeleink 98%-a elégedett az új ajánlatokkal. A rendszer rugalmassága lehetővé teszi, hogy különböző projekttípusokhoz különböző sablonokat használjunk, miközben a márka identitásunk konzisztens marad.',
        author: t('landing.caseStudiesInline.techSolutions.author'),
        authorInitials: 'NP',
        role: t('landing.caseStudiesInline.techSolutions.role'),
      },
      publishedDate: '2025-01-20',
      featuredImage: '/case-studies/tech-solutions-hero.jpg',
      relatedCaseStudies: ['studio-ikon', 'creative-agency'],
      // Legacy support
      company: t('landing.caseStudiesInline.techSolutions.company'),
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
      slug: 'creative-agency',
      companyName: t('landing.caseStudiesInline.creativeAgency.company'),
      companyLogo: '/logos/creative-agency.png',
      industry: 'marketing',
      industryLabel: t('landing.caseStudiesInline.creativeAgency.industry'),
      companySize: '12 fő',
      plan: 'Pro',
      timeline: '2 hónap',
      featured: false,
      shortDescription: 'Marketing ügynökség, amely 80%-kal csökkentette a sablon készítési idejét',
      mainResult: '80%-kal rövidebb sablon készítési idő és 100% konzisztens megjelenés',
      metrics: [
        {
          id: 'm1',
          value: '-80%',
          label: 'sablon készítési idő',
          description: 'A sablon készítési idő 10 óráról 2 órára csökkent',
          before: '10 óra',
          after: '2 óra',
          improvement: '80% időmegtakarítás',
        },
        {
          id: 'm2',
          value: '100%',
          label: 'konzisztens megjelenés',
          description: 'Minden ajánlat konzisztens megjelenésű és márkahű',
          before: '60%',
          after: '100%',
          improvement: '+40% konzisztencia',
        },
        {
          id: 'm3',
          value: '40+',
          label: 'ajánlat/hónap',
          description: 'Havi 40+ ajánlat elkészítése zökkenőmentesen',
          before: '20',
          after: '40+',
          improvement: '+100% kapacitás',
        },
      ],
      challenge: t('landing.caseStudiesInline.creativeAgency.challenge'),
      challengePoints: [
        'A marketing kampányokhoz rendszeresen kellett ajánlatokat készíteni',
        'A sablonok nehezen testreszabhatók voltak',
        'A vizuális megjelenés nem volt konzisztens',
        'Sok idő ment el a formázásra és dizájnra',
        'Nehéz volt követni a márka irányelveket',
      ],
      solution: t('landing.caseStudiesInline.creativeAgency.solution'),
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
          period: '1. hét',
          title: 'Márka identitás beállítás',
          description: 'Beállítottuk a márka identitást és létrehoztuk az alapvető sablonokat.',
          metrics: '5 sablon létrehozva',
        },
        {
          week: '2-4',
          period: '2-4. hét',
          title: 'Sablon fejlesztés',
          description: 'Kifejlesztettük a marketing kampányokhoz szükséges sablonokat.',
          metrics: '50%-os időmegtakarítás',
        },
        {
          week: '6',
          period: '6. hét',
          title: 'Teljes átállás',
          description: 'Minden új ajánlatot a Vyndi-vel készítettek.',
          metrics: '70%-os időmegtakarítás',
        },
        {
          week: '8',
          period: '2. hónap',
          title: 'Optimalizált folyamatok',
          description: 'A folyamatok teljesen optimalizálva lettek, 80%-os időmegtakarítás elérve.',
          metrics: '80% időmegtakarítás + 100% konzisztencia',
        },
      ],
      implementationSteps: [
        {
          title: 'Márka identitás beállítás',
          description: 'Beállítottuk a márka színeit, betűtípusait és logóját a Vyndi rendszerben.',
        },
        {
          title: 'Sablon fejlesztés',
          description:
            'Létrehoztuk a marketing kampányokhoz szükséges sablonokat, amelyek automatikusan használják a márka identitást.',
        },
        {
          title: 'AI beállítás',
          description:
            'Beállítottuk az AI-t a marketing szövegek generálásához, amelyek tükrözik a márka hangvételét.',
        },
        {
          title: 'Csapat képzés',
          description:
            'Képzést tartottunk a csapatnak a sablonok használatáról és a legjobb gyakorlatokról.',
        },
      ],
      testimonial: {
        quote: t('landing.caseStudiesInline.creativeAgency.quote'),
        fullQuote:
          'A Vyndi segített, hogy minden ajánlatunk profi megjelenésű legyen, miközben jelentősen csökkent az elkészítésük ideje. A sablonkönyvtár és a márkaidentitás-kezelés lehetővé tette, hogy gyorsan, egységes megjelenéssel készítsünk ajánlatokat. Az AI segítségével a marketing szövegek is gyorsan elkészültek, és minden ajánlat konzisztens maradt a márka identitásunkkal. A csapat most 80%-kal gyorsabban dolgozik, és minden ajánlat 100%-ban konzisztens.',
        author: t('landing.caseStudiesInline.creativeAgency.author'),
        authorInitials: 'SA',
        role: t('landing.caseStudiesInline.creativeAgency.role'),
      },
      publishedDate: '2025-01-25',
      featuredImage: '/case-studies/creative-agency-hero.jpg',
      relatedCaseStudies: ['studio-ikon', 'tech-solutions'],
      // Legacy support
      company: t('landing.caseStudiesInline.creativeAgency.company'),
      results: [
        {
          metric: '-80%',
          label: t('landing.caseStudiesInline.creativeAgency.results.templateTime'),
        },
        {
          metric: '100%',
          label: t('landing.caseStudiesInline.creativeAgency.results.consistentAppearance'),
        },
        {
          metric: '40+',
          label: t('landing.caseStudiesInline.creativeAgency.results.offersPerMonth'),
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
