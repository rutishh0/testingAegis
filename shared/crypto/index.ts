import nacl from 'tweetnacl';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function hasBuffer(): boolean {
  return typeof Buffer !== 'undefined';
}

export function encodeBase64(data: Uint8Array): string {
  if (hasBuffer()) {
    return Buffer.from(data).toString('base64');
  }

  let binary = '';
  data.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function decodeBase64(value: string): Uint8Array {
  if (hasBuffer()) {
    return new Uint8Array(Buffer.from(value, 'base64'));
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function stringToUint8(value: string): Uint8Array {
  return textEncoder.encode(value);
}

export function uint8ToString(data: Uint8Array): string {
  return textDecoder.decode(data);
}

export function randomBytes(length: number): Uint8Array {
  return nacl.randomBytes(length);
}

export function generateNonce(): Uint8Array {
  return randomBytes(nacl.box.nonceLength);
}

export function generateKeyPair() {
  return nacl.box.keyPair();
}

export function boxEncryptToBase64(
  message: string,
  nonce: Uint8Array,
  recipientPublicKeyBase64: string,
  senderSecretKey: Uint8Array
): string {
  const messageBytes = stringToUint8(message);
  const recipientPublicKey = decodeBase64(recipientPublicKeyBase64);
  const cipher = nacl.box(messageBytes, nonce, recipientPublicKey, senderSecretKey);
  return encodeBase64(cipher);
}

export function boxDecryptFromBase64(
  payloadBase64: string,
  nonceBase64: string,
  senderPublicKeyBase64: string,
  recipientSecretKey: Uint8Array
): string | null {
  try {
    const payload = decodeBase64(payloadBase64);
    const nonce = decodeBase64(nonceBase64);
    const senderPublicKey = decodeBase64(senderPublicKeyBase64);

    const decrypted = nacl.box.open(payload, nonce, senderPublicKey, recipientSecretKey);
    if (!decrypted) {
      return null;
    }

    return uint8ToString(new Uint8Array(decrypted));
  } catch (error) {
    console.error('Failed to decrypt payload:', error);
    return null;
  }
}

export { nacl };

