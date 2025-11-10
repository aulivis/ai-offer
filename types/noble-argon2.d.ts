// Module declaration for @noble/hashes/argon2 (with and without .js extension)
declare module '@noble/hashes/argon2.js' {
  export interface Argon2Options {
    m: number;
    t: number;
    p: number;
    dkLen: number;
    version: number;
  }

  export function argon2dAsync(
    password: string | Uint8Array,
    salt: Uint8Array,
    options: Argon2Options,
  ): Promise<Uint8Array>;

  export function argon2iAsync(
    password: string | Uint8Array,
    salt: Uint8Array,
    options: Argon2Options,
  ): Promise<Uint8Array>;

  export function argon2idAsync(
    password: string | Uint8Array,
    salt: Uint8Array,
    options: Argon2Options,
  ): Promise<Uint8Array>;
}

// Also declare the path without .js for compatibility
declare module '@noble/hashes/argon2' {
  export * from '@noble/hashes/argon2.js';
}
