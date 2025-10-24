import { randomBytes, timingSafeEqual } from 'node:crypto';

const ARGON_MODULE_ID = ['@node-rs', 'argon2'].join('/');
const NOBLE_ARGON_MODULE_ID = ['@noble', 'hashes', 'argon2'].join('/');

export enum Argon2Algorithm {
  Argon2d = 0,
  Argon2i = 1,
  Argon2id = 2,
}

export enum Argon2Version {
  V0x10 = 0,
  V0x13 = 1,
}

export type Argon2Options = {
  memoryCost?: number;
  timeCost?: number;
  outputLen?: number;
  parallelism?: number;
  algorithm?: Argon2Algorithm;
  version?: Argon2Version;
  secret?: Uint8Array;
  salt?: Uint8Array;
};

type Argon2Module = {
  hash: (
    password: string | Uint8Array,
    options?: Argon2Options | null,
    abortSignal?: AbortSignal | null,
  ) => Promise<string>;
  verify: (
    hashed: string | Uint8Array,
    password: string | Uint8Array,
    options?: Argon2Options | null,
    abortSignal?: AbortSignal | null,
  ) => Promise<boolean>;
};

const ARGON2_NAMES: Record<Argon2Algorithm, 'argon2d' | 'argon2i' | 'argon2id'> = {
  [Argon2Algorithm.Argon2d]: 'argon2d',
  [Argon2Algorithm.Argon2i]: 'argon2i',
  [Argon2Algorithm.Argon2id]: 'argon2id',
};

type NobleArgon2Module = typeof import('@noble/hashes/argon2');
type FallbackVariant = (typeof ARGON2_NAMES)[Argon2Algorithm];
type FallbackCompute = (
  password: string | Uint8Array,
  salt: Uint8Array,
  options: { m: number; t: number; p: number; dkLen: number; version: number },
) => Promise<Uint8Array>;

const FALLBACK_FUNC_NAMES: Record<FallbackVariant, `argon2${'d' | 'i' | 'id'}Async`> = {
  argon2d: 'argon2dAsync',
  argon2i: 'argon2iAsync',
  argon2id: 'argon2idAsync',
};

let nobleModulePromise: Promise<NobleArgon2Module | null> | null = null;
const fallbackComputeCache: Partial<Record<FallbackVariant, FallbackCompute>> = {};

function isFallbackVariant(value: string): value is FallbackVariant {
  return value in FALLBACK_FUNC_NAMES;
}

let nativeModulePromise: Promise<Argon2Module | null> | null = null;

async function loadNativeModule(): Promise<Argon2Module | null> {
  if (!nativeModulePromise) {
    const dynamicImport = new Function('specifier', 'return import(specifier);') as (
      specifier: string,
    ) => Promise<Argon2Module>;
    nativeModulePromise = dynamicImport(ARGON_MODULE_ID).catch(() => null);
  }

  return nativeModulePromise;
}

async function loadNobleModule(): Promise<NobleArgon2Module | null> {
  if (!nobleModulePromise) {
    const dynamicImport = new Function('specifier', 'return import(specifier);') as (
      specifier: string,
    ) => Promise<NobleArgon2Module>;
    nobleModulePromise = dynamicImport(NOBLE_ARGON_MODULE_ID).catch(() => null);
  }

  return nobleModulePromise;
}

async function getFallbackCompute(variant: FallbackVariant): Promise<FallbackCompute> {
  const cached = fallbackComputeCache[variant];
  if (cached) {
    return cached;
  }

  const noble = await loadNobleModule();
  if (!noble) {
    throw new Error(
      "Missing optional dependency '@noble/hashes'. Install it to enable the Argon2 fallback implementation.",
    );
  }

  const funcName = FALLBACK_FUNC_NAMES[variant];
  const compute = noble[funcName as keyof NobleArgon2Module];
  if (typeof compute !== 'function') {
    throw new Error(`Argon2 fallback function '${funcName}' is not available.`);
  }

  const callable = compute as FallbackCompute;
  fallbackComputeCache[variant] = callable;
  return callable;
}

function toBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64'));
}

function resolveVersion(option?: Argon2Version): number {
  if (option === Argon2Version.V0x10) {
    return 0x10;
  }

  return 0x13;
}

type ParsedPhc = {
  algorithm: FallbackVariant;
  version: number;
  memoryCost: number;
  timeCost: number;
  parallelism: number;
  salt: Uint8Array;
  hash: Uint8Array;
};

