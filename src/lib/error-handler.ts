/**
 * Standard error response format from the API
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  public readonly code: string
  public readonly details?: Record<string, any>
  public readonly status?: number

  constructor(error: ApiError, status?: number) {
    super(error.message)
    this.name = 'ApiException'
    this.code = error.code
    this.details = error.details
    this.status = status
  }
}

/**
 * Network error class for connection issues
 */
export class NetworkException extends Error {
  constructor(message = 'Network error occurred') {
    super(message)
    this.name = 'NetworkException'
  }
}

/**
 * Validation error class for form validation
 */
export class ValidationException extends Error {
  public readonly errors: Record<string, string[]>

  constructor(errors: Record<string, string[]>) {
    const message = Object.values(errors).flat().join(', ')
    super(message)
    this.name = 'ValidationException'
    this.errors = errors
  }
}

/**
 * Parse API response and throw appropriate error if not successful
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: any
    
    try {
      errorData = await response.json()
    } catch {
      // If we can't parse the response, create a generic error
      throw new ApiException({
        code: 'UNKNOWN_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`
      }, response.status)
    }

    // Handle validation errors
    if (response.status === 400 && errorData.errors) {
      throw new ValidationException(errorData.errors)
    }

    // Handle API errors
    if (errorData.error) {
      throw new ApiException(errorData.error, response.status)
    }

    // Fallback error
    throw new ApiException({
      code: 'HTTP_ERROR',
      message: errorData.message || `HTTP ${response.status}: ${response.statusText}`
    }, response.status)
  }

  try {
    return await response.json()
  } catch {
    // If response is successful but not JSON, return empty object
    return {} as T
  }
}

/**
 * Make authenticated API request with error handling
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    return await handleApiResponse<T>(response)
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkException('Unable to connect to the server. Please check your internet connection.')
    }
    throw error
  }
}

/**
 * Get user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    return error.message
  }
  
  if (error instanceof NetworkException) {
    return error.message
  }
  
  if (error instanceof ValidationException) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

/**
 * Check if error is a specific type
 */
export function isApiError(error: unknown): error is ApiException {
  return error instanceof ApiException
}

export function isNetworkError(error: unknown): error is NetworkException {
  return error instanceof NetworkException
}

export function isValidationError(error: unknown): error is ValidationException {
  return error instanceof ValidationException
}

/**
 * Check if error indicates authentication failure
 */
export function isAuthError(error: unknown): boolean {
  return isApiError(error) && (error.status === 401 || error.status === 403)
}