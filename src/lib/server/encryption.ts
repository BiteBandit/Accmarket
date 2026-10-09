import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_VERSION = 1;      // Changed from "v1" to integer 1
const SCHEMA_VERSION = 1;   // Changed from "1.0" to integer 1

function getEncryptionKey(): Buffer {
  const secret = process.env.VAULT_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("Missing VAULT_ENCRYPTION_KEY environment variable.");
  }
  const keyBuffer = Buffer.from(secret, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("VAULT_ENCRYPTION_KEY must be a 32-byte hex string (64 hex characters).");
  }
  return keyBuffer;
}

export interface EncryptedPayloadResult {
  encrypted_payload: string; // base64
  encryption_nonce: string;  // base64
  encryption_auth_tag: string; // base64
  encryption_key_version: number;
  payload_schema_version: number;
}

export function encryptCredentials(payload: Record<string, any>): EncryptedPayloadResult {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonString = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(jsonString, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted_payload: encrypted.toString("base64"),
    encryption_nonce: iv.toString("base64"),
    encryption_auth_tag: authTag.toString("base64"),
    encryption_key_version: KEY_VERSION,
    payload_schema_version: SCHEMA_VERSION,
  };
}
