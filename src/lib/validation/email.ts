/**
 * Email validation utilities
 * RFC 5321 compliant email validation (max 254 characters for email address)
 */

// RFC 5321 compliant email regex (simplified but effective)
// This regex allows most valid email formats while rejecting obviously invalid ones
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const MAX_EMAIL_LENGTH = 254; // RFC 5321 maximum email length

/**
 * Validates an email address format
 * @param email - The email address to validate
 * @returns true if the email format is valid, false otherwise
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  // Check for basic structure (must contain @)
  if (!trimmed.includes('@')) {
    return false;
  }

  // Split into local and domain parts
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;

  // Local part cannot be empty and should be reasonable length
  if (!localPart || localPart.length === 0 || localPart.length > 64) {
    return false;
  }

  // Domain part cannot be empty
  if (!domainPart || domainPart.length === 0 || domainPart.length > 253) {
    return false;
  }

  // Check for valid characters using regex
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Normalizes an email address (trim, lowercase)
 * @param email - The email address to normalize
 * @returns Normalized email or empty string if invalid
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}

/**
 * Validates and normalizes an email address
 * @param email - The email address to validate and normalize
 * @returns Normalized email if valid, null otherwise
 */
export function validateAndNormalizeEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized || !isValidEmailFormat(normalized)) {
    return null;
  }
  return normalized;
}



