/**
 * Template Versioning System
 *
 * Provides versioning and preview capabilities for offer templates.
 * Allows templates to be versioned, previewed, and rolled back.
 */

import type { TemplateId } from './templates/types';

export interface TemplateVersion {
  id: string;
  templateId: TemplateId;
  version: string; // Semantic version: major.minor.patch
  content: string; // Template HTML/content
  changelog?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

export interface TemplatePreview {
  id: string;
  templateId: TemplateId;
  versionId: string;
  previewHtml: string;
  sampleData: Record<string, unknown>;
  createdAt: string;
}

/**
 * Parse semantic version string
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

/**
 * Compare two versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);

  if (parsed1.major !== parsed2.major) {
    return parsed1.major > parsed2.major ? 1 : -1;
  }
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor > parsed2.minor ? 1 : -1;
  }
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch > parsed2.patch ? 1 : -1;
  }
  return 0;
}

/**
 * Get next version number based on change type
 */
export function getNextVersion(
  currentVersion: string,
  changeType: 'major' | 'minor' | 'patch',
): string {
  const parsed = parseVersion(currentVersion);

  switch (changeType) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }
}

/**
 * Validate version string format
 */
export function isValidVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
}

/**
 * Get active version for a template
 */
export function getActiveVersion(versions: TemplateVersion[]): TemplateVersion | undefined {
  return versions.find((v) => v.isActive);
}

/**
 * Get latest version (by version number, not date)
 */
export function getLatestVersion(versions: TemplateVersion[]): TemplateVersion | undefined {
  if (versions.length === 0) return undefined;

  return versions.reduce((latest, current) => {
    if (compareVersions(current.version, latest.version) > 0) {
      return current;
    }
    return latest;
  });
}

/**
 * Create a new template version
 */
export function createTemplateVersion(
  templateId: TemplateId,
  content: string,
  currentVersions: TemplateVersion[],
  changeType: 'major' | 'minor' | 'patch' = 'patch',
  changelog?: string,
): TemplateVersion {
  const latestVersion = getLatestVersion(currentVersions);
  const baseVersion = latestVersion?.version || '1.0.0';
  const nextVersion = getNextVersion(baseVersion, changeType);

  // Deactivate all previous versions (for future use)
  const _updatedVersions = currentVersions.map((v) => ({ ...v, isActive: false }));

  return {
    id: `version-${Date.now()}`,
    templateId,
    version: nextVersion,
    content,
    changelog,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Rollback to a specific version
 */
export function rollbackToVersion(
  versions: TemplateVersion[],
  targetVersionId: string,
): TemplateVersion[] {
  return versions.map((version) => ({
    ...version,
    isActive: version.id === targetVersionId,
  }));
}
