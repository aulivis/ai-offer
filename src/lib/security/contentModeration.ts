/**
 * Content moderation utilities to detect and prevent malicious content,
 * prompt injection attacks, and inappropriate content before sending to OpenAI.
 *
 * This module implements multiple layers of security:
 * 1. Pattern-based detection for common prompt injection techniques
 * 2. Content validation for inappropriate/offensive material
 * 3. Length and structure validation to prevent abuse
 */

export type ModerationResult = {
  allowed: boolean;
  reason?: string;
  category?: 'prompt_injection' | 'inappropriate_content' | 'abuse' | 'length' | 'structure';
};

/**
 * Common prompt injection patterns that attempt to override system instructions
 */
const PROMPT_INJECTION_PATTERNS = [
  // Direct instruction overrides
  /\b(ignore|forget|disregard|skip)\s+(previous|above|all|system|instructions?|prompts?)/i,
  /\b(you\s+are|you're|act\s+as|pretend\s+to\s+be|roleplay\s+as)/i,
  /\b(new\s+instructions?|override|replace|change)\s+(system|instructions?|prompt)/i,

  // System prompt extraction attempts
  /\b(show|display|reveal|print|output|return)\s+(system|your|the)\s+(prompt|instructions?|system\s+message)/i,
  /\b(what\s+are|what's|tell\s+me)\s+(your|the)\s+(instructions?|prompt|system\s+message)/i,

  // Role manipulation
  /\b(you\s+must|you\s+should|you\s+will|you\s+have\s+to)\s+(ignore|forget|disregard)/i,
  /\b(do\s+not|don't|never)\s+(follow|obey|use|respect)\s+(the\s+)?(system|previous|above|original)/i,

  // Instruction injection markers
  /\[INST\]|\[\/INST\]|<<SYS>>|<<\/SYS>>|###\s*(instruction|system|prompt)/i,
  /\bBEGIN\s+(NEW|ALTERNATIVE)\s+INSTRUCTIONS?\b/i,
  /\bEND\s+(OF|PREVIOUS)\s+INSTRUCTIONS?\b/i,

  // Encoding attempts
  /\b(base64|hex|unicode|encode|decode)\s+(the\s+)?(system|instructions?|prompt)/i,

  // Jailbreak attempts
  /\b(jailbreak|bypass|hack|exploit)\s+(the\s+)?(system|security|filter|moderation)/i,

  // Context switching
  /\b(switch|change|alter)\s+(to|the|your)\s+(mode|role|persona|identity)/i,
  /\b(from\s+now\s+on|starting\s+now|beginning\s+now)\s+(you|ignore|forget)/i,
];

/**
 * Patterns indicating potentially inappropriate or harmful content
 */
const INAPPROPRIATE_CONTENT_PATTERNS = [
  // Explicit harmful instructions
  /\b(generate|create|write|make)\s+(malicious|harmful|illegal|unauthorized)/i,
  /\b(steal|hack|exploit|attack|breach|compromise)\s+(data|system|account|credentials)/i,

  // Privacy violations
  /\b(extract|collect|gather|harvest)\s+(personal|private|sensitive|confidential)\s+(data|information)/i,
  /\b(phishing|scam|fraud|deceptive)\s+(email|message|content)/i,

  // Content manipulation
  /\b(bypass|circumvent|avoid)\s+(security|filter|moderation|content\s+policy)/i,
];

/**
 * Maximum allowed length for individual fields to prevent abuse
 */
const MAX_FIELD_LENGTHS = {
  title: 200,
  overview: 5000,
  deliverables: 3000,
  timeline: 3000,
  constraints: 3000,
  deadline: 100,
  testimonial: 1000,
  schedule: 1000,
  guarantee: 1000,
} as const;

/**
 * Maximum total content length across all fields
 */
const MAX_TOTAL_CONTENT_LENGTH = 15000;

/**
 * Check if text contains prompt injection patterns
 */
function detectPromptInjection(text: string): boolean {
  const normalized = text.toLowerCase().trim();

  // Check against known patterns
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  // Check for suspicious instruction-like structures
  const instructionMarkers = [
    /instruction\s*[:=]/i,
    /prompt\s*[:=]/i,
    /system\s*[:=]/i,
    /command\s*[:=]/i,
  ];

  // If text starts with instruction markers, it's suspicious
  const firstLine = normalized.split('\n')[0]?.trim() || '';
  for (const marker of instructionMarkers) {
    if (marker.test(firstLine) && firstLine.length < 100) {
      return true;
    }
  }

  return false;
}

/**
 * Check if text contains inappropriate content patterns
 */
function detectInappropriateContent(text: string): boolean {
  const normalized = text.toLowerCase().trim();

  for (const pattern of INAPPROPRIATE_CONTENT_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if text contains abuse patterns
 */
function detectAbusePatterns(text: string): boolean {
  // Check for excessive repetition
  // Check for same character repeated 50+ times
  if (/(.)\1{50,}/.test(text)) {
    return true;
  }

  // Check for short pattern repetition (1-20 chars repeated 10+ times)
  const shortPatternRegex = /(.{1,20})\1{10,}/;
  if (shortPatternRegex.test(text)) {
    return true;
  }

  // Check for excessive whitespace or newlines
  if (/\n{20,}/.test(text) || /\s{100,}/.test(text)) {
    return true;
  }

  return false;
}

/**
 * Validate field length
 */
function validateFieldLength(field: string, fieldName: keyof typeof MAX_FIELD_LENGTHS): boolean {
  const maxLength = MAX_FIELD_LENGTHS[fieldName];
  return field.length <= maxLength;
}

/**
 * Moderate a single text field
 */
export function moderateContent(
  text: string | undefined | null,
  fieldName: keyof typeof MAX_FIELD_LENGTHS = 'overview',
): ModerationResult {
  if (!text || typeof text !== 'string') {
    return { allowed: true };
  }

  const trimmed = text.trim();

  // Check length
  if (!validateFieldLength(trimmed, fieldName)) {
    return {
      allowed: false,
      reason: `A mező túl hosszú. Maximum ${MAX_FIELD_LENGTHS[fieldName]} karakter engedélyezett.`,
      category: 'length',
    };
  }

  // Check for prompt injection
  if (detectPromptInjection(trimmed)) {
    return {
      allowed: false,
      reason:
        'A tartalom nem megfelelő formátumú vagy potenciálisan káros. Kérjük, módosítsd a szöveget.',
      category: 'prompt_injection',
    };
  }

  // Check for inappropriate content
  if (detectInappropriateContent(trimmed)) {
    return {
      allowed: false,
      reason: 'A tartalom nem megfelelő vagy nem megengedett. Kérjük, módosítsd a szöveget.',
      category: 'inappropriate_content',
    };
  }

  // Check for abuse patterns
  if (detectAbusePatterns(trimmed)) {
    return {
      allowed: false,
      reason: 'A tartalom nem megfelelő formátumú. Kérjük, módosítsd a szöveget.',
      category: 'abuse',
    };
  }

  return { allowed: true };
}

/**
 * Moderate project details object
 */
export function moderateProjectDetails(details: {
  overview?: string | undefined;
  deliverables?: string | undefined;
  timeline?: string | undefined;
  constraints?: string | undefined;
}): ModerationResult {
  const fields: Array<[keyof typeof MAX_FIELD_LENGTHS, string | undefined]> = [
    ['overview', details.overview],
    ['deliverables', details.deliverables],
    ['timeline', details.timeline],
    ['constraints', details.constraints],
  ];

  // Check each field
  for (const [fieldName, value] of fields) {
    if (value) {
      const result = moderateContent(value, fieldName);
      if (!result.allowed) {
        return result;
      }
    }
  }

  // Check total content length
  const totalLength = Object.values(details).reduce(
    (sum, val) => sum + (typeof val === 'string' ? val.length : 0),
    0,
  );

  if (totalLength > MAX_TOTAL_CONTENT_LENGTH) {
    return {
      allowed: false,
      reason: `A teljes tartalom túl hosszú. Maximum ${MAX_TOTAL_CONTENT_LENGTH} karakter engedélyezett.`,
      category: 'length',
    };
  }

  // Check combined content for prompt injection (context-aware)
  const combinedText = Object.values(details)
    .filter((v): v is string => typeof v === 'string')
    .join('\n\n');

  if (combinedText && detectPromptInjection(combinedText)) {
    return {
      allowed: false,
      reason:
        'A tartalom nem megfelelő formátumú vagy potenciálisan káros. Kérjük, módosítsd a szöveget.',
      category: 'prompt_injection',
    };
  }

  return { allowed: true };
}

/**
 * Moderate an array of strings (e.g., testimonials, schedule items)
 */
export function moderateStringArray(
  items: string[] | undefined | null,
  fieldName: keyof typeof MAX_FIELD_LENGTHS = 'testimonial',
): ModerationResult {
  if (!items || !Array.isArray(items)) {
    return { allowed: true };
  }

  // Check each item
  for (const item of items) {
    if (typeof item === 'string') {
      const result = moderateContent(item, fieldName);
      if (!result.allowed) {
        return result;
      }
    }
  }

  // Check combined content for patterns
  const combined = items.filter((v): v is string => typeof v === 'string').join('\n');
  if (combined && detectPromptInjection(combined)) {
    return {
      allowed: false,
      reason:
        'A tartalom nem megfelelő formátumú vagy potenciálisan káros. Kérjük, módosítsd a szöveget.',
      category: 'prompt_injection',
    };
  }

  return { allowed: true };
}

/**
 * Moderate all user input before sending to OpenAI
 */
export function moderateUserInput(input: {
  title: string;
  projectDetails: {
    overview?: string | undefined;
    deliverables?: string | undefined;
    timeline?: string | undefined;
    constraints?: string | undefined;
  };
  deadline?: string | undefined;
  testimonials?: string[] | undefined;
  schedule?: string[] | undefined;
  guarantees?: string[] | undefined;
}): ModerationResult {
  // Moderate title
  const titleResult = moderateContent(input.title, 'title');
  if (!titleResult.allowed) {
    return titleResult;
  }

  // Moderate project details
  const detailsResult = moderateProjectDetails(input.projectDetails);
  if (!detailsResult.allowed) {
    return detailsResult;
  }

  // Moderate deadline
  if (input.deadline) {
    const deadlineResult = moderateContent(input.deadline, 'deadline');
    if (!deadlineResult.allowed) {
      return deadlineResult;
    }
  }

  // Moderate testimonials
  if (input.testimonials) {
    const testimonialsResult = moderateStringArray(input.testimonials, 'testimonial');
    if (!testimonialsResult.allowed) {
      return testimonialsResult;
    }
  }

  // Moderate schedule
  if (input.schedule) {
    const scheduleResult = moderateStringArray(input.schedule, 'schedule');
    if (!scheduleResult.allowed) {
      return scheduleResult;
    }
  }

  // Moderate guarantees
  if (input.guarantees) {
    const guaranteesResult = moderateStringArray(input.guarantees, 'guarantee');
    if (!guaranteesResult.allowed) {
      return guaranteesResult;
    }
  }

  // Final combined check across all fields
  const allText = [
    input.title,
    input.projectDetails.overview ?? '',
    input.projectDetails.deliverables ?? '',
    input.projectDetails.timeline ?? '',
    input.projectDetails.constraints ?? '',
    input.deadline ?? '',
    ...(input.testimonials || []),
    ...(input.schedule || []),
    ...(input.guarantees || []),
  ]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join('\n\n');

  if (allText && detectPromptInjection(allText)) {
    return {
      allowed: false,
      reason:
        'A tartalom nem megfelelő formátumú vagy potenciálisan káros. Kérjük, módosítsd a szöveget.',
      category: 'prompt_injection',
    };
  }

  return { allowed: true };
}
