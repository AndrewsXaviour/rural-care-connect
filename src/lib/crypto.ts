/**
 * Aadhaar encryption utility using Web Crypto API (AES-256-GCM).
 *
 * SEC3 fix: Aadhaar numbers must be encrypted before storage in Supabase
 * and localStorage per Indian IT Act / Aadhaar Act requirements.
 *
 * Encryption key is derived from VITE_AADHAAR_ENCRYPTION_KEY env var.
 * A SHA-256 hash is also stored for lookups without exposing plaintext.
 */

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

const ENCRYPTION_KEY_ENV = import.meta.env.VITE_AADHAAR_ENCRYPTION_KEY || "";

/**
 * Derive an AES-256-GCM CryptoKey from the hex-encoded env var.
 * The env var must be a 32-character hex string (64 hex chars = 32 bytes).
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  if (!ENCRYPTION_KEY_ENV || !/^[0-9a-f]{64}$/i.test(ENCRYPTION_KEY_ENV)) {
    throw new Error(
      "VITE_AADHAAR_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  // Take first 32 bytes from the hex key
  const keyBytes = new Uint8Array(
    ENCRYPTION_KEY_ENV.slice(0, 64).match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

// ---------------------------------------------------------------------------
// Encryption / Decryption
// ---------------------------------------------------------------------------

export interface EncryptedAadhaar {
  /** AES-256-GCM encrypted Aadhaar, base64-encoded */
  encrypted: string;
  /** 12-byte random IV used for encryption, base64-encoded */
  iv: string;
}

/**
 * Encrypt an Aadhaar number using AES-256-GCM.
 * Returns the encrypted value and IV, both base64-encoded.
 */
export async function encryptAadhaar(aadhaar: string): Promise<EncryptedAadhaar> {
  if (!aadhaar || aadhaar.trim().length === 0) {
    throw new Error("Aadhaar number is required for encryption");
  }

  // Validate Aadhaar format (12 digits)
  const cleaned = aadhaar.replace(/\s/g, "");
  if (!/^\d{12}$/.test(cleaned)) {
    throw new Error("Aadhaar must be exactly 12 digits");
  }

  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoder = new TextEncoder();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(cleaned)
  );

  return {
    encrypted: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypt an encrypted Aadhaar back to plaintext.
 */
export async function decryptAadhaar(encryptedAadhaar: EncryptedAadhaar): Promise<string> {
  const key = await getEncryptionKey();
  const iv = base64ToBuffer(encryptedAadhaar.iv);
  const encryptedData = base64ToBuffer(encryptedAadhaar.encrypted);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// ---------------------------------------------------------------------------
// Hashing (for lookups without exposing plaintext)
// ---------------------------------------------------------------------------

/**
 * Create a SHA-256 hash of an Aadhaar number for indexed lookups.
 * The hash is salted with a static app-specific salt.
 */
export async function hashAadhaar(aadhaar: string): Promise<string> {
  const cleaned = aadhaar.replace(/\s/g, "");
  const salted = `ruralcare-aadhaar-${cleaned}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(salted));
  return bufferToBase64(hashBuffer);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
