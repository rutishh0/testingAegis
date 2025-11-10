export interface ApiUser {
  userId: string;
  username: string;
  publicKey: string;
}

export interface AuthPayload {
  token: string;
  userId: string;
  username: string;
  publicKey: string;
  encryptedPrivateKey: string;
}

export interface MessageRecord {
  messageId: string;
  senderId: string;
  recipientId: string;
  payloadRecipient: string;
  payloadAdmin: string;
  nonce: string;
  sentAt: string;
}

export interface PlainMessage {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  sentAt: Date;
  isPending?: boolean;
  error?: string;
}

export interface EncryptedPrivateKeyBundle {
  salt: string;
  nonce: string;
  ciphertext: string;
}

export interface SendMessageRequest {
  recipientId: string;
  payload_recipient: string;
  payload_admin: string;
  nonce: string;
}

