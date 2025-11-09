# Chatbot Predefined Questions - Expected Answers

## Overview

This document defines the expected answers for the predefined chatbot questions. These answers should be provided based on the public knowledge base.

## Predefined Questions

### 1. "Milyen csomagok vannak?" (What packages are available?)

**Expected Answer:**
A Vyndi három előfizetési csomagot kínál:

1. **Ingyenes Csomag:**
   - 2 ajánlat havonta
   - Ingyenes
   - Alap sablonok
   - PDF export
   - AI-alapú szöveg generálás magyar nyelven

2. **Standard Csomag:**
   - 5 ajánlat havonta
   - 1 490 Ft / hó
   - Márkázott PDF export logóval és színekkel
   - Alap sablonok + logó feltöltés
   - AI-alapú szöveg generálás magyar nyelven
   - Tételes árkalkuláció
   - Ideális kis csapatoknak és freelancereknek

3. **Pro Csomag:**
   - Korlátlan ajánlat
   - 6 990 Ft / hó
   - Korlátlan ajánlat & verziókövetés
   - Márkázott PDF & prémium sablonkönyvtár
   - Prioritásos AI-szöveg finomhangolás
   - Képek beszúrása a PDF-be
   - Prémium sablonok
   - Ideális növekvő csapatoknak és vállalkozásoknak

További információk: https://vyndi.com/billing

---

### 2. "Hogyan tudok ajánlatot készíteni?" (How can I create an offer?)

**Expected Answer:**
Az ajánlat készítése 3 lépésben történik:

**1. Lépés: Részletek**

- Add meg az ajánlat címét
- Töltsd ki a projekt részleteit (leírás, iparág, határidő)
- Add meg az ügyfél információkat (név, cím, adószám)
- Válaszd ki a nyelvet (magyar)

**2. Lépés: Árkalkuláció**

- Add meg az ár tételeket (szolgáltatások, termékek)
- Állítsd be a mennyiséget, egységárat és ÁFA-t minden tételhez
- Az összesítés (nettó, ÁFA, bruttó) automatikusan számítódik

**3. Lépés: Összefoglaló**

- Nézd meg az ajánlat előnézetét
- Válassz sablont (alap vagy prémium)
- Generáld és töltsd le a PDF-et

A teljes folyamat percek alatt elkészül AI segítségével. További információ: https://vyndi.com/docs

---

### 3. "Milyen sablonok elérhetők?" (What templates are available?)

**Expected Answer:**
A Vyndi két típusú sablont kínál:

**Alap Sablonok (Free/Standard/Pro):**

- Minden csomagban elérhetők
- Egyszerű, klasszikus, modern sablonok
- Márkázható logóval és színekkel
- Professzionális PDF export

**Prémium Sablonok (Csak Pro):**

- Csak a Pro csomagban elérhetők
- Elegáns, kreatív, professzionális sablonok
- Fejlett testreszabási lehetőségek
- Prémium megjelenés

Minden sablon támogatja:

- Logó és színek testreszabását
- PDF exportot
- Valós idejű előnézetet

A Pro csomagra való frissítéssel hozzáférhetsz a prémium sablonokhoz. További információ: https://vyndi.com/billing

---

### 4. "Mennyibe kerül a szolgáltatás?" (How much does the service cost?)

**Expected Answer:**
A Vyndi három előfizetési csomagot kínál különböző árakkal:

1. **Ingyenes:** Ingyenes (2 ajánlat / hó)
2. **Standard:** 1 490 Ft / hó (5 ajánlat / hó)
3. **Pro:** 6 990 Ft / hó (korlátlan ajánlat)

**Standard Csomag jellemzői:**

- 5 ajánlat havonta
- Márkázott PDF export
- Alap sablonok + logó feltöltés
- AI-alapú szöveg generálás

**Pro Csomag jellemzői:**

- Korlátlan ajánlat
- Prémium sablonok
- Verziókövetés
- Képek beszúrása
- Prioritásos támogatás

Az előfizetés havonta automatikusan megújul. Bármikor lemondhatod vagy változtathatod a csomagot. További információ: https://vyndi.com/billing

---

## Testing

After ingesting the knowledge base, test each predefined question:

1. Open the chatbot
2. Click on a predefined question
3. Verify the answer matches the expected answer above
4. Check that the answer is helpful and accurate
5. Verify that sources are cited when relevant

## Updating Answers

To update the expected answers:

1. Edit `docs/chatbot/public-knowledge-base.md`
2. Update this document with the new expected answers
3. Re-ingest the knowledge base:
   ```bash
   npm run ingest-chatbot-knowledge-base
   ```
4. Test the updated answers

## Notes

- Answers should be in Hungarian
- Answers should be helpful and accurate
- Answers should cite sources when relevant
- Answers should be concise but comprehensive
- Answers should guide users to relevant documentation or support
