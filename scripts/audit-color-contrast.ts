#!/usr/bin/env tsx

/**
 * Color Contrast Audit Script
 *
 * Audits all color combinations in the application for WCAG 2.1 compliance
 * Run with: npx tsx scripts/audit-color-contrast.ts
 */

import { auditColorPairs, getContrastRatio, type ColorPair } from '../src/lib/colorContrast';

// Color definitions from globals.css and design tokens
const COLORS = {
  // Primary colors
  primary: '#00e5b0',
  primaryInk: '#04251a',
  accent: '#c3b3ff',

  // Background colors
  bg: '#f7f9fb',
  bgMuted: '#ffffff',

  // Foreground colors
  fg: '#0f172a',
  fgMuted: '#475569', // Improved contrast (was #4b5563)

  // Border colors
  border: '#e5e7eb',

  // Status colors
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  dangerInk: '#ffffff',

  // Brand colors
  brandPrimary: '#1c274c',
  brandSecondary: '#e2e8f0',
  brandText: '#0f172a',
  brandMuted: '#334155',
  brandBorder: '#475569',
  brandBg: '#ffffff',
  brandPrimaryContrast: '#ffffff',
};

// Common color combinations to test
const COLOR_PAIRS: ColorPair[] = [
  // Primary button text on primary background
  {
    foreground: COLORS.primaryInk,
    background: COLORS.primary,
    name: 'Primary button text',
    isLargeText: false,
  },
  {
    foreground: COLORS.primaryInk,
    background: COLORS.primary,
    name: 'Primary button text (large)',
    isLargeText: true,
  },

  // Regular text on background
  {
    foreground: COLORS.fg,
    background: COLORS.bg,
    name: 'Body text on background',
    isLargeText: false,
  },
  {
    foreground: COLORS.fg,
    background: COLORS.bg,
    name: 'Body text on background (large)',
    isLargeText: true,
  },

  // Muted text on background
  {
    foreground: COLORS.fgMuted,
    background: COLORS.bg,
    name: 'Muted text on background',
    isLargeText: false,
  },
  {
    foreground: COLORS.fgMuted,
    background: COLORS.bgMuted,
    name: 'Muted text on muted background',
    isLargeText: false,
  },

  // Text on primary background
  {
    foreground: COLORS.brandPrimaryContrast,
    background: COLORS.brandPrimary,
    name: 'White text on brand primary',
    isLargeText: false,
  },

  // Danger button text
  {
    foreground: COLORS.dangerInk,
    background: COLORS.danger,
    name: 'Danger button text',
    isLargeText: false,
  },

  // Text on card/muted background
  {
    foreground: COLORS.fg,
    background: COLORS.bgMuted,
    name: 'Text on card background',
    isLargeText: false,
  },
  {
    foreground: COLORS.fgMuted,
    background: COLORS.bgMuted,
    name: 'Muted text on card background',
    isLargeText: false,
  },

  // Link text (assuming it uses primary color)
  {
    foreground: COLORS.primary,
    background: COLORS.bg,
    name: 'Link text on background',
    isLargeText: false,
  },
  {
    foreground: COLORS.primary,
    background: COLORS.bgMuted,
    name: 'Link text on card background',
    isLargeText: false,
  },

  // Border visibility
  {
    foreground: COLORS.border,
    background: COLORS.bg,
    name: 'Border on background (for visibility check)',
    isLargeText: false,
  },

  // Success/Warning colors (if used as text)
  {
    foreground: COLORS.success,
    background: COLORS.bg,
    name: 'Success text on background',
    isLargeText: false,
  },
  {
    foreground: COLORS.warning,
    background: COLORS.bg,
    name: 'Warning text on background',
    isLargeText: false,
  },
];

function main() {
  console.log('🎨 Color Contrast Audit\n');
  console.log('='.repeat(80));

  const results = auditColorPairs(COLOR_PAIRS);

  // Group by pass/fail
  const passing = results.filter((r) => r.passesAA);
  const failing = results.filter((r) => !r.passesAA);
  const aaa = results.filter((r) => r.passesAAA);

  console.log('\n📊 Summary:');
  console.log(`  Total combinations: ${results.length}`);
  console.log(`  ✅ Passing WCAG AA: ${passing.length}`);
  console.log(`  ❌ Failing WCAG AA: ${failing.length}`);
  console.log(`  🌟 Meeting WCAG AAA: ${aaa.length}`);

  if (failing.length > 0) {
    console.log('\n❌ Failing Combinations (WCAG AA):');
    failing.forEach((result) => {
      console.log(`  • ${result.name}`);
      console.log(`    Contrast ratio: ${result.contrastRatio.toFixed(2)}:1`);
      console.log(`    Required: ${result.isLargeText ? '3:1' : '4.5:1'} (WCAG AA)`);
      console.log(`    Foreground: ${result.foreground}`);
      console.log(`    Background: ${result.background}`);
      console.log('');
    });
  }

  console.log('\n✅ Passing Combinations:');
  passing.forEach((result) => {
    const level = result.passesAAA ? 'AAA' : 'AA';
    const icon = result.passesAAA ? '🌟' : '✓';
    console.log(`  ${icon} ${result.name} (${result.contrastRatio.toFixed(2)}:1, WCAG ${level})`);
  });

  console.log('\n' + '='.repeat(80));

  if (failing.length > 0) {
    console.log('\n⚠️  Action required: Some color combinations fail WCAG AA requirements.');
    console.log('   Please update the failing combinations to meet accessibility standards.');
    process.exit(1);
  } else {
    console.log('\n✨ All color combinations meet WCAG AA requirements!');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

export { main };

