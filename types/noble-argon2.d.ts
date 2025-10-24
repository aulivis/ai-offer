declare module '@noble/hashes/argon2' {
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
