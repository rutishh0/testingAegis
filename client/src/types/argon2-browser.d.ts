declare module 'argon2-browser' {
  export enum ArgonType {
    Argon2d = 0,
    Argon2i = 1,
    Argon2id = 2,
  }

  export interface HashParams {
    pass: string | Uint8Array;
    salt: string | Uint8Array;
    hashLen?: number;
    time?: number;
    mem?: number;
    parallelism?: number;
    type?: ArgonType;
    raw?: boolean;
  }

  export interface HashResult {
    encoded: string;
    hash?: ArrayBuffer;
  }

  export function hash(params: HashParams): Promise<HashResult>;

  const argon2: {
    hash: typeof hash;
    ArgonType: typeof ArgonType;
  };

  export default argon2;
}

