import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TransactionService } from '@/lib/transactions'
import type { NewTransaction } from '@/db/schema'

// Mock the database
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
}))

describe('Transaction Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Transaction Validation', () => {
    it('should validate required fields', async () => {
      const invalidTransaction: Partial<NewTransaction> = {
        userId: 1,
        type: 'expense',
        // Missing amount and description
      }

      await expect(
        TransactionService.create(invalidTransaction as NewTransaction)
      ).rejects.toThrow('Validation failed')
    })

    it('should validate positive amounts', async () => {
      const invalidTransaction: NewTransaction = {
        userId: 1,
        type: 'expense',
        amount: '-100.00',
        description: 'Test expense',
        transactionDate: '2024-01-01',
      }

      await expect(
        TransactionService.create(invalidTransaction)
      ).rejects.toThrow('Amount must be positive')
    })

    it('should validate transaction types', async () => {
      const invalidTransaction: NewTransaction = {
        userId: 1,
        type: 'invalid' as any,
        amount: '100.00',
        description: 'Test transaction',
        transactionDate: '2024-01-01',
      }

      await expect(
        TransactionService.create(invalidTransaction)
      ).rejects.toThrow('Invalid transaction type')
    })
  })

  describe('Transaction Creation', () => {
    it('should create valid expense transactions', async () => {
      const validExpense: NewTransaction = {
        userId: 1,
        type: 'expense',
        amount: '100.00',
        description: 'Test expense',
        transactionDate: '2024-01-01',
        category: 'Food',
      }

      // Mock successful database insertion
      const mockTransaction = { id: 1, ...validExpense }
      const { db } = await import('@/db')
      vi.mocked(db.returning).mockResolvedValue([mockTransaction])

      const result = await TransactionService.create(validExpense)
      expect(result).toEqual(mockTransaction)
    })

    it('should create valid income transactions', async () => {
      const validIncome: NewTransaction = {
        userId: 1,
        type: 'income',
        amount: '2000.00',
        description: 'Salary',
        transactionDate: '2024-01-01',
        category: 'Salary',
      }

      // Mock successful database insertion
      const mockTransaction = { id: 2, ...validIncome }
      const { db } = await import('@/db')
      vi.mocked(db.returning).mockResolvedValue([mockTransaction])

      const result = await TransactionService.create(validIncome)
      expect(result).toEqual(mockTransaction)
    })

    it('should create debt transactions with required fields', async () => {
      const validDebt: NewTransaction = {
        userId: 1,
        type: 'debt',
        amount: '500.00',
        description: 'Credit card debt',
        transactionDate: '2024-01-01',
        relatedParty: 'Bank of America',
        dueDate: '2024-02-01',
      }

      // Mock successful database insertion
      const mockTransaction = { id: 3, ...validDebt }
      const { db } = await import('@/db')
      vi.mocked(db.returning).mockResolvedValue([mockTransaction])

      const result = await TransactionService.create(validDebt)
      expect(result).toEqual(mockTransaction)
    })
  })

  describe('Transaction Filtering', () => {
    it('should filter transactions by type', async () => {
      const filters = { userId: 1, type: 'expense' as const }
      const mockTransactions = [
        { id: 1, type: 'expense', amount: '100.00', description: 'Test' }
      ]

      const { db } = await import('@/db')
      vi.mocked(db.limit).mockResolvedValue(mockTransactions)

      const result = await TransactionService.getFiltered(filters)
      expect(result).toEqual(mockTransactions)
    })

    it('should filter transactions by date range', async () => {
      const filters = {
        userId: 1,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      }
      const mockTransactions = [
        { id: 1, transactionDate: '2024-01-15', amount: '100.00', description: 'Test' }
      ]

      const { db } = await import('@/db')
      vi.mocked(db.limit).mockResolvedValue(mockTransactions)

      const result = await TransactionService.getFiltered(filters)
      expect(result).toEqual(mockTransactions)
    })
  })
})