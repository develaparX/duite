import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, generateToken, verifyToken } from '@/lib/auth'

describe('Authentication System', () => {
  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should verify correct passwords', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect passwords', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Management', () => {
    it('should generate valid JWT tokens', () => {
      const payload = { userId: 1, email: 'test@example.com' }
      const token = generateToken(payload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should verify valid tokens', () => {
      const payload = { userId: 1, email: 'test@example.com' }
      const token = generateToken(payload)
      
      const verified = verifyToken(token)
      expect(verified).toBeDefined()
      expect(verified?.userId).toBe(payload.userId)
      expect(verified?.email).toBe(payload.email)
    })

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here'
      
      const verified = verifyToken(invalidToken)
      expect(verified).toBeNull()
    })
  })
})