/**
 * Preset Questions Handler
 * 
 * Handles predefined questions with direct answers, bypassing vector search.
 * This ensures fast and accurate responses for common questions.
 */

export interface PresetQuestion {
  /** The exact question text */
  question: string;
  /** Variations of the question (for fuzzy matching) */
  variations: string[];
  /** The predefined answer */
  answer: string;
}

/**
 * Normalizes text for comparison (lowercase, trim, remove punctuation)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculates simple similarity between two strings
 * Returns a value between 0 and 1, where 1 is an exact match
 */
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) {
    return 1.0;
  }
  
  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.9;
  }
  
  // Simple word overlap similarity
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  const allWords = new Set([...words1, ...words2]);
  const commonWords = words1.filter(w => words2.includes(w));
  
  if (allWords.size === 0) return 0;
  
  return commonWords.length / allWords.size;
}

/**
 * Predefined questions and answers based on CHATBOT_PREDEFINED_QUESTIONS_ANSWERS.md
 */
export const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    question: 'Milyen csomagok vannak?',
    variations: [
      'milyen csomagok elérhetők',
      'milyen előfizetési csomagok vannak',
      'milyen csomagok léteznek',
      'csomagok listája',
      'elérhető csomagok',
    ],
    answer: `A Vyndi három előfizetési csomagot kínál:

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

További információk: https://vyndi.com/billing`,
  },
  {
    question: 'Hogyan tudok ajánlatot készíteni?',
    variations: [
      'hogyan készítek ajánlatot',
      'ajánlat készítés lépései',
      'hogyan lehet ajánlatot készíteni',
      'ajánlat készítése hogyan',
      'ajánlatot hogyan készítek',
    ],
    answer: `Az ajánlat készítése 3 lépésben történik:

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

A teljes folyamat percek alatt elkészül AI segítségével. További információ: https://vyndi.com/docs`,
  },
  {
    question: 'Milyen sablonok elérhetők?',
    variations: [
      'milyen sablonok vannak',
      'elérhető sablonok',
      'sablonok listája',
      'milyen sablonokat használhatok',
      'sablon típusok',
    ],
    answer: `A Vyndi két típusú sablont kínál:

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

A Pro csomagra való frissítéssel hozzáférhetsz a prémium sablonokhoz. További információ: https://vyndi.com/billing`,
  },
  {
    question: 'Mennyibe kerül a szolgáltatás?',
    variations: [
      'mennyi a szolgáltatás ára',
      'mennyibe kerül',
      'mekkora az ár',
      'árlista',
      'árak',
      'díjszabás',
      'mennyi az előfizetés',
    ],
    answer: `A Vyndi három előfizetési csomagot kínál különböző árakkal:

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

Az előfizetés havonta automatikusan megújul. Bármikor lemondhatod vagy változtathatod a csomagot. További információ: https://vyndi.com/billing`,
  },
];

/**
 * Checks if a query matches any preset question
 * 
 * @param query - The user's query
 * @param similarityThreshold - Minimum similarity threshold (default: 0.6 for more lenient matching)
 * @returns The matching preset question, or null if no match
 */
export function matchPresetQuestion(
  query: string,
  similarityThreshold: number = 0.6,
): PresetQuestion | null {
  const normalizedQuery = normalizeText(query);
  
  // First, try exact match (case-insensitive, punctuation-ignored)
  for (const preset of PRESET_QUESTIONS) {
    const normalizedPreset = normalizeText(preset.question);
    if (normalizedQuery === normalizedPreset) {
      return preset;
    }
  }
  
  // Then try variations
  for (const preset of PRESET_QUESTIONS) {
    for (const variation of preset.variations) {
      const normalizedVariation = normalizeText(variation);
      if (normalizedQuery === normalizedVariation) {
        return preset;
      }
      // Also check similarity for close matches - use threshold but require higher confidence for variations
      const similarity = calculateSimilarity(query, variation);
      // Use a slightly higher threshold (0.75) for variations to ensure quality matches
      if (similarity >= Math.max(0.75, similarityThreshold)) {
        return preset;
      }
    }
  }
  
  // Check similarity with original questions
  for (const preset of PRESET_QUESTIONS) {
    const similarity = calculateSimilarity(query, preset.question);
    // Use threshold for original questions - more lenient
    if (similarity >= similarityThreshold) {
      return preset;
    }
  }
  
  // Finally, try keyword-based matching for more lenient matching
  for (const preset of PRESET_QUESTIONS) {
    const normalizedQuestion = normalizeText(preset.question);
    
    // Extract meaningful words (longer than 2 characters, exclude common words)
    const commonWords = new Set(['van', 'vannak', 'milyen', 'hogyan', 'mit', 'mi', 'egy', 'vagy', 'a', 'az', 'és']);
    const questionWords = normalizedQuestion
      .split(' ')
      .filter(w => w.length > 2 && !commonWords.has(w));
    const queryWords = normalizedQuery
      .split(' ')
      .filter(w => w.length > 2 && !commonWords.has(w));
    
    if (questionWords.length === 0) continue;
    
    // Count matching words (allowing partial matches)
    const matchingWords = questionWords.filter(qWord => 
      queryWords.some(qw => qw === qWord || qw.includes(qWord) || qWord.includes(qw))
    );
    
    // If majority of key words match, it's likely the same question
    const matchRatio = matchingWords.length / questionWords.length;
    // Use threshold-based matching: if threshold is lower, require more word matches
    const requiredRatio = similarityThreshold >= 0.7 ? 0.7 : 0.8;
    if (matchRatio >= requiredRatio && matchingWords.length > 0) {
      // For "Milyen csomagok vannak?" vs "Milyen csomagok vannak?"
      // questionWords: ["csomagok"]
      // queryWords: ["csomagok"]
      // matchRatio: 1.0
      return preset;
    }
  }
  
  return null;
}

