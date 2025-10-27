export const hu = {
  common: {
    save: 'Mentés',
    cancel: 'Mégse',
    back: 'Vissza',
    next: 'Tovább',
    loading: 'Betöltés…',
    retry: 'Újra',
    delete: 'Törlés',
    edit: 'Szerkesztés',
    close: 'Bezárás',
    open: 'Megnyitás',
    status: {
      ready: 'Kész',
      inProgress: 'Folyamatban',
      missing: 'Hiányos',
      success: 'Siker',
      error: 'Hiba',
      warning: 'Figyelmeztetés',
    },
  },
  app: {
    title: 'AI Ajánlatkészítő',
    description: 'AI által támogatott, professzionális ajánlatok kis- és középvállalkozásoknak.',
    skipToContent: 'Ugrás a tartalomra',
    authErrorTitle: 'Hitelesítés sikertelen',
    authErrorFallback: 'Nem sikerült hitelesíteni a felhasználói állapotot.',
  },
  announcementBar: {
    message: 'Új ajánlat sablonok a Proponóban',
    cta: 'Próbáld ki most',
    ctaHref: '/elofizetes',
  },
  header: {
    brand: 'Propono',
    nav: {
      demo: 'Bemutató',
      caseStudies: 'Esettanulmányok',
      billing: 'Előfizetés',
      offers: 'Ajánlatok',
    },
    account: {
      settings: 'Beállítások',
      logout: 'Kijelentkezés',
      loggingOut: 'Kilépés…',
      login: 'Bejelentkezés',
      freeTrial: 'Ingyenes Próba',
      logoutAria: 'Kijelentkezés a fiókból',
    },
    menu: {
      openLabel: 'Navigáció megnyitása',
    },
  },
  appFrame: {
    loading: 'Betöltés…',
    sidebar: {
      open: 'Oldalsáv megnyitása',
      close: 'Oldalsáv elrejtése',
    },
  },
  footer: {
    legalLinks: {
      privacy: 'Adatvédelmi tájékoztató',
      cookies: 'Sütikezelési tájékoztató',
    },
    manageCookies: 'Sütibeállítások kezelése',
    contact: {
      heading: 'Kapcsolat',
      description:
        'AI által támogatott, professzionális ajánlatok kis- és középvállalkozások számára.',
    },
    copyrightPrefix: '©',
    brand: 'Propono',
  },
  toast: {
    dismiss: 'Bezárás',
    providerError: 'useToast csak ToastProvider kontextusában használható.',
  },
  stepIndicator: {
    statuses: {
      completed: 'Kész',
      current: 'Folyamatban',
      upcoming: 'Hátralévő',
      missing: 'Hiányos',
    },
  },
  editablePriceTable: {
    columns: {
      item: 'Tétel',
      quantity: 'Menny.',
      unit: 'Egység',
      unitPrice: 'Egységár (Ft)',
      vat: 'ÁFA %',
      netTotal: 'Nettó össz.',
    },
    placeholders: {
      name: 'Megnevezés',
      unit: 'db / óra / m²',
    },
    actions: {
      addRow: '+ Új tétel',
      removeRow: 'Törlés',
    },
    totals: {
      net: 'Nettó:',
      vat: 'ÁFA:',
      gross: 'Bruttó:',
      currency: 'Ft',
    },
  },
  richTextEditor: {
    toolbar: {
      bold: { label: 'B', title: 'Félkövér (Ctrl/Cmd + B)' },
      italic: { label: 'I', title: 'Dőlt (Ctrl/Cmd + I)' },
      underline: { label: 'U', title: 'Aláhúzás (Ctrl/Cmd + U)' },
      strikeThrough: { label: 'S', title: 'Áthúzás' },
      unorderedList: { label: 'Lista', icon: '•', title: 'Felsorolás' },
      orderedList: { label: 'Számozás', icon: '1.', title: 'Számozott lista' },
      blockquote: { label: 'Idézet', icon: '❝', title: 'Idézet blokk' },
      removeFormat: { label: 'Törlés', icon: '⨉', title: 'Formázás törlése' },
      undo: { label: 'Vissza', icon: '↺', title: 'Visszavonás (Ctrl/Cmd + Z)' },
      redo: { label: 'Előre', icon: '↻', title: 'Ismét (Ctrl/Cmd + Shift + Z)' },
    },
    errors: {
      commandFailed: 'Nem sikerült végrehajtani a parancsot',
      insertImageFailed: 'Nem sikerült beszúrni a képet',
      imageReadFailed: 'Nem sikerült beolvasni a képet',
    },
    placeholderHint: 'Formázd át a generált szöveget...',
    placeholderReminder: 'Tartsd meg a címsorokat és listákat a jobb olvashatóságért.',
    imageSection: {
      heading: 'Képek a PDF-hez',
      description:
        'Legfeljebb 3 kép tölthető fel, 2 MB fájlméretig. A képeket csak a PDF generálásához használjuk fel.',
      insert: 'Kép beszúrása',
      notAvailable: 'Előbb generáld le az AI előnézetet, utána adhatod hozzá a képeket.',
      empty: 'Még nem adtál hozzá képeket. A beszúrt képek csak a kész PDF-ben jelennek meg.',
      proUpsell:
        'Pro előfizetéssel képeket is hozzáadhatsz a PDF-hez. A feltöltött képek kizárólag a generált dokumentumban kerülnek felhasználásra.',
      remove: 'Eltávolítás',
    },
  },
  layout: {
    loading: 'Betöltés…',
  },
  cookies: {
    bar: {
      message:
        'We use cookies to improve your experience. You can accept all cookies, reject the non-essential ones, or customise your preferences.',
      customise: 'Customise',
      reject: 'Reject non-essential',
      accept: 'Accept all',
    },
    manageButton: 'Sütibeállítások kezelése',
    preferences: {
      title: 'Sütibeállítások',
      description:
        'Kezelje, hogy milyen típusú sütiket engedélyez az oldalon. A szükséges sütik nélkül az oldal nem működne megfelelően.',
      categories: {
        necessary: { label: 'Szükséges sütik', description: 'Mindig engedélyezve vannak.' },
        analytics: {
          label: 'Analitikai sütik',
          description: 'Segítenek megérteni, hogyan használják a látogatók az oldalt.',
        },
        marketing: {
          label: 'Marketing sütik',
          description: 'Lehetővé teszik személyre szabott tartalmak és ajánlatok megjelenítését.',
        },
      },
      summary: {
        anyOptional: 'Jelenleg engedélyezte a választható sütik egy részét.',
        onlyNecessary: 'Jelenleg csak a szükséges sütik vannak engedélyezve.',
      },
      actions: {
        cancel: 'Mégse',
        save: 'Mentés',
      },
    },
  },
  landing: {
    announcement: 'Ajánlatkészítés újragondolva',
    hero: {
      titleLine1: 'Készíts lenyűgöző',
      highlighted: 'ajánlatokat',
      titleLine2: 'Villámgyorsan.',
      description:
        'A Propono AI-alapú ajánlatkészítő automatizálja az árajánlatok létrehozását teljesen személyre szabva, hogy te a növekedésre koncentrálhass.',
      primaryCta: 'Próbáld ki ingyen!',
      secondaryCta: 'Nézd meg a bemutatót',
      spotlightHeading: 'Mit kapsz azonnal?',
      spotlightDescription:
        'A Propono a csapatod workflow-jába simul, így az ügyfél már az első prezentációtól kezdve prémium élményt kap.',
      spotlightItems: [
        'Szabadszavas promptok iparági sablonokkal',
        'Rugalmas rács, ahol minden komponens mozgatható',
        'Automatikus költség-blokkok és összegek',
      ],
    },
    benefits: [
      {
        title: 'Egyetlen esztétikus felület',
        description:
          'A Propono sötét és világos témában is igazodik a márkád színeihez, így minden ajánlat magabiztos, prémium hatást kelt.',
      },
      {
        title: 'AI, ami érti a briefet',
        description:
          'A magyar nyelvű AI lépésről lépésre állítja össze a szöveget, árkalkulációt és moduláris blokkokat.',
      },
      {
        title: 'Ügyfélközpontú megosztás',
        description:
          'Élő link, interaktív visszajelzések, aláírás – minden egy irányítópulton, automatikus státuszokkal.',
      },
    ],
    howItWorks: {
      label: 'Folyamat vizuálisan',
      title: 'Három lépés, ahol a csapatod együtt dolgozik',
      description:
        'A Propono felülete szabad vászonként működik. A blokkokat mozgathatod, kommentelhetsz, és a háttérben az AI mindig egységes arculatot tart.',
      steps: [
        {
          title: 'Brief & mood',
          description:
            'Importáld a projekt részleteit vagy illessz be egy e-mailt – az AI azonnal kiemeli a lényeges pontokat.',
        },
        {
          title: 'Moduláris blokkok',
          description:
            'Válaszd ki a sablonjaidat, kérj új AI-szöveget vagy szerkeszd vizuálisan a szekciókat, mint egy dizájn eszközben.',
        },
        {
          title: 'Megosztás & mérés',
          description:
            'Egy kattintással készül a márkázott PDF, közben valós időben látod, mit olvasott el az ügyfél.',
        },
      ],
    },
    quote: {
      heading: 'Márkázott PDF, ami úgy néz ki, mintha egy design stúdió készítette volna',
      description:
        'Feltöltött logó, betűtípus és színkód – mind bekerül az ajánlat minden oldalára. Az AI segít az összegzésekben, de a vizuális layout a te irányításod alatt marad.',
      features: [
        {
          title: 'Dinamikus komponensek',
          description: 'Drag & drop blokkok, reszponzív rács a Penpot logikájával.',
        },
        {
          title: 'Átlátható státuszok',
          description: 'Megnyitási, elfogadási és komment történet – mind visszamérhető.',
        },
      ],
      testimonial: {
        quote:
          '„A Propono olyan, mintha az ajánlatkészítéshez kapnánk egy Penpotot. Végre ugyanabban a térben dolgozik designer, sales és vezető.”',
        author: 'Kiss Júlia',
        role: 'Ügynökségvezető • Studio Fluo',
      },
    },
    cta: {
      label: 'Ajánlatkészítés újrafogalmazva',
      title: 'Csatlakozz a vizuális workflow-hoz, és spórolj órákat minden ajánlaton',
      description:
        'Ingyenes kipróbálás, azonnali meghívás a csapattagoknak. A Propono AI az eddigi ajánlataidból tanul, hogy minden új dokumentum pontos, esztétikus és márkahű legyen.',
      primaryCta: 'Indítsd el ingyen',
      secondaryCta: 'Csomagok',
    },
    footerAria: 'Oldal lábléc',
  },
  demo: {
    badge: 'Demó',
    title: 'Interaktív demó hamarosan',
    description:
      'Dolgozunk egy részletes bemutatón, ahol lépésről lépésre kipróbálhatod a Propono ajánlatkészítő folyamatát. Addig is regisztrálj és kezdd el ingyen az Ingyenes csomaggal, vagy lépj tovább a Propono Standard 10 ajánlatos keretével.',
    loginCta: 'Bejelentkezés',
    backHome: 'Vissza a főoldalra',
  },
  login: {
    title: 'Bejelentkezés',
    description:
      'Írd be az e-mail címed, és küldünk egy biztonságos belépési linket, mely 5 percig érvényes. Csak kattints rá, és automatikusan bejelentkezhetsz – jelszó nélkül.',
    emailLabel: 'E-mail cím',
    emailPlaceholder: 'email@cimed.hu',
    magicLinkButton: 'Magic link küldése',
    magicLinkSent: 'Link elküldve',
    magicLinkSending: 'Küldés…',
    magicLinkAria: 'Magic link küldése a megadott e-mail címre',
    divider: 'vagy',
    googleButton: 'Google Bejelentkezés',
    googleJoining: 'Csatlakozás…',
    googleUnavailable:
      'Nem sikerült ellenőrizni a Google bejelentkezés állapotát. Kérjük, próbáld újra később.',
    googleDisabledFallback:
      'A Google bejelentkezés jelenleg nem érhető el. Kérjük, próbáld újra később.',
    googleStatusTitle: 'Állapot',
    messages: {
      magicLinkInfo:
        'Ha létezik fiók ehhez az e-mail címhez, perceken belül elküldjük a belépési linket.',
    },
  },
  auth: {
    callback: {
      inProgress: 'Bejelentkezés folyamatban…',
      missingToken: 'Missing magic token',
      unableToAuthenticate: 'Unable to authenticate',
    },
  },
  offers: {
    wizard: {
      pageTitle: 'Új ajánlat',
      pageDescription:
        'Kövesd a lépéseket az ajánlat létrehozásához, majd töltsd le vagy küldd el az ügyfelednek.',
      defaults: {
        activityName: 'Konzultáció',
        activityUnit: 'óra',
        fallbackCompany: 'Vállalkozásod neve',
        fallbackTitle: 'Árajánlat',
        emptyPreviewHtml: '<p>(nincs előnézet)</p>',
        imageAlt: 'Kép',
      },
      steps: {
        details: 'Projekt részletek',
        pricing: 'Tételek',
        summary: 'Összegzés',
      },
      actions: {
        back: 'Vissza',
        next: 'Tovább',
        save: 'PDF generálása és mentés',
        generatePreview: 'AI előnézet generálása',
        previewReady: 'Előnézet kész',
        previewInProgress: 'Generálás…',
        previewButtonIdle: 'AI előnézet generálása',
        previewDisabledTooltip: 'Add meg a címet és a leírást az előnézethez.',
        generatePreviewAgain: 'Újra generálás',
        abortPreview: 'Megszakítás',
        goToSummaryReminder:
          'A továbblépéshez előbb generáld le az AI előnézetet az első lépésben.',
      },
      preview: {
        idle: 'Írd be fent a projekt részleteit, és megjelenik az előnézet.',
        loading: 'Kapcsolódás az AI szolgáltatáshoz…',
        streaming: 'Az AI most készíti az előnézetet…',
        countdown: 'Kb. {seconds} mp van hátra…',
        success: 'Előnézet frissítve.',
        error: 'Nem sikerült frissíteni az előnézetet.',
        locked: 'Előnézet kész',
        singleUseNotice:
          'Az AI előnézet egyszer kérhető le. A végső módosításokat a PDF szerkesztő lépésében végezheted el.',
        unavailable:
          'Az AI előnézet az Összegzés lépésben lesz elérhető, miután kitöltötted a szükséges adatokat.',
        loadingHint: 'Ez néhány másodpercet is igénybe vehet.',
      },
      toast: {
        previewRequiredTitle: 'Előnézet szükséges',
        previewRequiredDescription: 'Generáld le az AI előnézetet a továbblépéshez.',
        backgroundPreviewTitle: 'Előnézet generálása háttérben',
        backgroundPreviewDescription:
          'A mentéshez az AI automatikusan elkészíti a hiányzó szöveges előnézetet.',
        imageLimitTitle: 'Korlát elérve',
        imageLimitDescription: 'Legfeljebb 3 képet adhatsz hozzá a PDF-hez.',
        invalidFileTitle: 'Érvénytelen fájl',
        invalidFileDescription: '{name} nem képfájl, ezért kihagytuk.',
        imageTooLargeTitle: 'Túl nagy kép',
        imageTooLargeDescription: '{name} mérete legfeljebb {limit} MB lehet.',
        imageReadErrorTitle: 'Kép feldolgozási hiba',
        imageReadErrorDescription: '{name} beolvasása nem sikerült.',
      },
      forms: {
        details: {
          titleLabel: 'Ajánlat címe',
          titlePlaceholder: 'Pl. Weboldal fejlesztés',
          descriptionLabel: 'Projekt leírása',
          descriptionPlaceholder: 'Fogalmazd meg röviden az ügyfél problémáját és a megoldást.',
          deadlineLabel: 'Határidő (opcionális)',
          clientLookupLabel: 'Cég neve',
          clientLookupPlaceholder: 'Kezdj el gépelni…',
          clientLookupEmpty: 'Nincs találat. Új cég mentése a mentésnél történik.',
          clientLookupCreate: 'Új cég mentése',
          clientAutocompleteTitle: 'Mentett cégek',
          clientFieldAddress: 'Cím',
          clientFieldTax: 'Adószám',
          clientFieldRepresentative: 'Képviselő neve',
          clientFieldPhone: 'Telefon',
          clientFieldEmail: 'E-mail',
          quickInsertTitle: 'Gyors tétel beszúrása',
          quickInsertIndustryLabel: 'Iparág',
          previewBadge: 'PDF nézet',
          previewGenerate: 'AI előnézet generálása',
          previewCountdownLabel: 'Kb. {seconds} mp van hátra…',
          previewLoadingSecondary: 'Ez néhány másodpercet is igénybe vehet.',
        },
        pricing: {
          title: 'Árlista',
          helper:
            'Adj meg legalább egy tételt – ez alapján számoljuk a nettó és bruttó összegeket.',
        },
        summary: {
          title: 'Összegzés',
          helper: 'A PDF generálása után az ajánlat megjelenik a listádban.',
          fields: {
            title: 'Cím',
            industry: 'Iparág',
            recipient: 'Címzett',
            style: 'Stílus',
            styleCompact: 'Kompakt',
            styleDetailed: 'Részletes',
            grossTotal: 'Bruttó összesen',
          },
        },
      },
      statuses: {
        previewRequired: 'Generáld le az AI előnézetet a továbblépéshez.',
        notLoggedIn: 'Nem vagy bejelentkezve.',
        previewMissing: 'Írd be fent a projekt részleteit, és megjelenik az előnézet.',
        aiNoData: 'Az AI nem küldött adatot az előnézethez.',
        aiUnknownError: 'Ismeretlen hiba történt az AI előnézet frissítése közben.',
        aiTimeout: 'Az AI előnézet lekérése lejárt. Próbáld újra.',
        aiStreamingError: 'Ismeretlen hiba történt az AI előnézet frissítése közben.',
        aiPreviewError: 'Hiba az előnézet betöltésekor ({status}).',
        authError: 'Nem sikerült hitelesíteni az előnézet lekérését.',
        generateError: 'Ismeretlen hiba történt az ajánlat generálása közben.',
        generateStatusError: 'Hiba a generálásnál ({status}).',
        structuredResponseMissing: 'A struktúrált AI válasz hiányos, próbáld újra a generálást.',
      },
      summarySidebar: {
        priceTotals: {
          net: 'Nettó összesen',
          vat: 'ÁFA',
          gross: 'Bruttó végösszeg',
        },
        projectSummary: 'Projekt összegzés',
        compensationSummary: 'Díjazás összesítése',
        titleLabel: 'Cím',
        descriptionLabel: 'Leírás',
        emptyValue: '—',
      },
    },
    previewCard: {
      heading: 'AI előnézet',
      helper: 'Az előnézet automatikusan frissül, amikor a fenti mezőket módosítod.',
      actions: {
        abort: 'Megszakítás',
        refresh: 'Újra generálás',
      },
      empty:
        'Az AI előnézet az Összegzés lépésben lesz elérhető, miután kitöltötted a szükséges adatokat.',
      statuses: {
        idle: {
          title: 'Előnézetre várunk',
          description: 'Írd be fent a projekt részleteit, és megjelenik az előnézet.',
        },
        loading: {
          title: 'Kapcsolódás az AI szolgáltatáshoz…',
        },
        streaming: {
          title: 'Az AI most készíti az előnézetet…',
        },
        success: {
          title: 'Előnézet frissítve.',
        },
        error: {
          title: 'Nem sikerült frissíteni az előnézetet.',
        },
      },
    },
    projectDetailsSection: {
      title: 'Ajánlat címe',
      placeholder: 'Pl. Weboldal fejlesztés',
      descriptionLabel: 'Projekt leírása',
      descriptionPlaceholder: 'Fogalmazd meg röviden az ügyfél problémáját és a megoldást.',
    },
    pricingSection: {
      heading: 'Árlista',
      helper: 'Adj meg legalább egy tételt – ez alapján számoljuk a nettó és bruttó összegeket.',
    },
    summarySection: {
      projectHeading: 'Projekt összegzés',
      compensationHeading: 'Díjazás összesítése',
      fields: {
        title: 'Cím',
        description: 'Leírás',
        netTotal: 'Nettó összesen',
        vat: 'ÁFA',
        gross: 'Bruttó végösszeg',
      },
      empty: '—',
    },
  },
  dashboard: {
    title: 'Ajánlatok',
    description: 'Keresés, szűrés és státuszkezelés egy helyen — átlátható kártyákkal.',
    create: '+ Új ajánlat',
    statusLabels: {
      draft: 'Vázlat',
      sent: 'Kiküldve',
      accepted: 'Elfogadva',
      lost: 'Elutasítva',
    },
    decisions: {
      accepted: 'Elfogadva',
      lost: 'Elutasítva',
      markAccepted: 'Megjelölés: Elfogadva',
      markLost: 'Megjelölés: Elutasítva',
      revertToDraft: 'Vissza vázlatba',
      revertDecision: 'Döntés törlése',
    },
    metrics: {
      offersCreated: {
        label: 'Létrehozott ajánlatok',
      },
      offersSent: {
        label: 'Kiküldött ajánlatok',
        helper: '{count} ajánlat döntésre vár',
      },
      offersAccepted: {
        label: 'Elfogadott ajánlatok',
        helper: 'Elfogadási arány: {ratio}',
      },
      averageDecision: {
        label: 'Átlagos döntési idő',
        helper: '{drafts} vázlat készül',
      },
      monthlyCreated: 'Ebben a hónapban {count} új ajánlat',
      displayedSummary: 'Megjelenítve {displayed} / {total} ajánlat',
      displayedWithMonthly:
        'Megjelenítve {displayed} / {total} ajánlat • Ebben a hónapban {count} új ajánlat',
    },
    filters: {
      search: {
        label: 'Keresés',
        placeholder: 'Ajánlat cím vagy cég…',
      },
      status: {
        label: 'Állapot',
        options: {
          all: 'Mind',
          draft: 'Vázlat',
          sent: 'Kiküldve',
          accepted: 'Elfogadva',
          lost: 'Elutasítva',
        },
      },
      industry: {
        label: 'Iparág',
        all: 'Mind',
      },
      sortBy: {
        label: 'Rendezés',
        options: {
          created: 'Dátum',
          status: 'Állapot',
          title: 'Ajánlat neve',
          recipient: 'Címzett',
          industry: 'Iparág',
        },
      },
      sortDirection: {
        label: 'Irány',
        options: {
          desc: 'Csökkenő',
          asc: 'Növekvő',
        },
      },
    },
    list: {
      created: 'Létrehozva',
      industry: 'Iparág',
      export: 'Export',
      openPdf: 'PDF megnyitása',
      sentStep: {
        title: 'Kiküldve az ügyfélnek',
        description: 'Add meg, mikor küldted el az ajánlatot.',
        changeDate: 'Dátum módosítása',
        setToday: 'Megjelölés: elküldve',
      },
      decisionStep: {
        title: 'Ügyfél döntése',
        description: 'Jegyezd fel, hogy elfogadták vagy elutasították az ajánlatot.',
        decisionDate: 'Döntés dátuma',
      },
      emptyRecipient: '—',
      unknownIndustry: 'Ismeretlen',
    },
    pagination: {
      summary: 'Megjelenítve {displayed} / {total} ajánlat',
      loadMore: 'További ajánlatok betöltése',
      allLoaded: 'Az összes ajánlat megjelenítve.',
    },
    emptyState: {
      noOffers: 'Még nem hoztál létre ajánlatokat.',
      noResults: 'Nincs találat. Próbálj másik keresést vagy szűrőt.',
    },
    dialogs: {
      delete: {
        warning: 'Figyelmeztetés',
        title: 'Ajánlat törlése',
        description:
          'Biztosan törlöd a(z) „{title}” ajánlatot? Ez a művelet nem visszavonható, és minden kapcsolódó adat véglegesen el fog veszni.',
        cancel: 'Mégse',
        confirm: 'Ajánlat törlése',
        confirming: 'Törlés…',
        successTitle: 'Ajánlat törölve',
        successDescription: 'Az ajánlat véglegesen eltávolításra került.',
        errorTitle: 'Törlés sikertelen',
        errorDescription: 'Nem sikerült törölni az ajánlatot. Próbáld újra.',
      },
    },
    toasts: {
      loadFailedTitle: 'Ajánlatok betöltése sikertelen',
      loadMoreFailedTitle: 'További ajánlatok betöltése sikertelen',
      statusUpdateFailedTitle: 'Állapot frissítése sikertelen',
      genericError: 'Ismeretlen hiba történt az ajánlatok betöltésekor.',
      statusUpdateError: 'Nem sikerült frissíteni az ajánlat állapotát. Próbáld újra.',
    },
    loadMoreButton: {
      navLabel: 'Lapozás',
      loading: '…',
    },
  },
  billing: {
    marketing: {
      features: [
        {
          title: 'Egyetlen esztétikus felület',
          description:
            'A Propono témái igazodnak a márkád színeihez, így minden ajánlat magabiztos, prémium hatást kelt.',
        },
        {
          title: 'AI, ami érti a briefet',
          description:
            'A magyar nyelvű AI lépésről lépésre állítja össze a szöveget, az árkalkulációt és a moduláris blokkokat.',
        },
        {
          title: 'Ügyfélközpontú megosztás',
          description:
            'Élő link, interaktív visszajelzések és aláírás – minden egy irányítópulton, automatikus státuszokkal.',
        },
      ],
      steps: [
        {
          title: 'Brief & mood',
          description:
            'Importáld a projekt részleteit vagy illessz be egy e-mailt – az AI azonnal kiemeli a lényeges pontokat.',
        },
        {
          title: 'Moduláris blokkok',
          description:
            'Válaszd ki a sablonjaidat, kérj új AI-szöveget vagy szerkeszd vizuálisan a szekciókat, mint egy dizájn eszközben.',
        },
        {
          title: 'Megosztás & mérés',
          description:
            'Egy kattintással készül a márkázott PDF, közben valós időben látod, mit olvasott el az ügyfél.',
        },
      ],
      spotlight: [
        'Szabadszavas promptok iparági sablonokkal',
        'Drag & drop blokkok, reszponzív layout',
        'Automatikus PDF export és státuszjelentés',
      ],
    },
    planStatus: {
      currentPlan: 'Aktuális csomag: {plan}',
      freePlan: 'Ingyenes',
      standardPlan: 'Standard',
      proPlan: 'Pro',
      usageSummary: '{count} generált ajánlat ebben a ciklusban',
      usageReset: 'Időszak kezdete: {date}',
    },
    checkout: {
      title: 'Számlázás',
      signInTitle: 'Lépj be a gyors vásárláshoz',
      signInDescription: 'A számlázási adatok automatikusan kitöltődnek a profilod alapján.',
      signInCta: 'Bejelentkezés',
      emailLabel: 'E-mail',
      emailPlaceholder: 'email@cimed.hu',
      startTrial: 'Ingyenes próba indítása',
      upgrade: 'Frissítés',
      manageSubscription: 'Előfizetés kezelése',
      contactSupport: 'Kapcsolatfelvétel',
    },
    cards: {
      acceptedPayments: 'Elfogadott kártyák',
    },
    messages: {
      checkoutError: 'Nem sikerült létrehozni a fizetési munkamenetet. Próbáld újra.',
      statusSuccess: 'Sikeres fizetés',
      statusCancelled: 'A fizetést megszakítottad.',
    },
  },
  settings: {
    title: 'Beállítások',
    description: 'Céges adatok, sablonok és csapatszintű beállítások.',
    general: {
      heading: 'Cégadatok',
      companyName: 'Cégnév',
      companyAddress: 'Székhely címe',
      companyTaxId: 'Adószám',
      companyPhone: 'Telefon',
      companyEmail: 'Kapcsolattartó e-mail',
      industries: 'Iparágak',
      addIndustry: 'Új iparág hozzáadása',
      save: 'Mentés',
      saving: 'Mentés…',
      saved: 'Beállítások mentve',
      errors: {
        phone: 'Magyar formátumú telefonszámot adj meg (pl. +36301234567).',
        tax: 'Adószám formátum: 12345678-1-12',
        address: 'A cím legyen legalább 8 karakter.',
      },
      toast: {
        loadFailedTitle: 'Profil betöltése sikertelen',
        loadFailedDescription: 'Nem sikerült betölteni a profiladatokat. Próbáld újra.',
        saveSuccessTitle: 'Beállítások frissítve',
        saveSuccessDescription: 'A módosításokat elmentettük.',
        saveErrorTitle: 'Mentés sikertelen',
        saveErrorDescription: 'Ismeretlen hiba történt a mentés közben.',
      },
    },
    branding: {
      heading: 'Arculat',
      logoLabel: 'Logó',
      uploadLogo: 'Logó feltöltése',
      removeLogo: 'Eltávolítás',
      primaryColor: 'Elsődleges szín',
      secondaryColor: 'Másodlagos szín',
      previewHeading: 'Előnézet',
      errors: {
        primary: 'Adj meg egy #RRGGBB formátumú hex színt.',
        secondary: 'Adj meg egy #RRGGBB formátumú hex színt.',
      },
      uploading: 'Feltöltés…',
      uploadError: 'Nem sikerült feltölteni a logót. Próbáld újra.',
    },
    templates: {
      heading: 'PDF sablon',
      description: 'Válaszd ki, hogy milyen stílusban készüljön a generált ajánlat.',
      modern: 'Modern',
      premium: 'Prémium',
      proBadge: 'Pro',
      proOnly: 'Pro csomag szükséges',
      selected: 'Kiválasztva',
    },
    activities: {
      heading: 'Tevékenység gyors beszúráshoz',
      helper: 'Mentett tételek, amelyeket a varázslóban egy kattintással hozzáadhatsz.',
      add: 'Új tétel mentése',
      name: 'Megnevezés',
      unit: 'Egység',
      unitPlaceholder: 'db / óra / nap',
      unitPrice: 'Egységár (Ft)',
      vat: 'ÁFA %',
      industries: 'Iparágak',
      save: 'Mentés',
      saving: 'Mentés…',
      empty: 'Még nincs mentett tétel.',
      delete: 'Törlés',
      deleting: 'Törlés…',
      deleteConfirm: 'Biztosan törlöd ezt a tételt?',
      toast: {
        loadFailedTitle: 'Tevékenységek betöltése sikertelen',
        saveSuccessTitle: 'Tétel mentve',
        saveErrorTitle: 'Mentés sikertelen',
        deleteSuccessTitle: 'Tétel törölve',
        deleteErrorTitle: 'Törlés sikertelen',
      },
    },
    account: {
      heading: 'Fiók',
      email: 'E-mail',
      logout: 'Kijelentkezés',
      logoutHint: 'Biztonságosan kijelentkezhetsz az összes eszközről.',
      logoutCta: 'Kijelentkezés minden eszközről',
      connectGoogle: 'Google fiók összekapcsolása',
      disconnectGoogle: 'Összekapcsolás megszüntetése',
      linking: 'Összekapcsolás…',
      unlinking: 'Leválasztás…',
      toast: {
        googleLinkedTitle: 'Google fiók összekapcsolva',
        googleLinkedDescription: 'Mostantól a Google fiókoddal is bejelentkezhetsz.',
        googleLinkFailedTitle: 'Nem sikerült összekapcsolni a Google fiókot',
        googleLinkFailedDescription: 'Kérjük, próbáld újra egy kicsit később.',
      },
    },
  },
  legal: {
    privacyPolicy: {
      title: 'Adatvédelmi tájékoztató',
      description: 'Olvassa el, hogyan kezeljük az Ön adatait és biztosítjuk azok védelmét.',
      consentVersionNotice: 'Aktuális hozzájárulási verzió: {version}',
    },
    cookiePolicy: {
      title: 'Sütikezelési tájékoztató',
      description:
        'Áttekintés arról, hogy milyen sütiket használunk és hogyan állíthatja be a hozzájárulását.',
    },
  },
  demoBanner: {
    title: 'Ajánlatkészítés újragondolva',
  },
  errors: {
    unauthorized: 'Nincs jogosultságod ehhez a művelethez.',
    network: 'Hálózati hiba történt. Kérlek, próbáld újra.',
    unknown: 'Ismeretlen hiba történt.',
  },
} as const;
