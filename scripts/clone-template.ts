#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';

/**
 * Clone an existing template to create a new one
 * Usage: pnpm template:clone <source-template-id> "<New Template Name>" [tier] [legacy-id]
 * Example: pnpm template:clone free.minimal "Modern Minimal" premium
 */

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: pnpm template:clone <source-template-id> "<New Template Name>" [tier] [legacy-id]');
  console.error('  source-template-id: e.g., free.minimal or premium.executive');
  console.error('  tier: free (default) or premium');
  console.error('  legacy-id: optional legacy template identifier');
  console.error('\nExample: pnpm template:clone free.minimal "Modern Minimal" premium');
  process.exit(1);
}

const sourceTemplateId = args[0];
const newName = args[1];
const tier = (args[2] === 'premium' ? 'premium' : 'free') as 'free' | 'premium';
const legacyId = args[3]?.trim() || undefined;

// Extract template name from ID (e.g., "free.minimal" -> "minimal")
const sourceParts = sourceTemplateId.split('.');
const sourceName = sourceParts[sourceParts.length - 1] || sourceTemplateId;

// Generate new template ID
const newId = newName
  .toLowerCase()
  .replace(/\s+/g, '.')
  .replace(/[^a-z0-9\.]/g, '');
const newTemplateId = `${tier}.${newId}@1.0.0`;

const templatesDir = path.join(process.cwd(), 'src/app/pdf/templates');
const sourceDir = path.join(templatesDir, sourceTemplateId);
const targetDir = path.join(templatesDir, `${tier}.${newId}`);

if (!fs.existsSync(sourceDir)) {
  console.error(`❌ Source template not found: ${sourceDir}`);
  console.error(`   Available templates:`);
  const templates = fs.readdirSync(templatesDir).filter((item) => {
    const itemPath = path.join(templatesDir, item);
    return fs.statSync(itemPath).isDirectory() && item.includes('.');
  });
  templates.forEach((t) => console.error(`   - ${t}`));
  process.exit(1);
}

if (fs.existsSync(targetDir)) {
  console.error(`❌ Target template already exists: ${targetDir}`);
  process.exit(1);
}

console.log(`\n📋 Cloning template: ${sourceTemplateId} -> ${tier}.${newId}`);
console.log(`   Source: ${sourceDir}`);
console.log(`   Target: ${targetDir}\n`);

// Create target directory
fs.mkdirSync(targetDir, { recursive: true });
fs.mkdirSync(path.join(targetDir, 'partials'), { recursive: true });

// Clone files with replacements
const filesToClone = [
  { src: 'tokens.ts', dest: 'tokens.ts', transform: true },
  { src: 'styles.css.ts', dest: 'styles.css.ts', transform: true },
  { src: 'partials/head.ts', dest: 'partials/head.ts', transform: true },
  { src: 'partials/body.ts', dest: 'partials/body.ts', transform: true },
  { src: 'index.ts', dest: 'index.ts', transform: true },
];

// Also clone assets directory if it exists
const assetsDir = path.join(sourceDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const targetAssetsDir = path.join(targetDir, 'assets');
  fs.mkdirSync(targetAssetsDir, { recursive: true });
  const assets = fs.readdirSync(assetsDir);
  assets.forEach((asset) => {
    fs.copyFileSync(
      path.join(assetsDir, asset),
      path.join(targetAssetsDir, asset),
    );
  });
  console.log(`✅ Cloned ${assets.length} asset file(s)`);
}

filesToClone.forEach(({ src, dest, transform }) => {
  const sourcePath = path.join(sourceDir, src);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️  Source file not found: ${src}`);
    return;
  }

  let content = fs.readFileSync(sourcePath, 'utf8');

  if (transform) {
    // Replace template identifiers
    const sourceVarName = sourceName.replace(/\./g, '_');
    const newVarName = newId.replace(/\./g, '_');

    // Replace variable names
    content = content.replace(
      new RegExp(`\\b${sourceVarName}\\w*`, 'g'),
      (match) => {
        if (match.includes('Template')) {
          return match.replace(sourceVarName, newVarName);
        }
        if (match.includes('Tokens')) {
          return match.replace(sourceVarName, newVarName);
        }
        return match.replace(sourceVarName, newVarName);
      },
    );

    // Replace template ID
    const sourceFullId = `${sourceTemplateId}@`;
    content = content.replace(
      new RegExp(sourceFullId.replace('.', '\\.') + '[\\d.]+', 'g'),
      newTemplateId,
    );

    // Replace template label
    const oldLabelMatch = content.match(/label:\s*['"]([^'"]+)['"]/);
    if (oldLabelMatch) {
      content = content.replace(oldLabelMatch[0], `label: '${newName}'`);
    }

    // Replace tier if different
    const sourceTier = sourceTemplateId.startsWith('premium') ? 'premium' : 'free';
    if (sourceTier !== tier) {
      content = content.replace(/tier:\s*['"]\w+['"]/, `tier: '${tier}'`);
    }

    // Update marketing highlight for premium templates
    if (tier === 'premium' && !content.includes('marketingHighlight')) {
      const insertPoint = content.indexOf('version:');
      if (insertPoint > -1) {
        const before = content.substring(0, insertPoint);
        const after = content.substring(insertPoint);
        content = `${before}  marketingHighlight: 'Professional ${newName} template for premium offers.',\n  ${after}`;
      }
    }

    // Update capabilities based on tier
    if (tier === 'free') {
      content = content.replace(
        /'branding\.logo':\s*true/g,
        "'branding.logo': false",
      );
    } else {
      content = content.replace(
        /'branding\.logo':\s*false/g,
        "'branding.logo': true",
      );
    }

    // Add or update legacy ID
    if (legacyId) {
      if (content.includes('legacyId:')) {
        content = content.replace(/legacyId:\s*['"][^'"]+['"]/, `legacyId: '${legacyId}'`);
      } else {
        // Add legacyId after id
        content = content.replace(
          /(id:\s*['"][^'"]+['"])/,
          `$1,\n  legacyId: '${legacyId}'`,
        );
      }
    }

    // Update CSS class names to use new template name
    const cssClassName = newId.replace(/\./g, '-');
    const oldCssClassName = sourceName.replace(/\./g, '-');
    content = content.replace(
      new RegExp(`--${oldCssClassName}`, 'g'),
      `--${cssClassName}`,
    );
    content = content.replace(
      new RegExp(`__${oldCssClassName}`, 'g'),
      `__${cssClassName}`,
    );
  }

  const targetPath = path.join(targetDir, dest);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`✅ Cloned ${src}`);
});

console.log(`\n✅ Successfully cloned template!`);
console.log(`📁 Location: ${targetDir}`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Review and customize the cloned files`);
console.log(`   2. Update tokens.ts with your color scheme`);
console.log(`   3. Modify styles.css.ts for your design`);
console.log(`   4. Customize partials/body.ts and partials/head.ts`);
console.log(`   5. Update template ID, label, and version in index.ts`);
console.log(`   6. Register template in engineRegistry.ts:`);
console.log(`      import { ${newId.replace(/\./g, '_')}Template } from './${tier}.${newId}';`);
console.log(`      registerTemplate(${newId.replace(/\./g, '_')}Template);`);
console.log(`   7. Run tests: pnpm test:templates`);
console.log(`\n💡 Tip: Search for "${sourceName}" in the cloned files to find remaining references to update.\n`);

