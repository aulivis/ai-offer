# Ajánlat Generálási Prompt Áttekintése - 2025 Best Practices

## Összefoglaló

Ez a dokumentum áttekinti a jelenlegi AI promptot, amelyet az ajánlat generáláshoz használunk, és javaslatokat tesz a 2025-ös iparági legjobb gyakorlatok alapján a konverziós arány javításához.

## Jelenlegi Prompt Elemzése

### Erősségek ✅

1. **Értékpropozíció fókusz**: A prompt hangsúlyozza a hasznok és előnyök fontosságát
2. **Magyar nyelvi minőség**: Természetes magyar üzleti nyelv használata
3. **Strukturált tartalom**: Világos szekciók és logikus felépítés
4. **CTA irányítás**: Cselekvésre ösztönző kifejezések használata
5. **Személyre szabás**: Ügyfél neve/cégneve használata
6. **Bizalom építés**: Testimonials és guarantees kezelése

### Fejlesztési Lehetőségek 🎯

A 2025-ös konverziós optimalizálási best practices alapján a következő területeken lehet javítani:

## Ajánlott Fejlesztések

### 1. Társadalmi Bizonyítékok (Social Proof) Erősítése

**Jelenlegi állapot**: A testimonials kezelve van, de nem elég hangsúlyos.

**Javaslat**:

- A testimonials használatát erősebben kell hangsúlyozni a SYSTEM_PROMPT-ban
- Konkrét példákat kell adni arról, hogyan integráljuk őket természetesen
- A testimonials ne csak külön szakaszban jelenjenek meg, hanem releváns helyeken is (pl. value proposition, closing)

**Implementáció**:

```typescript
// SYSTEM_PROMPT-ban:
TÁRSADALMI BIZONYÍTÉKOK (SOCIAL PROOF):
- Ha testimonials elérhető, használd őket stratégiai helyeken:
  * A value_proposition szakaszban egy rövid, meggyőző visszajelzés
  * A project_summary végén egy releváns ügyfélvélemény
  * A closing szakaszban a bizalom megerősítésére
- A testimonials legyenek konkrétak, mérhető eredményekkel (pl. "30% növekedés", "2 hét alatt")
- Ha több testimonials van, válaszd ki a legrelevánsabbat a projekt kontextusához
- Formázd őket úgy, hogy természetesek legyenek, ne úgy nézzenek ki, mint marketing szövegek
```

### 2. Sürgősség és Hiány Érzetének Optimalizálása

**Jelenlegi állapot**: A határidő kezelve van, de nem elég hatékonyan.

**Javaslat**:

- A sürgősség kifejezését finomabban, de hatékonyabban kell kezelni
- Ne csak a határidőt említsük, hanem a késedelem következményeit is
- Használj pozitív sürgősséget (pl. "korai kezdés előnyei" helyett "késlekedés hátrányai")

**Implementáció**:

```typescript
// SYSTEM_PROMPT-ban:
SÜRGŐSSÉG ÉS HATÁRIDŐ KEZELÉSE:
- Ha határidő van megadva, építsd be természetesen, de hatékonyan:
  * A schedule szakaszban: konkrét dátumokkal és időkeretekkel
  * A next_steps szakaszban: egyértelmű visszajelzési határidővel
  * A closing szakaszban: finom említés a gyors döntés előnyeiről
- Használj pozitív framing-ot: "A korai kezdés lehetővé teszi..." helyett "A késlekedés csökkenti..."
- Ne legyél agresszív vagy tolakodó, de legyél egyértelmű a következő lépésekről
- Ha nincs határidő, ne kényszeríts be mesterséges sürgősséget
```

### 3. Értékpropozíció Erősítése

**Jelenlegi állapot**: Jó alapok, de lehet még specifikusabb.

**Javaslat**:

- Konkrétabb irányítás a value_proposition mezőhöz
- Példák mérhető eredményekre
- A vevő problémájának jobb megértése

**Implementáció**:

```typescript
// SYSTEM_PROMPT-ban:
ÉRTÉKPROPOZÍCIÓ ÉS HASZNOK (BŐVÍTVE):
- Mindig a hasznokra és előnyökre fókuszálj, ne a funkciókra vagy jellemzőkre!
- Mutasd be, hogyan oldja meg az ajánlat a vevő problémáját vagy igényét.
- Használj konkrét, mérhető eredményeket és előnyöket, ahol lehetséges:
  * Számokkal: "30% növekedés", "50% időmegtakarítás"
  * Időkeretekkel: "2 hét alatt", "1 hónapon belül"
  * Minőségi javulásokkal: "professzionális megjelenés", "növelt megbízhatóság"
- A value_proposition mezőben (ha van) hangsúlyozd ki:
  * Mi az egyedi érték, amit ez az ajánlat nyújt?
  * Miért ez a megoldás jobb, mint más alternatívák?
  * Milyen konkrét előnyöket élvez a vevő?
- Használj "before/after" vagy "probléma-megoldás-eredmény" keretrendszert
```

