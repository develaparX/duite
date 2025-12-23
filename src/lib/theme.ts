/**
 * Theme configuration for the Finance Tracker application
 * Provides consistent styling and theme management
 */

export const theme = {
  colors: {
    // Primary brand colors for financial app
    primary: {
      50: 'hsl(210, 40%, 98%)',
      100: 'hsl(210, 40%, 96%)',
      500: 'hsl(221.2, 83.2%, 53.3%)',
      600: 'hsl(221.2, 83.2%, 48%)',
      900: 'hsl(222.2, 84%, 4.9%)',
    },
    // Financial status colors
    success: 'hsl(142, 76%, 36%)', // For positive balances, income
    warning: 'hsl(38, 92%, 50%)', // For pending items, warnings
    destructive: 'hsl(0, 84.2%, 60.2%)', // For debts, expenses, errors
    muted: 'hsl(210, 40%, 96%)', // For secondary text, backgrounds
  },
  
  // Consistent spacing scale
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  
  // Typography scale
  typography: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  },
  
  // Border radius scale
  radius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  },
  
  // Shadow scale
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },
} as const

export type Theme = typeof theme

/**
 * Utility function to get consistent financial status colors
 */
export const getFinancialStatusColor = (type: 'income' | 'expense' | 'debt' | 'receivable' | 'investment') => {
  switch (type) {
    case 'income':
    case 'receivable':
    case 'investment':
      return 'text-green-600 dark:text-green-400'
    case 'expense':
    case 'debt':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-muted-foreground'
  }
}

/**
 * Utility function to get consistent background colors for financial cards
 */
export const getFinancialCardBg = (type: 'income' | 'expense' | 'debt' | 'receivable' | 'investment') => {
  switch (type) {
    case 'income':
      return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
    case 'expense':
      return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
    case 'debt':
      return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
    case 'receivable':
      return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
    case 'investment':
      return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
    default:
      return 'bg-card border-border'
  }
}