import { boxDecryptFromBase64 } from '@shared/crypto';
import { useAdminContext } from '../state/AdminContext';

export function useAdminDecryption() {
  const { adminSecretKey } = useAdminContext();

  return {
    canDecrypt: Boolean(adminSecretKey),
    decryptPayload: (payloadBase64: string, nonceBase64: string, senderPublicKey: string) => {
      if (!adminSecretKey) return null;
      return boxDecryptFromBase64(payloadBase64, nonceBase64, senderPublicKey, adminSecretKey);
    },
  };
}

