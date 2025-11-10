import argon2 from 'argon2-browser';
import {
  boxDecryptFromBase64,
  boxEncryptToBase64,
  decodeBase64,
  encodeBase64,
  generateKeyPair,
  generateNonce,
  nacl,
  randomBytes,
} from '@shared/crypto';
import type { EncryptedPrivateKeyBundle } from '../types';

export async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const hashResult = await argon2.hash({
    pass: password,
    salt,
    type: argon2.ArgonType.Argon2id,
    hashLen: 32,
    time: 3,
    mem: 1 << 16,
    parallelism: 1,
    raw: true,
  });

  const hashBuffer = hashResult.hash as ArrayBuffer;
  return new Uint8Array(hashBuffer);
}

export function generateUserKeyPair() {
  return generateKeyPair();
}

export interface EncryptedPrivateKeyPayload {
  bundle: EncryptedPrivateKeyBundle;
  encoded: string;
}

export async function encryptPrivateKey(secretKey: Uint8Array, password: string): Promise<EncryptedPrivateKeyPayload> {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  const nonce = randomBytes(nacl.secretbox.nonceLength);

  const ciphertext = nacl.secretbox(secretKey, nonce, key);

  const bundle: EncryptedPrivateKeyBundle = {
    salt: encodeBase64(salt),
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
  };

  const encoded = btoa(JSON.stringify(bundle));

  return { bundle, encoded };
}

export async function decryptPrivateKey(encodedBundle: string, password: string): Promise<Uint8Array | null> {
  try {
    const decodedJson = atob(encodedBundle);
    const bundle = JSON.parse(decodedJson) as EncryptedPrivateKeyBundle;

    const salt = decodeBase64(bundle.salt);
    const nonce = decodeBase64(bundle.nonce);
    const ciphertext = decodeBase64(bundle.ciphertext);

    const key = await deriveKey(password, salt);
    const decrypted = nacl.secretbox.open(ciphertext, nonce, key);

    if (!decrypted) {
      return null;
    }

    return new Uint8Array(decrypted);
  } catch (error) {
    console.error('Failed to decrypt private key:', error);
    return null;
  }
}

export interface EncryptedMessageResult {
  payloadRecipient: string;
  payloadAdmin: string;
  nonce: string;
  nonceBytes: Uint8Array;
}

export function encryptMessage(
  message: string,
  senderSecretKey: Uint8Array,
  recipientPublicKeyBase64: string,
  adminPublicKeyBase64: string
): EncryptedMessageResult {
  const nonce = generateNonce();

  return {
    payloadRecipient: boxEncryptToBase64(message, nonce, recipientPublicKeyBase64, senderSecretKey),
    payloadAdmin: boxEncryptToBase64(message, nonce, adminPublicKeyBase64, senderSecretKey),
    nonce: encodeBase64(nonce),
    nonceBytes: nonce,
  };
}

export function decryptMessage(
  payloadBase64: string,
  nonceBase64: string,
  senderPublicKeyBase64: string,
  recipientSecretKey: Uint8Array
): string | null {
  return boxDecryptFromBase64(payloadBase64, nonceBase64, senderPublicKeyBase64, recipientSecretKey);
}

