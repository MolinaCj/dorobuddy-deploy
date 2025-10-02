// src/lib/error-handler.ts - Centralized error handling utilities

/**
 * Application error types
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  NETWORK = 'NETWORK_ERROR',
  SERVER = 'SERVER_ERROR',
  DATABASE = 'DATABASE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  SPOTIFY = 'SPOTIFY_ERROR',
  ENCRYPTION = 'ENCRYPTION_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly details?: any
  public readonly timestamp: Date

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode: number = 500,
    details?: any
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date()

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.VALIDATION, 400, details)
    this.name = 'ValidationError'
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, ErrorType.AUTHENTICATION, 401, details)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(message, ErrorType.AUTHORIZATION, 403, details)
    this.name = 'AuthorizationError'
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, ErrorType.NOT_FOUND, 404, details)
    this.name = 'NotFoundError'
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, ErrorType.RATE_LIMIT, 429, details)
    this.name = 'RateLimitError'
  }
}

/**
 * Network error
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed', details?: any) {
    super(message, ErrorType.NETWORK, 0, details)
    this.name = 'NetworkError'
  }
}

/**
 * Server error
 */
export class ServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, ErrorType.SERVER, 500, details)
    this.name = 'ServerError'
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, ErrorType.DATABASE, 500, details)
    this.name = 'DatabaseError'
  }
}

/**
 * Spotify integration error
 */
export class SpotifyError extends AppError {
  constructor(message: string = 'Spotify integration error', details?: any) {
    super(message, ErrorType.SPOTIFY, 500, details)
    this.name = 'SpotifyError'
  }
}

/**
 * Encryption error
 */
export class EncryptionError extends AppError {
  constructor(message: string = 'Encryption operation failed', details?: any) {
    super(message, ErrorType.ENCRYPTION, 500, details)
    this.name = 'EncryptionError'
  }
}

/**
 * Error logger interface
 */
interface ErrorLogger {
  log(error: Error, context?: any): void
}

/**
 * Console error logger
 */
export class ConsoleErrorLogger implements ErrorLogger {
  log(error: Error, context?: any): void {
    console.group(`🚨 ${error.name}`)
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    
    if (error instanceof AppError) {
      console.error('Type:', error.type)
      console.error('Status Code:', error.statusCode)
      console.error('Timestamp:', error.timestamp.toISOString())
      if (error.details) {
        console.error('Details:', error.details)
      }
    }
    
    if (context) {
      console.error('Context:', context)
    }
    
    console.groupEnd()
  }
}

/**
 * Remote error logger (for production)
 */
export class RemoteErrorLogger implements ErrorLogger {
  private endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  async log(error: Error, context?: any): Promise<void> {
    try {
      const errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        context,
        ...(error instanceof AppError && {
          type: error.type,
          statusCode: error.statusCode,
          details: error.details,
        }),
      }

      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      })
    } catch (logError) {
      console.error('Failed to log error remotely:', logError)
      // Fallback to console logging
      new ConsoleErrorLogger().log(error, context)
    }
  }
}

/**
 * Error handler class
 */
export class ErrorHandler {
  private logger: ErrorLogger
  private isDevelopment: boolean

  constructor(logger?: ErrorLogger) {
    this.logger = logger || new ConsoleErrorLogger()
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  /**
   * Handle and log errors
   */
  handle(error: Error, context?: any): void {
    // Log the error
    this.logger.log(error, context)

    // In development, also show user-friendly notifications
    if (this.isDevelopment && typeof window !== 'undefined') {
      this.showErrorNotification(error)
    }
  }

  /**
   * Show user-friendly error notification
   */
  private showErrorNotification(error: Error): void {
    // This could integrate with a toast notification system
    const message = this.getUserFriendlyMessage(error)
    console.warn('User Error:', message)
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  getUserFriendlyMessage(error: Error): string {
    if (error instanceof ValidationError) {
      return error.message // Validation messages are usually user-friendly
    }

    if (error instanceof AuthenticationError) {
      return 'Please log in to continue'
    }

    if (error instanceof AuthorizationError) {
      return "You don't have permission to perform this action"
    }

    if (error instanceof NotFoundError) {
      return 'The requested item could not be found'
    }

    if (error instanceof RateLimitError) {
      return 'Too many requests. Please try again later'
    }

    if (error instanceof NetworkError) {
      return 'Network connection failed. Please check your internet connection'
    }

    if (error instanceof SpotifyError) {
      return 'Spotify integration error. Please try reconnecting'
    }

    if (error instanceof DatabaseError) {
      return 'Database error. Please try again'
    }

    // Generic fallback
    return 'An unexpected error occurred. Please try again'
  }

  /**
   * Create error response for API routes
   */
  createErrorResponse(error: Error): {
    success: false
    error: {
      message: string
      type?: ErrorType
      details?: any
    }
    statusCode: number
  } {
    const userMessage = this.getUserFriendlyMessage(error)
    
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          message: this.isDevelopment ? error.message : userMessage,
          type: error.type,
          ...(this.isDevelopment && { details: error.details })
        },
        statusCode: error.statusCode
      }
    }

    return {
      success: false,
      error: {
        message: this.isDevelopment ? error.message : 'An unexpected error occurred',
        type: ErrorType.UNKNOWN,
        ...(this.isDevelopment && { details: error.stack })
      },
      statusCode: 500
    }
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler()

/**
 * Utility function to wrap async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      errorHandler.handle(error as Error, { context, args })
      throw error
    }
  }
}

/**
 * Utility function to safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json)
  } catch (error) {
    errorHandler.handle(
      new ValidationError('Invalid JSON format'),
      { json: json.substring(0, 100) }
    )
    return defaultValue
  }
}

/**
 * Utility function to safely execute functions
 */
export function safeExecute<T>(
  fn: () => T,
  defaultValue: T,
  context?: string
): T {
  try {
    return fn()
  } catch (error) {
    errorHandler.handle(error as Error, { context })
    return defaultValue
  }
}

/**
 * HTTP status code to error type mapping
 */
export function getErrorTypeFromStatusCode(statusCode: number): ErrorType {
  switch (statusCode) {
    case 400:
      return ErrorType.VALIDATION
    case 401:
      return ErrorType.AUTHENTICATION
    case 403:
      return ErrorType.AUTHORIZATION
    case 404:
      return ErrorType.NOT_FOUND
    case 429:
      return ErrorType.RATE_LIMIT
    case 500:
      return ErrorType.SERVER
    default:
      return ErrorType.UNKNOWN
  }
}

/**
 * Create an AppError from a fetch response
 */
export async function createErrorFromResponse(response: Response): Promise<AppError> {
  const errorType = getErrorTypeFromStatusCode(response.status)
  
  try {
    const errorData = await response.json()
    return new AppError(
      errorData.message || errorData.error || 'HTTP request failed',
      errorType,
      response.status,
      errorData
    )
  } catch {
    return new AppError(
      `HTTP ${response.status} - ${response.statusText}`,
      errorType,
      response.status
    )
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context?: string
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain error types
      if (error instanceof AuthenticationError || 
          error instanceof AuthorizationError ||
          error instanceof ValidationError) {
        throw error
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        errorHandler.handle(lastError, { 
          context: `${context} - Final attempt failed`,
          attempt,
          maxRetries
        })
        throw lastError
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      
      errorHandler.handle(lastError, { 
        context: `${context} - Attempt ${attempt + 1} failed, retrying in ${delay}ms`,
        attempt,
        maxRetries
      })
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}