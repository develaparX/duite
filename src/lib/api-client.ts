import { apiRequest } from './error-handler'
import type { Transaction } from '@/db/schema'

/**
 * Centralized API client for all backend communication
 */
export class ApiClient {
  private token: string | null = null

  constructor(token?: string) {
    this.token = token || null
  }

  setToken(token: string | null) {
    this.token = token
  }

  getToken(): string | null {
    return this.token
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    return apiRequest<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(email: string, password: string, fullName: string) {
    return apiRequest<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    })
  }

  async logout() {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    }, this.token || undefined)
  }

  async getCurrentUser() {
    return apiRequest<{ user: any }>('/api/auth/me', {
      method: 'GET',
    }, this.token || undefined)
  }

  // Dashboard endpoints
  async getDashboardData() {
    return apiRequest<{
      summary: any;
      recentTransactions: Transaction[];
      monthlyTrends: any;
    }>('/api/dashboard', {
      method: 'GET',
    }, this.token || undefined)
  }

  // Transaction endpoints
  async getTransactions(filters?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    
    const url = `/api/transactions${params.toString() ? `?${params.toString()}` : ''}`
    return apiRequest<{ transactions: Transaction[] }>(url, {
      method: 'GET',
    }, this.token || undefined)
  }

  async createTransaction(transaction: {
    type: string;
    amount: string;
    description: string;
    category?: string;
    transactionDate: string;
    relatedParty?: string;
    dueDate?: string;
  }) {
    return apiRequest<{ transaction: Transaction }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    }, this.token || undefined)
  }

  async updateTransaction(id: number, updates: Partial<Transaction>) {
    return apiRequest<{ transaction: Transaction }>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, this.token || undefined)
  }

  async deleteTransaction(id: number) {
    return apiRequest(`/api/transactions/${id}`, {
      method: 'DELETE',
    }, this.token || undefined)
  }

  // Income endpoints
  async getIncome(filters?: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    
    const url = `/api/income${params.toString() ? `?${params.toString()}` : ''}`
    return apiRequest<{ income: Transaction[] }>(url, {
      method: 'GET',
    }, this.token || undefined)
  }

  async getIncomeSources() {
    return apiRequest<{ sources: string[] }>('/api/income/sources', {
      method: 'GET',
    }, this.token || undefined)
  }

  async getIncomeTrends() {
    return apiRequest<{ trends: any[] }>('/api/income/trends', {
      method: 'GET',
    }, this.token || undefined)
  }

  // Debt endpoints
  async getDebts() {
    return apiRequest<{ debts: Transaction[] }>('/api/debts', {
      method: 'GET',
    }, this.token || undefined)
  }

  async createDebt(debt: {
    amount: string;
    description: string;
    creditor: string;
    dueDate: string;
    transactionDate?: string;
  }) {
    return apiRequest<{ debt: Transaction }>('/api/debts', {
      method: 'POST',
      body: JSON.stringify(debt),
    }, this.token || undefined)
  }

  async settleDebt(id: number) {
    return apiRequest(`/api/debts/${id}/settle`, {
      method: 'POST',
    }, this.token || undefined)
  }

  // Receivable endpoints
  async getReceivables() {
    return apiRequest<{ receivables: Transaction[] }>('/api/receivables', {
      method: 'GET',
    }, this.token || undefined)
  }

  async createReceivable(receivable: {
    amount: string;
    description: string;
    debtor: string;
    expectedDate: string;
    transactionDate?: string;
  }) {
    return apiRequest<{ receivable: Transaction }>('/api/receivables', {
      method: 'POST',
      body: JSON.stringify(receivable),
    }, this.token || undefined)
  }

  async collectReceivable(id: number) {
    return apiRequest(`/api/receivables/${id}/collect`, {
      method: 'POST',
    }, this.token || undefined)
  }

  async getDebtsReceivablesSummary() {
    return apiRequest<{
      summary: any;
      overdue: any;
    }>('/api/debts-receivables/summary', {
      method: 'GET',
    }, this.token || undefined)
  }

  // Investment endpoints
  async getInvestments() {
    return apiRequest<{ investments: any[] }>('/api/investments', {
      method: 'GET',
    }, this.token || undefined)
  }

  async createInvestmentBalance(investment: {
    accountName: string;
    balance: string;
    accountType?: string;
    notes?: string;
  }) {
    return apiRequest<{ investment: any }>('/api/investments', {
      method: 'POST',
      body: JSON.stringify(investment),
    }, this.token || undefined)
  }

  async updateInvestmentBalance(id: number, updates: {
    balance: string;
    notes?: string;
  }) {
    return apiRequest<{ investment: any }>(`/api/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, this.token || undefined)
  }

  async getInvestmentHistory(accountName?: string) {
    const params = new URLSearchParams()
    if (accountName) params.append('accountName', accountName)
    
    const url = `/api/investments/history${params.toString() ? `?${params.toString()}` : ''}`
    return apiRequest<{ history: any[] }>(url, {
      method: 'GET',
    }, this.token || undefined)
  }

  async getInvestmentAccounts() {
    return apiRequest<{ accounts: string[] }>('/api/investments/accounts', {
      method: 'GET',
    }, this.token || undefined)
  }

  async getInvestmentSummary() {
    return apiRequest<{ summary: any }>('/api/investments/summary', {
      method: 'GET',
    }, this.token || undefined)
  }
}

// Create a singleton instance
export const apiClient = new ApiClient()

// Hook to get API client with current auth token
export function useApiClient() {
  // Get token from localStorage, handle SSR gracefully
  try {
    const token = localStorage.getItem('auth_token')
    if (token && apiClient.getToken() !== token) {
      apiClient.setToken(token)
    }
  } catch (e) {
    // localStorage not available (SSR, private browsing, etc.)
  }
  
  return apiClient
}