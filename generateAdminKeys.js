/**
 * One-time utility to generate the admin key pair for Project "Aegis".
 *
 * Usage:
 *   node generateAdminKeys.js
 *
 * Notes:
 * - Run this script locally (never on production infrastructure).
 * - Store the ADMIN_SECRET_KEY securely and offline.
 * - Insert the ADMIN_PUBLIC_KEY into the admin_config table.
 */

const nacl = require('tweetnacl');

function generateAdminKeys() {
  const adminKeys = nacl.box.keyPair();

  const adminPublicKeyBase64 = Buffer.from(adminKeys.publicKey).toString('base64');
  const adminSecretKeyBase64 = Buffer.from(adminKeys.secretKey).toString('base64');

  console.log('ADMIN_PUBLIC_KEY:', adminPublicKeyBase64);
  console.log('ADMIN_SECRET_KEY:', adminSecretKeyBase64);
  console.log('\nIMPORTANT: Store ADMIN_SECRET_KEY securely and keep it offline.');
}

generateAdminKeys();

