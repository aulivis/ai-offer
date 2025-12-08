// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Read the analysis results
const analysisPath = path.join(__dirname, '../translation-analysis.json');
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

// Read the original translation file
const translationPath = path.join(__dirname, '../src/copy/hu.ts');
let content = fs.readFileSync(translationPath, 'utf8');

// Function to check if any child of a key path is used
function hasUsedChildren(keyPath, allUsedKeys) {
  const prefix = keyPath + '.';
  return allUsedKeys.some((usedKey) => usedKey.startsWith(prefix));
}

const usedKeys = analysis.used;

// Remove unused keys by parsing and reconstructing
// This is a simplified approach - we'll remove entire unused sections
const lines = content.split('\n');
const result = [];
let currentPath = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Skip empty lines at the start
  if (trimmed === '' && result.length === 0) {
    continue;
  }

  // Check if this line defines a key
  const keyMatch = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*|'[^']+'|\d+)\s*:/);

  if (keyMatch) {
    const key = keyMatch[1].replace(/['"]/g, '');
    const currentIndent = line.match(/^(\s*)/)[1].length / 2;

    // Build current path
    while (currentPath.length > currentIndent) {
      currentPath.pop();
    }

    const keyPath = currentPath.length > 0 ? currentPath.join('.') + '.' + key : key;

    // Check if this key or any of its children are used
    const isUsed = usedKeys.includes(keyPath) || hasUsedChildren(keyPath, usedKeys);

    if (!isUsed && !trimmed.includes('as const')) {
      // Skip this entire section
      // Count braces to skip until the section closes
      let braceCount = 0;
      let foundOpenBrace = false;

      for (let j = i; j < lines.length; j++) {
        const checkLine = lines[j];
        const openBraces = (checkLine.match(/\{/g) || []).length;
        const closeBraces = (checkLine.match(/\}/g) || []).length;
        braceCount += openBraces - closeBraces;

        if (openBraces > 0) foundOpenBrace = true;

        if (foundOpenBrace && braceCount === 0) {
          i = j;
          break;
        }
      }
      continue;
    }

    currentPath.push(key);
    result.push(line);
  } else if (trimmed === '}' || trimmed.endsWith('},') || trimmed.endsWith('}')) {
    // Closing brace - pop from path
    if (currentPath.length > 0) {
      currentPath.pop();
    }
    result.push(line);
  } else {
    result.push(line);
  }
}

// Write the cleaned content
fs.writeFileSync(translationPath, result.join('\n'), 'utf8');
console.log(`Removed unused translation keys`);
console.log(`Original: ${analysis.totalDefined} keys`);
console.log(`Kept: ${analysis.totalUsed} keys`);
console.log(`Removed: ${analysis.unused.length} keys`);
