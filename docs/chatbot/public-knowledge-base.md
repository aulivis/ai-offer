# Vyndi - Felhasználói Tudásbázis

## Áttekintés

A Vyndi egy AI-alapú üzleti ajánlatkészítő platform, amely segít professzionális, márkázott PDF ajánlatokat készíteni percek alatt. Ideális kis- és középvállalkozásoknak, freelancereknek és ügynökségeknek.

## Előfizetési Csomagok

### Ingyenes Csomag (Free)
- **Ajánlat limit:** 2 ajánlat havonta
- **Ár:** Ingyenes
- **Funkciók:**
  - Alap sablonok
  - PDF export
  - AI-alapú szöveg generálás magyar nyelven

### Standard Csomag
- **Ajánlat limit:** 5 ajánlat havonta
- **Ár:** 1 490 Ft / hó
- **Funkciók:**
  - 5 ajánlat / hónap
  - Márkázott PDF export logóval és színekkel
  - Alap sablonok + logó feltöltés
  - AI-alapú szöveg generálás magyar nyelven
  - Tételes árkalkuláció

**Ideális:** Kis csapatoknak és freelancereknek

### Pro Csomag
- **Ajánlat limit:** Korlátlan
- **Ár:** 6 990 Ft / hó
- **Funkciók:**
  - Korlátlan ajánlat & verziókövetés
  - Márkázott PDF & prémium sablonkönyvtár
  - Prioritásos AI-szöveg finomhangolás
  - Képek beszúrása a PDF-be
  - Prémium sablonok

**Ideális:** Növekvő csapatoknak és vállalkozásoknak

## Ajánlat Készítés - Lépésről Lépésre

### 1. Lépés: Részletek
Az ajánlat létrehozásának első lépésében a következő információkat kell megadni:
- **Cím:** Az ajánlat címe
- **Projekt részletek:** Részletes leírás a projektről
- **Ügyfél információ:** Ügyfél neve, címe, adószáma
- **Iparág:** A projekt iparága
- **Határidő:** A projekt határideje
- **Nyelv:** Az ajánlat nyelve (magyar)

### 2. Lépés: Árkalkuláció
A második lépésben az árkalkulációt kell beállítani:
- **Ár tételek:** Szolgáltatások, termékek listája
- **Mennyiség:** Mennyiség minden tételhez
- **Egységár:** Egységár (nettó) minden tételhez
- **ÁFA:** ÁFA százalék minden tételhez
- **Összesítés:** Automatikus összesítés (nettó, ÁFA, bruttó)

### 3. Lépés: Összefoglaló
A harmadik lépésben az ajánlat összefoglalója jelenik meg:
- **Előnézet:** Az ajánlat előnézete
- **PDF generálás:** PDF generálása
- **Letöltés:** PDF letöltése

## Sablonok

### Alap Sablonok (Free/Standard)
Az alap sablonok minden csomagban elérhetők:
- **Egyszerű sablon:** Alapvető formázás
- **Klasszikus sablon:** Hagyományos megjelenés
- **Modern sablon:** Modern dizájn

### Prémium Sablonok (Pro)
A prémium sablonok csak a Pro csomagban érhetők el:
- **Elegáns sablon:** Elegáns, prémium megjelenés
- **Kreatív sablon:** Kreatív, egyedi dizájn
- **Professzionális sablon:** Üzleti, professzionális megjelenés

### Sablon Funkciók
- **Márkázás:** Logó és színek testreszabása
- **Testreszabás:** Színek, betűtípusok, elrendezés módosítása
- **PDF Export:** Professzionális PDF export
- **Előnézet:** Valós idejű előnézet

## API Használat

### Alapvető Információk
A Vyndi API REST-alapú, és HTTP-only cookie-alapú hitelesítést használ.

### Hitelesítés
Minden API végpont (kivéve `/api/auth/*`) hitelesítést igényel:
- `propono_at` - Hozzáférési token (HTTP-only cookie)
- `propono_rt` - Frissítési token (HTTP-only cookie)
- `XSRF-TOKEN` - CSRF token (header: `x-csrf-token`)

### Főbb Végpontok

#### POST /api/ai-generate
AI-alapú ajánlat generálása és PDF létrehozása.

**Kérés:**
```json
{
  "title": "Projekt Címe",
  "industry": "Technology",
  "projectDetails": {},
  "deadline": "2024-12-31",
  "language": "hu",
  "brandVoice": "friendly",
  "style": "detailed",
  "prices": [],
  "templateId": "template-id",
  "clientId": "uuid",
  "pdfWebhookUrl": "https://example.com/webhook"
}
```

**Válasz:**
```json
{
  "ok": true,
  "id": "offer-uuid",
  "pdfUrl": "https://...",
  "status": "pending",
  "downloadToken": "token"
}
```

#### POST /api/ai-preview
AI-alapú ajánlat előnézet generálása (streaming).

