import { safeStorage } from 'electron'

/**
 * CredentialManager - 安全地加密和解密敏感信息
 * 使用 Electron safeStorage API (Windows 上使用 DPAPI)
 */
export class CredentialManager {
  /**
   * 检查加密功能是否可用
   */
  isEncryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  /**
   * 加密明文字符串
   * @param plaintext 要加密的明文
   * @returns Base64 编码的加密字符串
   */
  encrypt(plaintext: string): string {
    if (!this.isEncryptionAvailable()) {
      console.warn('Encryption not available, storing as base64 (NOT SECURE)')
      // 降级处理：如果加密不可用，使用 base64（不安全，仅用于开发）
      return Buffer.from(plaintext).toString('base64')
    }

    try {
      const encrypted = safeStorage.encryptString(plaintext)
      return encrypted.toString('base64')
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * 解密加密的字符串
   * @param ciphertext Base64 编码的加密字符串
   * @returns 解密后的明文
   */
  decrypt(ciphertext: string): string {
    if (!this.isEncryptionAvailable()) {
      console.warn('Encryption not available, decoding from base64 (NOT SECURE)')
      // 降级处理：如果加密不可用，从 base64 解码
      return Buffer.from(ciphertext, 'base64').toString('utf-8')
    }

    try {
      const buffer = Buffer.from(ciphertext, 'base64')
      return safeStorage.decryptString(buffer)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * 批量加密对象中的敏感字段
   * @param obj 包含敏感字段的对象
   * @param fields 需要加密的字段名数组
   * @returns 加密后的对象
   */
  encryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
    const result = { ...obj }
    for (const field of fields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.encrypt(result[field] as string) as any
      }
    }
    return result
  }

  /**
   * 批量解密对象中的敏感字段
   * @param obj 包含加密字段的对象
   * @param fields 需要解密的字段名数组
   * @returns 解密后的对象
   */
  decryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
    const result = { ...obj }
    for (const field of fields) {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = this.decrypt(result[field] as string) as any
        } catch (error) {
          console.error(`Failed to decrypt field ${String(field)}:`, error)
          // 保持原值，可能是未加密的数据
        }
      }
    }
    return result
  }
}

// 导出单例实例
export const credentialManager = new CredentialManager()
