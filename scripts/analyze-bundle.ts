#!/usr/bin/env ts-node
/**
 * Bundle Analysis Script
 *
 * This script runs bundle analysis and generates reports to help identify
 * large dependencies and optimization opportunities.
 *
 * Usage:
 *   pnpm ts-node scripts/analyze-bundle.ts
 *   pnpm ts-node scripts/analyze-bundle.ts --compare
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(__dirname, '..');
const BUNDLE_ANALYSIS_DIR = join(PROJECT_ROOT, '.next', 'analyze');
const REPORT_FILE = join(PROJECT_ROOT, 'bundle-analysis-report.json');

interface BundleReport {
  timestamp: string;
  totalSize: number;
  largestChunks: Array<{
    name: string;
    size: number;
    percentage: number;
  }>;
  recommendations: string[];
}

function runBundleAnalysis(): void {
  console.log('🔍 Running bundle analysis...');
  console.log('This may take a few minutes...\n');

  try {
    // Run Next.js build with bundle analyzer
    execSync('ANALYZE=true next build', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        ANALYZE: 'true',
      },
    });

    console.log('\n✅ Bundle analysis complete!');
    console.log(`📊 Reports generated in: ${BUNDLE_ANALYSIS_DIR}`);
    console.log('\n💡 Tips:');
    console.log('  - Open .next/analyze/client.html in your browser to view the client bundle');
    console.log('  - Open .next/analyze/server.html to view the server bundle');
    console.log('  - Look for large dependencies that could be dynamically imported');
    console.log('  - Check for duplicate dependencies across chunks\n');
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error);
    process.exit(1);
  }
}

function generateReport(): BundleReport {
  // This is a simplified report generator
  // In a real scenario, you'd parse the actual bundle analysis output
  const report: BundleReport = {
    timestamp: new Date().toISOString(),
    totalSize: 0, // Would be calculated from actual bundle data
    largestChunks: [],
    recommendations: [
      'Use dynamic imports for below-the-fold components',
      'Consider code-splitting large third-party libraries',
      'Review and optimize images and assets',
      'Check for duplicate dependencies',
      'Monitor bundle size in CI/CD pipeline',
    ],
  };

  return report;
}

function saveReport(report: BundleReport): void {
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`📝 Report saved to: ${REPORT_FILE}`);
}

function compareReports(): void {
  if (!existsSync(REPORT_FILE)) {
    console.log('⚠️  No previous report found. Run analysis first.');
    return;
  }

  const previousReport: BundleReport = JSON.parse(readFileSync(REPORT_FILE, 'utf-8'));
  const currentReport = generateReport();

  console.log('\n📊 Bundle Size Comparison:\n');
  console.log(`Previous: ${previousReport.timestamp}`);
  console.log(`Current:  ${currentReport.timestamp}`);
  // Would compare actual sizes here
}

function main(): void {
  const args = process.argv.slice(2);
  const shouldCompare = args.includes('--compare');

  if (shouldCompare) {
    compareReports();
  } else {
    runBundleAnalysis();
    const report = generateReport();
    saveReport(report);
  }
}

if (require.main === module) {
  main();
}
