// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Find all translation key usages
function findTranslationKeys(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      findTranslationKeys(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Extract translation keys from file content
function extractKeys(content) {
  const keys = new Set();

  // Match patterns like: t('key'), translator.t('key'), i18n.t('key'), ctx.i18n.t('key')
  const patterns = [/\.t\(['"]([^'"]+)['"]/g, /\bt\(['"]([^'"]+)['"]/g];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      keys.add(match[1]);
    }
  });

  return Array.from(keys);
}

// Get all keys from translation object recursively
function getAllKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

// Main analysis
const srcDir = path.join(__dirname, '../src');
const translationFile = path.join(__dirname, '../src/copy/hu.ts');

console.log('Finding all source files...');
const files = findTranslationKeys(srcDir);

console.log(`Found ${files.length} files to analyze`);

console.log('Extracting translation keys from source files...');
const usedKeys = new Set();

files.forEach((file) => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const keys = extractKeys(content);
    keys.forEach((key) => usedKeys.add(key));
  } catch (_error) {
    // Skip files that can't be read
  }
});

console.log(`Found ${usedKeys.size} unique translation keys in use`);

// Read translation file
console.log('Reading translation file...');
const translationContent = fs.readFileSync(translationFile, 'utf8');

// Extract the translation object (simple approach - eval the export)
// We'll need to parse it more carefully
const translationMatch = translationContent.match(/export const hu = ({[\s\S]*?}) as const;/);
if (!translationMatch) {
  console.error('Could not parse translation file');
  process.exit(1);
}

// Use eval to get the object (in a real scenario, we'd use a proper parser)
let translationObj;
try {
  eval(`translationObj = ${translationMatch[1]}`);
} catch (e) {
  console.error('Could not evaluate translation object:', e.message);
  process.exit(1);
}

const definedKeys = new Set(getAllKeys(translationObj));

console.log(`Found ${definedKeys.size} keys in translation file`);

// Find unused keys
const unusedKeys = Array.from(definedKeys).filter((key) => !usedKeys.has(key));

console.log(`\nFound ${unusedKeys.length} unused translation keys:`);
unusedKeys.sort().forEach((key) => {
  console.log(`  - ${key}`);
});

// Save results
const results = {
  totalDefined: definedKeys.size,
  totalUsed: usedKeys.size,
  unused: unusedKeys,
  used: Array.from(usedKeys).sort(),
};

fs.writeFileSync(
  path.join(__dirname, '../translation-analysis.json'),
  JSON.stringify(results, null, 2),
);

console.log('\nResults saved to translation-analysis.json');
