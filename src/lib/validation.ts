/**
 * Validation utilities for form inputs and data integrity
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface FieldValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate email format
 */
export function validateEmail(email: string): FieldValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }

  return { isValid: true }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): FieldValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' }
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' }
  }

  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' }
  }

  return { isValid: true }
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName: string): FieldValidationResult {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  return { isValid: true }
}

/**
 * Validate monetary amount
 */
export function validateAmount(amount: string, fieldName = 'Amount'): FieldValidationResult {
  if (!amount) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  const numericAmount = parseFloat(amount)
  
  if (isNaN(numericAmount)) {
    return { isValid: false, error: `${fieldName} must be a valid number` }
  }

  if (numericAmount <= 0) {
    return { isValid: false, error: `${fieldName} must be greater than zero` }
  }

  if (numericAmount > 999999999.99) {
    return { isValid: false, error: `${fieldName} cannot exceed $999,999,999.99` }
  }

  // Check for more than 2 decimal places
  const decimalPlaces = (amount.split('.')[1] || '').length
  if (decimalPlaces > 2) {
    return { isValid: false, error: `${fieldName} cannot have more than 2 decimal places` }
  }

  return { isValid: true }
}

/**
 * Validate date format and range
 */
export function validateDate(date: string, fieldName = 'Date'): FieldValidationResult {
  if (!date) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  const dateObj = new Date(date)
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: `${fieldName} must be a valid date` }
  }

  // Check if date is not too far in the past (more than 10 years)
  const tenYearsAgo = new Date()
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
  
  if (dateObj < tenYearsAgo) {
    return { isValid: false, error: `${fieldName} cannot be more than 10 years in the past` }
  }

  // Check if date is not too far in the future (more than 10 years)
  const tenYearsFromNow = new Date()
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10)
  
  if (dateObj > tenYearsFromNow) {
    return { isValid: false, error: `${fieldName} cannot be more than 10 years in the future` }
  }

  return { isValid: true }
}

/**
 * Validate due date (must be in the future)
 */
export function validateDueDate(date: string, fieldName = 'Due date'): FieldValidationResult {
  const basicValidation = validateDate(date, fieldName)
  if (!basicValidation.isValid) {
    return basicValidation
  }

  const dateObj = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day

  if (dateObj < today) {
    return { isValid: false, error: `${fieldName} must be today or in the future` }
  }

  return { isValid: true }
}

/**
 * Validate transaction date (cannot be in the future)
 */
export function validateTransactionDate(date: string, fieldName = 'Transaction date'): FieldValidationResult {
  const basicValidation = validateDate(date, fieldName)
  if (!basicValidation.isValid) {
    return basicValidation
  }

  const dateObj = new Date(date)
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today

  if (dateObj > today) {
    return { isValid: false, error: `${fieldName} cannot be in the future` }
  }

  return { isValid: true }
}

/**
 * Validate description length and content
 */
export function validateDescription(description: string, fieldName = 'Description'): FieldValidationResult {
  if (!description || description.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  if (description.trim().length < 3) {
    return { isValid: false, error: `${fieldName} must be at least 3 characters long` }
  }

  if (description.length > 500) {
    return { isValid: false, error: `${fieldName} cannot exceed 500 characters` }
  }

  return { isValid: true }
}

/**
 * Validate name fields (creditor, debtor, account name, etc.)
 */
export function validateName(name: string, fieldName: string): FieldValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` }
  }

  if (name.length > 255) {
    return { isValid: false, error: `${fieldName} cannot exceed 255 characters` }
  }

  return { isValid: true }
}

/**
 * Validate full name
 */
export function validateFullName(fullName: string): FieldValidationResult {
  const basicValidation = validateName(fullName, 'Full name')
  if (!basicValidation.isValid) {
    return basicValidation
  }

  // Check if it contains at least first and last name
  const nameParts = fullName.trim().split(/\s+/)
  if (nameParts.length < 2) {
    return { isValid: false, error: 'Please enter both first and last name' }
  }

  return { isValid: true }
}

/**
 * Validate investment account type
 */
export function validateAccountType(accountType: string): FieldValidationResult {
  const validTypes = ['401k', 'ira', 'roth-ira', 'brokerage', 'savings', 'checking', 'other']
  
  if (accountType && !validTypes.includes(accountType.toLowerCase())) {
    return { isValid: false, error: 'Please select a valid account type' }
  }

  return { isValid: true }
}

/**
 * Validate transaction type
 */
export function validateTransactionType(type: string): FieldValidationResult {
  const validTypes = ['income', 'expense', 'debt', 'receivable']
  
  if (!type) {
    return { isValid: false, error: 'Transaction type is required' }
  }

  if (!validTypes.includes(type.toLowerCase())) {
    return { isValid: false, error: 'Please select a valid transaction type' }
  }

  return { isValid: true }
}

/**
 * Validate category name
 */
export function validateCategory(category: string): FieldValidationResult {
  if (!category) {
    return { isValid: true } // Category is optional
  }

  if (category.length > 100) {
    return { isValid: false, error: 'Category cannot exceed 100 characters' }
  }

  return { isValid: true }
}

/**
 * Comprehensive form validation
 */
export function validateForm(fields: Record<string, any>, rules: Record<string, (value: any) => FieldValidationResult>): ValidationResult {
  const errors: string[] = []

  for (const [fieldName, validator] of Object.entries(rules)) {
    const fieldValue = fields[fieldName]
    const result = validator(fieldValue)
    
    if (!result.isValid && result.error) {
      errors.push(result.error)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Format amount for display
 */
export function formatAmount(amount: string | number): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numericAmount)) {
    return '0.00'
  }

  return numericAmount.toFixed(2)
}

/**
 * Parse amount from user input
 */
export function parseAmount(input: string): number {
  if (!input) return 0
  
  // Remove currency symbols and commas
  const cleaned = input.replace(/[$,]/g, '')
  const parsed = parseFloat(cleaned)
  
  return isNaN(parsed) ? 0 : parsed
}