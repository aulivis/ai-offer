import { randomBytes, timingSafeEqual } from 'node:crypto';

// Static import reference to ensure Next.js includes @noble/hashes in the bundle
// This import is conditionally used and helps Next.js statically analyze and bundle the module
// The actual usage is lazy-loaded to handle cases where the module might not be available
let nobleArgon2StaticImport: typeof import('@noble/hashes/argon2.js') | null = null;
try {
  // This static import ensures Next.js includes the module in the serverless bundle
  // We use a try-catch because the module might not be available in all environments
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  nobleArgon2StaticImport = require('@noble/hashes/argon2.js');
} catch {
  // Module not available at module load time, will use dynamic import at runtime
}

const ARGON_MODULE_ID = ['@node-rs', 'argon2'].join('/');

// Type definition for @noble/hashes/argon2 module
// Use the .js extension version as that's what's exported in package.json
type NobleArgon2Module = typeof import('@noble/hashes/argon2.js');

// Create a reference to the module path that Next.js can statically analyze
// This helps ensure the module is included in the serverless bundle
// We use a function that references the module path without actually importing it
const NOBLE_ARGON2_MODULE_PATH = '@noble/hashes/argon2.js' as const;
const NOBLE_ARGON2_MODULE_PATH_ALT = '@noble/hashes/argon2' as const;

// Module cache for the noble argon2 implementation
let nobleModuleStatic: NobleArgon2Module | null = null;
let nobleModuleLoadAttempted = false;

// Static import reference to ensure Next.js includes the module in the bundle
// This is a function that references the module without importing it at module load time
// Next.js will statically analyze this and include the module in the bundle
function getNobleArgon2ModulePath(): string {
  // This function ensures Next.js can statically analyze the module path
  return '@noble/hashes/argon2.js';
}

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
    nativeModulePromise = (async () => {
      try {
        // Use direct dynamic import - works better in serverless environments
        // Next.js will properly bundle this at build time
        const importedModule = await import(ARGON_MODULE_ID);
        return importedModule as Argon2Module;
      } catch {
        // Native module not available - this is expected in some environments
        return null;
      }
    })();
  }

  return nativeModulePromise;
}

async function loadNobleModule(): Promise<NobleArgon2Module | null> {
  // Return cached module if available
  if (nobleModuleStatic) {
    return nobleModuleStatic;
  }

  if (!nobleModulePromise) {
    nobleModulePromise = (async () => {
      // Strategy 1: Try using the static import if available (loaded at module initialization)
      if (nobleArgon2StaticImport) {
        if (
          nobleArgon2StaticImport &&
          typeof nobleArgon2StaticImport.argon2idAsync === 'function' &&
          typeof nobleArgon2StaticImport.argon2iAsync === 'function' &&
          typeof nobleArgon2StaticImport.argon2dAsync === 'function'
        ) {
          nobleModuleStatic = nobleArgon2StaticImport as NobleArgon2Module;
          return nobleModuleStatic;
        }
      }

      // Strategy 2: Try using require() at runtime (works better in some serverless environments)
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const requiredModule = require(getNobleArgon2ModulePath()) as NobleArgon2Module;
        if (
          requiredModule &&
          typeof requiredModule.argon2idAsync === 'function' &&
          typeof requiredModule.argon2iAsync === 'function' &&
          typeof requiredModule.argon2dAsync === 'function'
        ) {
          nobleModuleStatic = requiredModule;
          return nobleModuleStatic;
        }
      } catch {
        // require() failed, try dynamic import
      }

      // Strategy 3: Try the primary export path with dynamic import (@noble/hashes/argon2.js)
      // This is the officially supported subpath according to package.json exports
      try {
        // Use the constant to ensure Next.js can statically analyze the import
        // Dynamic import with string literal should work in serverless environments
        const importedModule = await import(NOBLE_ARGON2_MODULE_PATH);

        // Verify the module exports the required functions
        if (
          importedModule &&
          typeof importedModule.argon2idAsync === 'function' &&
          typeof importedModule.argon2iAsync === 'function' &&
          typeof importedModule.argon2dAsync === 'function'
        ) {
          nobleModuleStatic = importedModule as NobleArgon2Module;
          return nobleModuleStatic;
        }
      } catch (error) {
        // Log detailed error in development for debugging
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Argon2] Failed to load @noble/hashes/argon2.js:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      }

      // Strategy 4: Try alternative path without .js extension
      // Some bundlers/resolvers might resolve this differently
      if (!nobleModuleStatic && !nobleModuleLoadAttempted) {
        nobleModuleLoadAttempted = true;
        try {
          const importedModule = await import(NOBLE_ARGON2_MODULE_PATH_ALT);
          if (
            importedModule &&
            typeof importedModule.argon2idAsync === 'function' &&
            typeof importedModule.argon2iAsync === 'function' &&
            typeof importedModule.argon2dAsync === 'function'
          ) {
            nobleModuleStatic = importedModule as NobleArgon2Module;
            return nobleModuleStatic;
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.debug('[Argon2] Failed to load @noble/hashes/argon2:', {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      // All import strategies failed
      // This indicates the module is not available in the serverless environment
      const errorDetails = {
        attemptedPaths: [NOBLE_ARGON2_MODULE_PATH, NOBLE_ARGON2_MODULE_PATH_ALT],
        environment: process.env.NODE_ENV || 'unknown',
        nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown',
        platform: typeof process !== 'undefined' ? process.platform : 'unknown',
      };

      console.error(
        '[Argon2] Failed to load @noble/hashes/argon2 module from all attempted paths.',
        errorDetails,
      );

      // Provide helpful error message for debugging
      console.error(
        '[Argon2] This module is required as a fallback when @node-rs/argon2 is not available.',
      );
      console.error(
        '[Argon2] Ensure @noble/hashes is installed (npm list @noble/hashes) and not externalized in next.config.ts',
      );

      return null;
    })();
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
    // Don't throw error - instead, throw a more descriptive error that suggests checking @node-rs/argon2
    throw new Error(
      "Argon2 fallback implementation is not available. Please ensure '@node-rs/argon2' is properly installed, or install '@noble/hashes' for the fallback implementation.",
    );
  }

  const funcName = FALLBACK_FUNC_NAMES[variant];
  const compute = noble[funcName as keyof NobleArgon2Module];
  if (typeof compute !== 'function') {
    throw new Error(
      `Argon2 fallback function '${funcName}' is not available in @noble/hashes/argon2. Please ensure '@node-rs/argon2' is properly installed.`,
    );
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

async function fallbackHash(
  password: string | Uint8Array,
  options?: Argon2Options,
): Promise<string> {
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
