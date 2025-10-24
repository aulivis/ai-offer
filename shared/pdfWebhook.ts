const DEFAULT_PROTOCOL = 'https:';
const SUPPORTED_PROTOCOLS = new Set(['https:', 'http:']);

export type PdfWebhookValidationReason =
  | 'invalid_url'
  | 'protocol_not_allowed'
  | 'credentials_not_allowed'
  | 'host_not_allowlisted'
  | 'allowlist_empty';

export class PdfWebhookValidationError extends Error {
  readonly reason: PdfWebhookValidationReason;

  constructor(message: string, reason: PdfWebhookValidationReason) {
    super(message);
    this.name = 'PdfWebhookValidationError';
    this.reason = reason;
  }
}

export type PdfWebhookAllowlistEntry = {
  hostname: string;
  protocol: string;
  port: string;
  allowSubdomains: boolean;
};

function defaultPortFor(protocol: string): string {
  if (protocol === 'https:') return '443';
  if (protocol === 'http:') return '80';
  return '';
}

function normalizeHostname(value: string): string {
  return value.trim().toLowerCase();
}

export function splitAllowlist(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function createPdfWebhookAllowlist(values: string[]): PdfWebhookAllowlistEntry[] {
  const entries: PdfWebhookAllowlistEntry[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;

    let allowSubdomains = false;
    let raw = trimmed;

    if (raw.startsWith('*.')) {
      allowSubdomains = true;
      raw = raw.slice(2);
    } else if (raw.startsWith('.')) {
      allowSubdomains = true;
      raw = raw.slice(1);
    }

    let explicitProtocol = false;
    if (!raw.includes('://')) {
      raw = `${DEFAULT_PROTOCOL}//${raw}`;
    } else {
      explicitProtocol = true;
    }

    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      continue;
    }

    if (!parsed.hostname) {
      continue;
    }

    const protocol = explicitProtocol ? parsed.protocol : DEFAULT_PROTOCOL;
    if (!SUPPORTED_PROTOCOLS.has(protocol)) {
      continue;
    }

    const hostname = normalizeHostname(parsed.hostname);
    const port = parsed.port || defaultPortFor(protocol);

    entries.push({ hostname, protocol, port, allowSubdomains });
  }

  return entries;
}

function hostMatches(entry: PdfWebhookAllowlistEntry, hostname: string): boolean {
  if (entry.allowSubdomains) {
    return hostname === entry.hostname || hostname.endsWith(`.${entry.hostname}`);
  }
  return hostname === entry.hostname;
}

export function isPdfWebhookUrlAllowed(
  url: string | URL,
  allowlist: PdfWebhookAllowlistEntry[],
): boolean {
  if (!allowlist.length) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = typeof url === 'string' ? new URL(url) : url;
  } catch {
    return false;
  }

  if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
    return false;
  }

  if (parsed.username || parsed.password) {
    return false;
  }

  const hostname = normalizeHostname(parsed.hostname);
  const port = parsed.port || defaultPortFor(parsed.protocol);

  return allowlist.some(
    (entry) =>
      entry.protocol === parsed.protocol && entry.port === port && hostMatches(entry, hostname),
  );
}

export function validatePdfWebhookUrl(raw: string, allowlist: PdfWebhookAllowlistEntry[]): string {
  const value = raw.trim();
  if (!value) {
    throw new PdfWebhookValidationError('Webhook URL must not be empty.', 'invalid_url');
  }

  if (!allowlist.length) {
    throw new PdfWebhookValidationError('Webhook callbacks are disabled.', 'allowlist_empty');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new PdfWebhookValidationError('Webhook URL must be an absolute URL.', 'invalid_url');
  }

  if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
    throw new PdfWebhookValidationError(
      'Webhook URL must use HTTP or HTTPS.',
      'protocol_not_allowed',
    );
  }

  if (parsed.username || parsed.password) {
    throw new PdfWebhookValidationError(
      'Webhook URL must not include credentials.',
      'credentials_not_allowed',
    );
  }

  parsed.hash = '';

  const hostname = normalizeHostname(parsed.hostname);
  const port = parsed.port || defaultPortFor(parsed.protocol);

  const allowed = allowlist.some(
    (entry) =>
      entry.protocol === parsed.protocol && entry.port === port && hostMatches(entry, hostname),
  );

  if (!allowed) {
    throw new PdfWebhookValidationError(
      'Webhook URL is not on the allow-list.',
      'host_not_allowlisted',
    );
  }

  return parsed.toString();
}
