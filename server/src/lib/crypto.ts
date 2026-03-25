/**
 * Integrations Vault — AES-256-GCM Encryption
 *
 * Every encrypted value is stored as:   iv:authTag:ciphertext   (all base64)
 *
 * - 12-byte random IV per encryption (NIST recommendation for GCM)
 * - 16-byte authentication tag (GCM integrity guarantee)
 * - Master key sourced from INTEGRATIONS_ENCRYPTION_KEY env var (64-char hex = 32 bytes)
 *
 * IMPORTANT: Rotate the master key by re-encrypting all rows — never share it.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // bytes — NIST-recommended for GCM
const AUTH_TAG_LENGTH = 16; // bytes

function getMasterKey(): Buffer {
  const hex = env.INTEGRATIONS_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'INTEGRATIONS_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns "iv:authTag:ciphertext" (all base64-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

/**
 * Decrypt a value previously produced by encrypt().
 * Expects "iv:authTag:ciphertext" (all base64-encoded).
 */
export function decrypt(encryptedValue: string): string {
  const parts = encryptedValue.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value format — expected iv:authTag:ciphertext');
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const key = getMasterKey();
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
