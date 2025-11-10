export interface AdminUser {
  userId: string;
  username: string;
  publicKey: string;
}

export interface AdminMessage {
  messageId: string;
  senderId: string;
  senderUsername: string;
  senderPublicKey: string;
  recipientId: string;
  recipientUsername: string;
  recipientPublicKey: string;
  payloadRecipient: string;
  payloadAdmin: string;
  nonce: string;
  sentAt: string;
  plaintext?: string;
  error?: string;
}

