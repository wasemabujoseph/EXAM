/**
 * Web Crypto API utilities for local encryption.
 */

const ITERATIONS = 100000;
const KEY_LEN = 256;
const ALGO = 'AES-GCM';

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGO, length: KEY_LEN } as AesDerivedKeyParams,
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: any, password: string): Promise<{ ciphertext: string; salt: string; iv: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(data));
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: ALGO, iv } as AesGcmParams,
    key,
    encodedData
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptData(ciphertext: string, salt: string, iv: string, password: string): Promise<any> {
  try {
    const saltArr = new Uint8Array(atob(salt).split('').map(c => c.charCodeAt(0)));
    const ivArr = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));
    const encryptedArr = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));
    
    const key = await deriveKey(password, saltArr);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGO, iv: ivArr } as AesGcmParams,
      key,
      encryptedArr
    );
    
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } catch (e) {
    throw new Error('Decryption failed. Incorrect password or corrupted data.');
  }
}
