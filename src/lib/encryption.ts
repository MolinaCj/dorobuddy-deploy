// src/lib/encryption.ts - Client-side encryption utilities (FINAL FIXED VERSION)
'use client'

/**
 * Client-side encryption utilities for sensitive data
 * Uses Web Crypto API for secure encryption/decryption
 */

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 96, // 12 bytes for GCM
  tagLength: 128, // 16 bytes
} as const

/**
 * Convert Uint8Array to proper ArrayBuffer for Web Crypto API
 */
function toArrayBuffer(buffer: Uint8Array): ArrayBuffer {
  if (buffer.byteLength === buffer.buffer.byteLength) {
    return buffer.buffer as ArrayBuffer
  }
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

/**
 * Generate a cryptographic key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  // Derive key using PBKDF2
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Generate a random salt
 */
export function generateSalt(length: number = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

/**
 * Generate a random IV (Initialization Vector)
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength / 8))
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(
  data: string,
  key: CryptoKey,
  iv?: Uint8Array
): Promise<{
  encrypted: Uint8Array
  iv: Uint8Array
}> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  
  const usedIV = iv || generateIV()
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: toArrayBuffer(usedIV),
      tagLength: ENCRYPTION_CONFIG.tagLength
    },
    key,
    dataBuffer
  )
  
  return {
    encrypted: new Uint8Array(encrypted),
    iv: usedIV
  }
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(
  encryptedData: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: toArrayBuffer(iv),
      tagLength: ENCRYPTION_CONFIG.tagLength
    },
    key,
    toArrayBuffer(encryptedData)
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * Encrypt data with password (convenience function)
 */
export async function encryptWithPassword(
  data: string,
  password: string
): Promise<{
  encrypted: string // Base64 encoded
  salt: string // Base64 encoded
  iv: string // Base64 encoded
}> {
  const salt = generateSalt()
  const key = await deriveKeyFromPassword(password, salt)
  const { encrypted, iv } = await encryptData(data, key)
  
  return {
    encrypted: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv)
  }
}

/**
 * Decrypt data with password (convenience function)
 */
export async function decryptWithPassword(
  encryptedData: string,
  salt: string,
  iv: string,
  password: string
): Promise<string> {
  const saltBuffer = base64ToArrayBuffer(salt)
  const ivBuffer = base64ToArrayBuffer(iv)
  const encrypted = base64ToArrayBuffer(encryptedData)
  
  const key = await deriveKeyFromPassword(password, saltBuffer)
  return await decryptData(encrypted, key, ivBuffer)
}

/**
 * Hash data using SHA-256
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  return arrayBufferToBase64(new Uint8Array(hashBuffer))
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return arrayBufferToBase64(array)
}

/**
 * Utility: Convert ArrayBuffer to Base64
 */
export function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}

/**
 * Utility: Convert Base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const buffer = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i)
  }
  return buffer
}

/**
 * Secure data storage in localStorage with encryption
 * Note: In Claude artifacts, localStorage is not available, but this can be used externally
 */
export class SecureStorage {
  private password: string
  
  constructor(password: string) {
    this.password = password
  }
  
  async setItem(key: string, value: any): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      const encrypted = await encryptWithPassword(serialized, this.password)
      const storageData = JSON.stringify(encrypted)
      
      // Note: In artifacts, we can't use localStorage, so this would be for external use
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`encrypted_${key}`, storageData)
      }
    } catch (error) {
      console.error('Failed to encrypt and store data:', error)
      throw new Error('Failed to securely store data')
    }
  }
  
  async getItem<T>(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null
      }
      
      const storageData = localStorage.getItem(`encrypted_${key}`)
      if (!storageData) return null
      
      const encrypted = JSON.parse(storageData)
      const decrypted = await decryptWithPassword(
        encrypted.encrypted,
        encrypted.salt,
        encrypted.iv,
        this.password
      )
      
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Failed to decrypt stored data:', error)
      return null
    }
  }
  
  removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`encrypted_${key}`)
    }
  }
  
  clear(): void {
    if (typeof window === 'undefined' || !window.localStorage) return
    
    // Remove all encrypted items
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('encrypted_')) {
        localStorage.removeItem(key)
      }
    })
  }
}

/**
 * Create a secure storage instance
 */
export function createSecureStorage(password: string): SecureStorage {
  return new SecureStorage(password)
}

/**
 * Check if Web Crypto API is available
 */
export function isWebCryptoSupported(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues === 'function'
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Length check
  if (password.length >= 8) score += 1
  else feedback.push('Password should be at least 8 characters long')
  
  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Add uppercase letters')
  
  // Lowercase check
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Add lowercase letters')
  
  // Number check
  if (/\d/.test(password)) score += 1
  else feedback.push('Add numbers')
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  else feedback.push('Add special characters')
  
  // Length bonus
  if (password.length >= 12) score += 1
  
  return {
    isValid: score >= 3,
    score: Math.min(score, 5),
    feedback
  }
}

/**
 * Simple hash function for non-cryptographic purposes (faster than SHA-256)
 */
export function simpleHash(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  
  // Set version (4) and variant bits
  array[6] = (array[6] & 0x0f) | 0x40
  array[8] = (array[8] & 0x3f) | 0x80
  
  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-')
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Secure random password generator
 */
export function generateSecurePassword(
  length: number = 16,
  options: {
    uppercase?: boolean
    lowercase?: boolean
    numbers?: boolean
    symbols?: boolean
    excludeSimilar?: boolean
  } = {}
): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeSimilar = false
  } = options
  
  let charset = ''
  
  if (uppercase) {
    charset += excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  }
  
  if (lowercase) {
    charset += excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
  }
  
  if (numbers) {
    charset += excludeSimilar ? '23456789' : '0123456789'
  }
  
  if (symbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }
  
  if (!charset) {
    throw new Error('At least one character type must be enabled')
  }
  
  const password = new Array(length)
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  
  for (let i = 0; i < length; i++) {
    password[i] = charset[randomValues[i] % charset.length]
  }
  
  return password.join('')
}