### 4. Garantia és Bizalom Jelek Erősítése

**Jelenlegi állapot**: A guarantees kezelve van, de nem elég hangsúlyos.

**Javaslat**:

- A guarantees használatát erősebben kell hangsúlyozni
- Konkrét példákat kell adni a garantia formázására
- A garantia ne csak a zárásban jelenjen meg

**Implementáció**:

```typescript
// SYSTEM_PROMPT-ban:
BIZALOM ÉS HITELESSÉG (BŐVÍTVE):
- Ha testimonials mező van megadva, használd őket stratégiai helyeken:
  * A value_proposition szakaszban egy rövid, meggyőző visszajelzés
  * A project_summary végén egy releváns ügyfélvélemény
  * A closing szakaszban a bizalom megerősítésére
- Ha guarantees mező van megadva, említsd meg őket:
  * A deliverables szakaszban, ha releváns (pl. "100% elégedettségi garancia")
  * A closing szakaszban erősen, mint bizalomépítő elem
  * Konkrétan és mérhetően: "30 napos pénzvisszafizetési garancia" helyett "garancia"
- Az expected_outcomes mezőben használj mérhető, konkrét eredményeket (pl. "30% növekedés", "2 hét alatt")
- Használj bizalomépítő kifejezéseket: "biztosítjuk", "garantáljuk", "tapasztalatunk alapján"
```

### 5. CTA (Call-to-Action) Optimalizálása

**Jelenlegi állapot**: Jó alapok, de lehet még specifikusabb.

**Javaslat**:

- Konkrétabb példákat adni a CTA-kra
- A next_steps szakaszban erősebb akcióorientált nyelv
- Többféle CTA típus használata

**Implementáció**:

```typescript
// SYSTEM_PROMPT-ban:
CSELEKVÉSRE ÖSZTÖNZÉS (CTA) - BŐVÍTVE:
- A next_steps szakaszban használj konkrét, akcióorientált kifejezéseket:
  * Határidővel: "Kérjük, jelezze vissza a véleményét 2025. február 10-ig"
  * Időkerettel: "Várjuk a visszajelzését a következő 3 munkanapon belül"
  * Konkrét akcióval: "Kérjük, erősítse meg az elfogadást e-mailben"
  * Könnyű lépéssel: "Válaszoljon erre az e-mailre az elfogadáshoz"
- A zárásban szerepeljen egyértelmű következő lépés javaslat:
  * "Várjuk a visszajelzését" helyett "Kérjük, jelezze vissza véleményét [konkrét dátumig]"
  * "Kapcsolatfelvétel" helyett "Hívjon minket [telefonszám] vagy írjon [e-mail]"
- Használj olyan kifejezéseket, amelyek konkrét cselekedetre ösztönöznek:
  * Cselekvő igék: "jelezze", "erősítse", "válaszoljon", "hívjon"
  * Ne passzív vagy bizonytalan kifejezéseket: "lehet", "esetleg", "talán"
- Ha határidő van, említsd meg a next_steps-ben is
```

### 6. Mérhető Eredmények Hangsúlyozása

**Jelenlegi állapot**: Már említve van, de lehet még erősebb.

**Javaslat**:

- Minden szakaszban mérhető eredményeket kell hangsúlyozni
- Konkrét példákat kell adni
- A vevő számára érthető metrikákat kell használni

**Implementáció**:

```typescript
// SYSTEM_PROMPT-ban:
MÉRHETŐ EREDMÉNYEK ÉS METRIKÁK:
- Minden szakaszban, ahol lehetséges, használj konkrét, mérhető eredményeket:
  * Számokkal: "30% növekedés", "50% időmegtakarítás", "100+ ügyfél"
  * Időkeretekkel: "2 hét alatt", "1 hónapon belül", "3 napos válaszidő"
  * Minőségi javulásokkal: "professzionális megjelenés", "növelt megbízhatóság"
- Az expected_outcomes mezőben KÖTELEZŐEN használj mérhető eredményeket
- A value_proposition-ben említsd meg a konkrét előnyöket számokkal
- A project_summary-ben vázold fel a várható eredményeket mérhető formában
- Használj olyan metrikákat, amelyek a vevő számára érthetőek és relevánsak
```

### 7. Személyre Szabás Bővítése

**Jelenlegi állapot**: Alapvető személyre szabás van, de lehet még mélyebb.

