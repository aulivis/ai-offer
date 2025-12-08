// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Read the analysis results
const analysisPath = path.join(__dirname, '../translation-analysis.json');
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

// Read the original translation file
const translationPath = path.join(__dirname, '../src/copy/hu.ts');
const translationContent = fs.readFileSync(translationPath, 'utf8');

// Extract the translation object
const translationMatch = translationContent.match(/export const hu = ({[\s\S]*?}) as const;/);
if (!translationMatch) {
  console.error('Could not parse translation file');
  process.exit(1);
}

let translationObj;
try {
  eval(`translationObj = ${translationMatch[1]}`);
} catch (e) {
  console.error('Could not evaluate translation object:', e.message);
  process.exit(1);
}

// Function to get nested value from object using dot notation
function getNestedValue(obj, key) {
  const keys = key.split('.');
  let value = obj;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  return value;
}

// Function to set nested value in object using dot notation
function setNestedValue(obj, key, value) {
  const keys = key.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== 'object' || current[k] === null) {
      current[k] = {};
    }
    current = current[k];
  }
  current[keys[keys.length - 1]] = value;
}

// Build new object with only used keys
const usedKeys = new Set(analysis.used);
const cleanedObj = {};

usedKeys.forEach((key) => {
  const value = getNestedValue(translationObj, key);
  if (value !== undefined) {
    setNestedValue(cleanedObj, key, value);
  }
});

// Convert object to formatted string
function formatObject(obj, indent = 0) {
  const indentStr = '  '.repeat(indent);
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return '{}';
  }

  const lines = entries.map(([key, value], index) => {
    const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
    const isLast = index === entries.length - 1;
    const comma = isLast ? '' : ',';

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const formattedValue = formatObject(value, indent + 1);
      return `${indentStr}${formattedKey}: ${formattedValue}${comma}`;
    } else if (typeof value === 'string') {
      // Escape quotes and newlines
      const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
      return `${indentStr}${formattedKey}: '${escaped}'${comma}`;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      return `${indentStr}${formattedKey}: ${value}${comma}`;
    } else if (Array.isArray(value)) {
      const items = value.map((item) => {
        if (typeof item === 'string') {
          const escaped = item.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
          return `'${escaped}'`;
        }
        return JSON.stringify(item);
      });
      return `${indentStr}${formattedKey}: [${items.join(', ')}]${comma}`;
    } else {
      return `${indentStr}${formattedKey}: ${JSON.stringify(value)}${comma}`;
    }
  });

  return `{\n${lines.join('\n')}\n${indentStr}}`;
}

// Generate the cleaned file content
const cleanedContent = `export const hu = ${formatObject(cleanedObj)} as const;
`;

// Write the cleaned file
const outputPath = path.join(__dirname, '../src/copy/hu.ts');
fs.writeFileSync(outputPath, cleanedContent, 'utf8');

console.log(`Cleaned translation file written to ${outputPath}`);
console.log(`Removed ${analysis.unused.length} unused keys`);
console.log(`Kept ${analysis.used.length} used keys`);
