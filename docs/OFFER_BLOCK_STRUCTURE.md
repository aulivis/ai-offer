# Ajánlat Blokk Struktúra - 2025 Best Practices

## Áttekintés

Az ajánlatok blokk-alapú struktúrában vannak felépítve, amely lehetővé teszi a moduláris összeállítást és a konverziós arány optimalizálását.

## Blokk Struktúra

### 1. Cím és Üdvözlő Sor (Title & Welcome Line)

**Típus**: Nem AI generált  
**Forrás**: Hangnem (tone) + Ügyfél neve/cégneve  
**Példa**:

- Formális: "Tisztelt Kovács Úr!"
- Barátságos: "Kedves Kovács Úr!"

**Megjegyzés**: Ez a blokk a címzett neve és a kiválasztott hangnem alapján automatikusan generálódik, nem az AI által.

---

### 2. Bevezető (Introduction)

**Típus**: AI generált  
**Tartalom**: Az ajánlat céljának bemutatása (2-3 mondat)  
**Követelmények**:

- Nem tartalmazza a címzést (az külön blokkban van)
- Következetesen alkalmazza a szólítást (tegeződés/magázódás)
- Természetes, professzionális magyar nyelv

**Példa**:

- "Köszönjük, hogy lehetőséget adott számunkra, hogy bemutassuk ajánlatunkat a weboldal átalakítására vonatkozóan."

---

### 3. Ajánlat Szövege (Offer Text Blocks)

**Típus**: AI generált  
**Alblokkok**:

- **Projekt összefoglaló** (project_summary): Probléma-megoldás-eredmény keretrendszer
- **Értékpropozíció** (value_proposition, opcionális): Egyedi érték és előnyök
- **Projekt terjedelme** (scope): Kulcsfeladatok listája
- **Szállítandó eredmények** (deliverables): Konkrét deliverable-ek
- **Várható eredmények** (expected_outcomes, opcionális): Mérhető eredmények
- **Feltételezések** (assumptions): Fontos feltételezések
- **Következő lépések** (next_steps): Cselekvésre ösztönző lépések

**Követelmények**:

- Minden blokk következetesen alkalmazza a szólítást
- Mérhető eredmények használata, ahol lehetséges
- Konkrét, akcióorientált kifejezések

---

### 4. Árak (Prices)

**Típus**: Nem AI generált  
**Forrás**: Felhasználó által megadott árlista  
**Tartalom**: Ártábla a szolgáltatásokkal, mennyiségekkel, egységárakkal

---

### 5. Mérföldkövek/Időbeosztás (Milestones/Schedule)

**Típus**: Nem AI generált  
**Forrás**: Beállításokból másolva (copy-paste)  
**Tartalom**: Időbeosztás, mérföldkövek, határidők

**Megjegyzés**: Ez a blokk a beállításokból jön, nem az AI generálja. Az AI nem hivatkozik rá a szövegben.

---

### 6. Garantia (Guarantees)

**Típus**: Nem AI generált  
**Forrás**: Beállításokból másolva (copy-paste)  
**Tartalom**: Garantiák, bizalomépítő elemek

**Megjegyzés**: Ez a blokk a beállításokból jön, nem az AI generálja. Az AI nem hivatkozik rá a szövegben.

---

### 7. Referencia Képek (Reference Images)

**Típus**: Nem AI generált  
**Forrás**: Felhasználó által feltöltött képek  
**Tartalom**: Projekt referenciák, példák

---

### 8. Vásárlói Visszajelzések (Testimonials)

**Típus**: Nem AI generált  
**Forrás**: Beállításokból másolva (copy-paste)  
**Tartalom**: Ügyfélvélemények, esettanulmányok

**Megjegyzés**: Ez a blokk a beállításokból jön, nem az AI generálja. Az AI nem hivatkozik rá a szövegben.

---

### 9. Záró Szavak (Closing Words)

**Típus**: AI generált  
**Tartalom**: Udvarias zárás, értékösszefoglaló, erősen cselekvésre ösztönző  
**Követelmények**:

- Következetesen alkalmazza a szólítást
- Egyértelmű következő lépés javaslat
- Pozitív, együttműködésre ösztönző hangvétel

---

## Szólítás Következetessége

**KRITIKUS KÖVETELMÉNY**: A szólítás (tegeződés/magázódás) következetesen alkalmazandó a TELJES ajánlatban:

- Minden AI generált blokkban (bevezető, projekt összefoglaló, zárás, stb.)
- Minden mondatban, minden bekezdésben
- A felsorolásokban is
- Nincs keverés: vagy teljesen tegeződés, vagy teljesen magázódás

**Példák**:

- **Tegeződés**: "te", "ti", "tiétek", "neked", "nektek", "kapsz", "kaptok", "készítettem neked"
- **Magázódás**: "Ön", "Önök", "Önöké", "Önnek", "Önöknek", "kap", "kapnak", "készítettem Önnek"

---

## 2025 Best Practices Alapján Optimalizált Struktúra

Ez a blokk struktúra a következő 2025-es best practices-eket követi:

1. **Moduláris felépítés**: Minden blokk függetlenül kezelhető és testreszabható
2. **Személyre szabás**: Címzés és szólítás a beállítások alapján
3. **Társadalmi bizonyítékok**: Testimonials külön blokkban, könnyen elérhető
4. **Bizalomépítés**: Garantiák külön blokkban, jól láthatóan
5. **Vizuális tartalom**: Referencia képek külön blokkban
6. **Mérhető eredmények**: AI generált blokkokban mérhető metrikák
7. **Cselekvésre ösztönzés**: Záró szavak és következő lépések erősen akcióorientáltak

---

## Implementáció

### AI Generált Blokkok

- `introduction`: Bevezető
- `project_summary`: Projekt összefoglaló
- `value_proposition`: Értékpropozíció (opcionális)
- `scope`: Projekt terjedelme
- `deliverables`: Szállítandó eredmények
- `expected_outcomes`: Várható eredmények (opcionális)
- `assumptions`: Feltételezések
- `next_steps`: Következő lépések
- `closing`: Záró szavak

### Nem AI Generált Blokkok

- **Cím és üdvözlő**: Automatikusan generálva hangnem + név alapján
- **Árak**: Felhasználó által megadott
- **Mérföldkövek**: Beállításokból másolva
- **Garantia**: Beállításokból másolva
- **Referencia képek**: Felhasználó által feltöltött
- **Testimonials**: Beállításokból másolva

---

## Jövőbeli Fejlesztések

1. **Blokk sorrend testreszabása**: Felhasználók testreszabhatják a blokkok sorrendjét
2. **Blokk láthatóság**: Egyes blokkok elrejthetők/megjeleníthetők
3. **Többszörös testimonials**: Több testimonials blokk különböző helyeken
4. **Videó blokkok**: Videó referenciák hozzáadása