**Javaslat**:

- A projekt részletek alapján is személyre szabhatjuk
- A vevő iparága vagy szektor szerint is testreszabhatjuk
- A kommunikációs stílust is személyre szabhatjuk

**Implementáció**:

```typescript
// SYSTEM_PROMPT-ban:
SZEMÉLYRE SZABÁS ÉS URGENS (BŐVÍTVE):
- Ha a vevő neve vagy cégneve elérhető, használd a bevezetőben (pl. "Tisztelt Kovács Úr" vagy "Tisztelt ABC Kft.")
- Ha a projekt részletekben van információ a vevő iparágáról vagy szektoráról, használd:
  * Releváns iparági példákat és referenciákat
  * Iparági specifikus terminológiát (de érthetően)
  * Iparági best practices-eket
- Ha határidő van megadva, természetesen építsd be az urgensséget a szövegbe (de ne legyél tolakodó vagy agresszív)
- A határidőt említsd meg a schedule és next_steps szakaszokban is, ahol releváns
- Ha a projekt részletekben van információ a vevő problémájáról vagy igényéről, használd ezt a személyre szabáshoz
```

## Implementációs Javaslatok

### 1. SYSTEM_PROMPT Frissítése

A fenti javaslatok alapján frissíteni kell a `SYSTEM_PROMPT` konstanst a `route.ts` fájlban.

### 2. User Prompt Bővítése

A `userPrompt` részben is lehet bővíteni a konkrét irányításokat, különösen:

- Testimonials használatának részletesebb leírása
- Guarantees integrálásának módja
- Mérhető eredmények példái

### 3. Schema Frissítése

A `OFFER_SECTIONS_FORMAT` schema-ban is lehet finomhangolni:

- A `value_proposition` leírását bővíteni
- A `expected_outcomes` leírását specifikusabbá tenni
- Új mezők hozzáadása (ha szükséges)

## Tesztelési Javaslatok

1. **A/B tesztelés**: Különböző prompt verziókat tesztelni
2. **Konverziós metrikák**: Követni a generált ajánlatok konverziós arányát
3. **Felhasználói visszajelzések**: Gyűjteni a felhasználók visszajelzéseit a generált ajánlatokról
4. **Szövegelemzés**: Elemzni a generált szövegeket, hogy megfelelnek-e a best practices-eknek

## Implementált Változások

### ✅ 1. Testimonials, Guarantees, Schedule Eltávolítása az AI Promptból

- **Változás**: A testimonials, guarantees, schedule és deadline már nem szerepelnek az AI promptban
- **Indoklás**: Ezek a beállításokból másolódnak be (copy-paste), nem az AI generálja őket
- **Eredmény**: Az AI csak az alap szöveges tartalmat generálja, ezek a blokkok külön jelennek meg

### ✅ 2. Szólítás Következetessége Erősítése

- **Változás**: A SYSTEM_PROMPT-ban új, kiemelt szakasz a szólítás következetességéről
- **Tartalom**:
  - Részletes példák tegeződésre és magázódásra
  - Figyelmeztetés a keverés ellen
  - Követelmény: minden mondatban, minden bekezdésben következetes szólítás
- **Eredmény**: Az AI következetesen alkalmazza a kiválasztott szólítást

### ✅ 3. Címzés Eltávolítása a Bevezetőből

- **Változás**: A bevezető már nem tartalmazza a címzést (pl. "Tisztelt Kovács Úr")
- **Indoklás**: A címzés külön blokkban jelenik meg, a hangnem és ügyfél neve alapján
- **Eredmény**: Tisztább blokk struktúra, a címzés automatikusan generálódik

### ✅ 4. Blokk Struktúra Dokumentálása

- **Változás**: Új dokumentum (`OFFER_BLOCK_STRUCTURE.md`) a blokk struktúráról
- **Tartalom**:
  - Minden blokk leírása (AI generált vs. nem AI generált)
  - 2025 best practices alapján optimalizált struktúra
  - Szólítás következetessége követelmények

## Következő Lépések

1. ✅ Prompt áttekintése és dokumentálása
2. ✅ SYSTEM_PROMPT frissítése a javaslatok alapján
3. ✅ User prompt bővítése
4. ✅ Blokk struktúra dokumentálása
5. ⏳ Tesztelés és validálás
6. ⏳ Metrikák bevezetése a hatékonyság mérésére

## Referenciák

- [2025 Conversion Rate Optimization Best Practices](https://www.everconnect.com/blog/top-10-conversion-rate-optimization-best-practices-for-2025)
- [Hungarian Business Communication Best Practices](internal research)
- [AI Prompt Engineering for Business Documents](internal knowledge)