function parsePhcString(value: string | Uint8Array): ParsedPhc {
  const text = typeof value === 'string' ? value : Buffer.from(value).toString('utf8');

  if (!text.startsWith('$')) {
    throw new Error('Invalid Argon2 hash format.');
  }

  const parts = text.split('$');
  if (parts.length < 5) {
    throw new Error('Invalid Argon2 hash format.');
  }

  const algorithm = parts[1];
  if (!algorithm || !isFallbackVariant(algorithm)) {
    throw new Error(`Unsupported Argon2 algorithm: ${algorithm}`);
  }

  let index = 2;
  let version = 0x13;
  if (parts[index]?.startsWith('v=')) {
    const versionValue = Number.parseInt(parts[index].slice(2), 10);
    if (Number.isFinite(versionValue)) {
      version = versionValue;
    }
    index += 1;
  }

  const paramsSegment = parts[index] ?? '';
  index += 1;

  const saltSegment = parts[index];
  const hashSegment = parts[index + 1];
  if (!saltSegment || !hashSegment) {
    throw new Error('Invalid Argon2 hash format.');
  }

  const params = new Map<string, string>();
  for (const param of paramsSegment.split(',')) {
    if (!param) {
      continue;
    }
    const [key, rawValue = ''] = param.split('=');
    if (key) {
      params.set(key, rawValue);
    }
  }

  const memoryCost = Number.parseInt(params.get('m') ?? '', 10);
  const timeCost = Number.parseInt(params.get('t') ?? '', 10);
  const parallelism = Number.parseInt(params.get('p') ?? '', 10);

  if (!Number.isFinite(memoryCost) || !Number.isFinite(timeCost) || !Number.isFinite(parallelism)) {
    throw new Error('Invalid Argon2 parameters.');
  }

  return {
    algorithm,
    version,
    memoryCost,
    timeCost,
    parallelism,
    salt: fromBase64(saltSegment),
    hash: fromBase64(hashSegment),
  };
}

function getFallbackOptions(options?: Argon2Options) {
  return {
    algorithm: options?.algorithm ?? Argon2Algorithm.Argon2id,
    memoryCost: options?.memoryCost ?? 4096,
    timeCost: options?.timeCost ?? 3,
    parallelism: options?.parallelism ?? 1,
    outputLen: options?.outputLen ?? 32,
    version: resolveVersion(options?.version),
    salt: options?.salt ?? randomBytes(16),
  };
}

async function fallbackHash(password: string | Uint8Array, options?: Argon2Options): Promise<string> {
  const fallback = getFallbackOptions(options);
  const variant = ARGON2_NAMES[fallback.algorithm];
  const compute = await getFallbackCompute(variant);

  const digest = await compute(password, fallback.salt, {
    m: fallback.memoryCost,
    t: fallback.timeCost,
    p: fallback.parallelism,
    dkLen: fallback.outputLen,
    version: fallback.version,
  });

  const versionLabel = fallback.version === 0x10 ? '16' : '19';
  const paramSegment = `m=${fallback.memoryCost},t=${fallback.timeCost},p=${fallback.parallelism}`;
  return `$${variant}$v=${versionLabel}$${paramSegment}$${toBase64(fallback.salt)}$${toBase64(digest)}`;
}

async function fallbackVerify(
  hashed: string | Uint8Array,
  password: string | Uint8Array,
): Promise<boolean> {
  const parsed = parsePhcString(hashed);
  const compute = await getFallbackCompute(parsed.algorithm);

  const digest = await compute(password, parsed.salt, {
    m: parsed.memoryCost,
    t: parsed.timeCost,
    p: parsed.parallelism,
    dkLen: parsed.hash.length,
    version: parsed.version,
  });

  const expected = Buffer.from(parsed.hash);
  const received = Buffer.from(digest);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export async function argon2Hash(
  password: string | Uint8Array,
  options?: Argon2Options,
  abortSignal?: AbortSignal | null,
): Promise<string> {
  const native = await loadNativeModule();
  if (native) {
    return native.hash(password, options, abortSignal ?? undefined);
  }

  return fallbackHash(password, options);
}

export async function argon2Verify(
  hashed: string | Uint8Array,
  password: string | Uint8Array,
  options?: Argon2Options,
  abortSignal?: AbortSignal | null,
): Promise<boolean> {
  const native = await loadNativeModule();
  if (native) {
    return native.verify(hashed, password, options, abortSignal ?? undefined);
  }

  try {
    return await fallbackVerify(hashed, password);
  } catch (error) {
    console.error('Failed to verify Argon2 hash using fallback implementation.', error);
    return false;
  }
}