**Kérés:**
```json
{
  "title": "Projekt Címe",
  "industry": "Technology",
  "projectDetails": {},
  "deadline": "2024-12-31",
  "language": "hu",
  "brandVoice": "friendly",
  "style": "detailed"
}
```

**Válasz:** Server-Sent Events stream

#### GET /api/templates
Elérhető PDF sablonok listázása.

**Válasz:**
```json
[
  {
    "id": "template-id",
    "name": "Sablon Neve",
    "description": "Leírás",
    "tier": "free" | "premium"
  }
]
```

#### POST /api/storage/upload-brand-logo
Céges logó feltöltése.

**Kérés:** `multipart/form-data`
- `file` - Képfájl (PNG, JPEG, vagy SVG, max 4MB)

**Válasz:**
```json
{
  "signedUrl": "https://..."
}
```

### Rate Limiting
Minden API végpont rate limiting-et alkalmaz:
- `X-RateLimit-Limit` - Maximális kérések száma
- `X-RateLimit-Remaining` - Maradék kérések száma
- `X-RateLimit-Reset` - Limit visszaállításának időpontja
- `Retry-After` - Másodpercek száma a következő kérésig (429 válasz esetén)

### Hibakezelés
Minden hiba a következő formátumban tér vissza:
```json
{
  "error": "Hibüzenet",
  "requestId": "uuid",
  "issues": {} // Opcionális validációs hibák
}
```

### Státusz Kódok
- `200` - Sikeres
- `400` - Hibás kérés (validációs hiba)
- `401` - Nem hitelesített (hitelesítés szükséges)
- `403` - Tiltott (engedélyezési hiba)
- `404` - Nem található
- `413` - Túl nagy adatmennyiség
- `429` - Túl sok kérés (rate limit)
- `500` - Belső szerver hiba
- `502` - Hibás átjáró (külső szolgáltatás hiba)

## Funkciók

### AI-alapú Szöveg Generálás
- **Nyelv:** Magyar nyelv támogatás
- **Stílus:** Testreszabható stílus (friendly, professional, detailed, stb.)
- **Hangnem:** Testreszabható hangnem
- **Előnézet:** Valós idejű előnézet

### Márkázás
- **Logó:** Céges logó feltöltése
- **Színek:** Elsődleges és másodlagos színek testreszabása
- **PDF Export:** Márkázott PDF export

### Verziókövetés
- **Pro csomag:** Korlátlan verziókövetés
- **Előzmények:** Ajánlat előzmények megtekintése
- **Visszaállítás:** Korábbi verziók visszaállítása

### Képek Beszúrása
- **Pro csomag:** Képek beszúrása a PDF-be
- **Formátumok:** PNG, JPEG, SVG támogatás
- **Méret:** Max 4MB képfájl

## Gyakori Kérdések

### Milyen csomagok vannak?
A Vyndi három csomagot kínál:
1. **Ingyenes:** 2 ajánlat havonta, ingyenes
2. **Standard:** 5 ajánlat havonta, 1 490 Ft / hó
3. **Pro:** Korlátlan ajánlat, 6 990 Ft / hó

### Hogyan tudok ajánlatot készíteni?
1. Lépj be a Vyndi platformra
2. Kattints az "Új ajánlat" gombra
3. Töltsd ki az ajánlat részleteit (cím, projekt részletek, ügyfél információ)
4. Add meg az árkalkulációt (ár tételek, mennyiség, egységár, ÁFA)
5. Nézd meg az összefoglalót és generáld a PDF-et

### Milyen sablonok elérhetők?
- **Alap sablonok:** Minden csomagban elérhetők (Free/Standard/Pro)
- **Prémium sablonok:** Csak a Pro csomagban elérhetők

### Hogyan használhatom az API-t?
1. Hitelesítsd magad a Vyndi platformon
2. Használd a HTTP-only cookie-kat a hitelesítéshez
3. Küldj kéréseket a REST API végpontokra
4. Kezeld a rate limiting-et és a hibákat

### Mennyibe kerül a szolgáltatás?
- **Ingyenes:** Ingyenes (2 ajánlat / hó)
- **Standard:** 1 490 Ft / hó (5 ajánlat / hó)
- **Pro:** 6 990 Ft / hó (korlátlan ajánlat)

## Támogatás

Ha bármilyen kérdésed van, kérjük, lépj kapcsolatba a támogatással:
- **Email:** info@vyndi.com
- **Dokumentáció:** https://vyndi.com/docs
- **FAQ:** https://vyndi.com/faq

## Hasznos Linkek

- **Főoldal:** https://vyndi.com
- **Bejelentkezés:** https://vyndi.com/login
- **Előfizetés:** https://vyndi.com/billing
- **Dokumentáció:** https://vyndi.com/docs
- **API Dokumentáció:** https://vyndi.com/docs/api

