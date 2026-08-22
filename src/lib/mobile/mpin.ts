"use client";

import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

// Local, on-device quick-unlock only — the MPIN is never sent to Supabase or
// any server. It gates access to the web session that's already persisted
// in the WebView's own cookie jar; it isn't a second factor Supabase itself
// verifies. Hashed with a random per-device salt, both kept only in native
// secure storage (Android Keystore-backed via capacitor-secure-storage-plugin).

const HASH_KEY = "fh_mpin_hash";
const SALT_KEY = "fh_mpin_salt";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSaltHex(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

async function hashPin(pin: string, saltHex: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${saltHex}:${pin}`));
  return toHex(digest);
}

export async function hasMpin(): Promise<boolean> {
  try {
    await SecureStoragePlugin.get({ key: HASH_KEY });
    return true;
  } catch {
    return false;
  }
}

export async function setMpin(pin: string): Promise<void> {
  const salt = randomSaltHex();
  const hash = await hashPin(pin, salt);
  await SecureStoragePlugin.set({ key: SALT_KEY, value: salt });
  await SecureStoragePlugin.set({ key: HASH_KEY, value: hash });
}

export async function verifyMpin(pin: string): Promise<boolean> {
  try {
    const [{ value: salt }, { value: storedHash }] = await Promise.all([
      SecureStoragePlugin.get({ key: SALT_KEY }),
      SecureStoragePlugin.get({ key: HASH_KEY }),
    ]);
    const candidateHash = await hashPin(pin, salt);
    return candidateHash === storedHash;
  } catch {
    return false;
  }
}

export async function clearMpin(): Promise<void> {
  await Promise.allSettled([
    SecureStoragePlugin.remove({ key: HASH_KEY }),
    SecureStoragePlugin.remove({ key: SALT_KEY }),
  ]);
}
