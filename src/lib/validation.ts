// src/lib/validation.ts - Data validation utilities (CORRECTED VERSION)

import { ValidationError } from './error-handler'

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Field validation rules
 */
export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  url?: boolean
  numeric?: boolean
  integer?: boolean
  positive?: boolean
  custom?: (value: any) => string | null
}

/**
 * Schema validation interface
 */
export interface ValidationSchema {
  [key: string]: ValidationRule
}

/**
 * Base validator class
 */
export class Validator {
  /**
   * Check if email is valid
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Check if URL is valid
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if string is valid UUID
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove basic HTML chars
      .substring(0, 10000) // Limit length
  }

  /**
   * Validate a single field
   */
  static validateField(value: any, rule: ValidationRule, fieldName: string): string[] {
    const errors: string[] = []

    // Required check
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} is required`)
      return errors // Return early if required field is missing
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return errors
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${fieldName} must be at least ${rule.minLength} characters long`)
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${fieldName} must be no more than ${rule.maxLength} characters long`)
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${fieldName} format is invalid`)
      }

      if (rule.email && !this.isValidEmail(value)) {
        errors.push(`${fieldName} must be a valid email address`)
      }

      if (rule.url && !this.isValidUrl(value)) {
        errors.push(`${fieldName} must be a valid URL`)
      }
    }

    // Numeric validations
    if (rule.numeric || rule.integer || rule.positive) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value

      if (rule.numeric && (typeof numValue !== 'number' || isNaN(numValue))) {
        errors.push(`${fieldName} must be a number`)
        return errors
      }

      if (rule.integer && !Number.isInteger(numValue)) {
        errors.push(`${fieldName} must be an integer`)
      }

      if (rule.positive && numValue <= 0) {
        errors.push(`${fieldName} must be positive`)
      }

      if (rule.min !== undefined && numValue < rule.min) {
        errors.push(`${fieldName} must be at least ${rule.min}`)
      }

      if (rule.max !== undefined && numValue > rule.max) {
        errors.push(`${fieldName} must be no more than ${rule.max}`)
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) {
        errors.push(customError)
      }
    }

    return errors
  }

  /**
   * Validate an object against a schema
   */
  static validateSchema(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = []

    for (const [fieldName, rule] of Object.entries(schema)) {
      const fieldValue = data[fieldName]
      const fieldErrors = this.validateField(fieldValue, rule, fieldName)
      errors.push(...fieldErrors)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate and throw error if validation fails
   */
  static assertValid(data: any, schema: ValidationSchema): void {
    const result = this.validateSchema(data, schema)
    if (!result.isValid) {
      throw new ValidationError('Validation failed', {
        errors: result.errors,
        data
      })
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (password.length > 128) {
      errors.push('Password must be no more than 128 characters long')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', '12345678', 'welcome', 'admin', 'login'
    ]

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common, please choose a stronger password')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Predefined validation schemas
 */
export const ValidationSchemas = {
  // User registration
  userRegistration: {
    email: { 
      required: true, 
      email: true, 
      maxLength: 254 
    },
    password: { 
      required: true, 
      minLength: 8, 
      maxLength: 128,
      custom: (value: string) => {
        const result = Validator.validatePassword(value)
        return result.isValid ? null : result.errors[0]
      }
    },
    full_name: { 
      required: true, 
      minLength: 2, 
      maxLength: 100,
      custom: (value: string) => {
        if (!/^[a-zA-Z\s'-]+$/.test(value)) {
          return 'Full name can only contain letters, spaces, hyphens, and apostrophes'
        }
        return null
      }
    },
    username: { 
      required: false, 
      minLength: 3, 
      maxLength: 30,
      pattern: /^[a-zA-Z0-9_-]+$/,
      custom: (value: string) => {
        if (value && /^[0-9]/.test(value)) {
          return 'Username cannot start with a number'
        }
        return null
      }
    }
  },

  // User login
  userLogin: {
    email: { 
      required: true, 
      email: true 
    },
    password: { 
      required: true, 
      minLength: 1 
    }
  },

  // Task creation/update
  task: {
    title: { 
      required: true, 
      minLength: 1, 
      maxLength: 200 
    },
    description: { 
      required: false, 
      maxLength: 1000 
    },
    priority: { 
      required: false,
      custom: (value: string) => {
        const validPriorities = ['low', 'medium', 'high', 'urgent']
        if (value && !validPriorities.includes(value)) {
          return 'Priority must be one of: low, medium, high, urgent'
        }
        return null
      }
    },
    estimated_duration: { 
      required: false, 
      numeric: true, 
      positive: true, 
      max: 86400 // 24 hours in seconds
    },
    order_index: { 
      required: false, 
      integer: true, 
      min: 0 
    }
  },

  // Pomodoro session
  pomodoroSession: {
    task_id: { 
      required: false,
      custom: (value: string) => {
        if (value && !Validator.isValidUUID(value)) {
          return 'Task ID must be a valid UUID'
        }
        return null
      }
    },
    session_type: { 
      required: true,
      custom: (value: string) => {
        const validTypes = ['pomodoro', 'short_break', 'long_break']
        if (!validTypes.includes(value)) {
          return 'Session type must be one of: pomodoro, short_break, long_break'
        }
        return null
      }
    },
    planned_duration: { 
      required: true, 
      numeric: true, 
      positive: true,
      min: 60, // At least 1 minute
      max: 7200 // At most 2 hours
    },
    actual_duration: { 
      required: false, 
      numeric: true, 
      positive: true 
    },
    notes: { 
      required: false, 
      maxLength: 500 
    }
  },

  // User settings
  userSettings: {
    work_duration: { 
      required: true, 
      integer: true, 
      min: 300, // 5 minutes
      max: 7200 // 2 hours
    },
    short_break_duration: { 
      required: true, 
      integer: true, 
      min: 60, // 1 minute
      max: 1800 // 30 minutes
    },
    long_break_duration: { 
      required: true, 
      integer: true, 
      min: 300, // 5 minutes
      max: 3600 // 1 hour
    },
    sessions_until_long_break: { 
      required: true, 
      integer: true, 
      min: 2, 
      max: 10 
    },
    auto_start_breaks: { 
      required: true,
      custom: (value: any) => {
        if (typeof value !== 'boolean') {
          return 'Auto start breaks must be a boolean'
        }
        return null
      }
    },
    auto_start_pomodoros: { 
      required: true,
      custom: (value: any) => {
        if (typeof value !== 'boolean') {
          return 'Auto start pomodoros must be a boolean'
        }
        return null
      }
    },
    theme: { 
      required: true,
      custom: (value: string) => {
        const validThemes = ['default', 'dark', 'light', 'blue', 'green', 'purple']
        if (!validThemes.includes(value)) {
          return 'Theme must be one of: default, dark, light, blue, green, purple'
        }
        return null
      }
    },
    notification_sound: { 
      required: true, 
      minLength: 1, 
      maxLength: 50 
    },
    break_sound: { 
      required: true, 
      minLength: 1, 
      maxLength: 50 
    },
    master_volume: { 
      required: true, 
      numeric: true, 
      min: 0, 
      max: 1 
    },
    notification_volume: { 
      required: true, 
      numeric: true, 
      min: 0, 
      max: 1 
    },
    music_volume: { 
      required: true, 
      numeric: true, 
      min: 0, 
      max: 1 
    },
    ambient_volume: { 
      required: true, 
      numeric: true, 
      min: 0, 
      max: 1 
    }
  },

  // Contact form
  contactForm: {
    name: { 
      required: true, 
      minLength: 2, 
      maxLength: 100 
    },
    email: { 
      required: true, 
      email: true, 
      maxLength: 254 
    },
    subject: { 
      required: true, 
      minLength: 5, 
      maxLength: 200 
    },
    message: { 
      required: true, 
      minLength: 10, 
      maxLength: 2000 
    }
  }
}

/**
 * Utility functions for common validations
 */
export const ValidationUtils = {
  /**
   * Validate email format
   */
  validateEmail(email: string): ValidationResult {
    return {
      isValid: Validator.isValidEmail(email),
      errors: Validator.isValidEmail(email) ? [] : ['Invalid email format']
    }
  },

  /**
   * Validate password
   */
  validatePassword(password: string): ValidationResult {
    return Validator.validatePassword(password)
  },

  /**
   * Validate required fields
   */
  validateRequired(data: Record<string, any>, requiredFields: string[]): ValidationResult {
    const errors: string[] = []
    
    for (const field of requiredFields) {
      const value = data[field]
      if (value === null || value === undefined || value === '') {
        errors.push(`${field} is required`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Sanitize user input
   */
  sanitizeInput(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = Validator.sanitizeString(value)
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  },

  /**
   * Validate date range
   */
  validateDateRange(startDate: string, endDate: string): ValidationResult {
    const errors: string[] = []
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime())) {
      errors.push('Start date is invalid')
    }
    
    if (isNaN(end.getTime())) {
      errors.push('End date is invalid')
    }
    
    if (start > end) {
      errors.push('Start date must be before end date')
    }
    
    // Check if dates are not too far in the future (1 year)
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    
    if (end > oneYearFromNow) {
      errors.push('End date cannot be more than one year in the future')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Validate file upload
   */
  validateFile(
    file: File, 
    options: {
      maxSize?: number // in bytes
      allowedTypes?: string[]
      maxFiles?: number
    } = {}
  ): ValidationResult {
    const errors: string[] = []
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [] } = options
    
    // Size check
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
    }
    
    // Type check
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Higher-order function to create validation middleware
 */
export function createValidationMiddleware(schema: ValidationSchema) {
  return (data: any) => {
    const result = Validator.validateSchema(data, schema)
    if (!result.isValid) {
      throw new ValidationError('Validation failed', {
        errors: result.errors,
        data
      })
    }
    return data
  }
}

/**
 * Async validation for checking uniqueness (e.g., email, username)
 */
export class AsyncValidator {
  static async validateUniqueEmail(
    email: string, 
    checkFunction: (email: string) => Promise<boolean>
  ): Promise<ValidationResult> {
    try {
      const exists = await checkFunction(email)
      return {
        isValid: !exists,
        errors: exists ? ['Email is already registered'] : []
      }
    } catch (error) {
      return {
        isValid: false,
        errors: ['Unable to verify email uniqueness']
      }
    }
  }

  static async validateUniqueUsername(
    username: string, 
    checkFunction: (username: string) => Promise<boolean>
  ): Promise<ValidationResult> {
    try {
      const exists = await checkFunction(username)
      return {
        isValid: !exists,
        errors: exists ? ['Username is already taken'] : []
      }
    } catch (error) {
      return {
        isValid: false,
        errors: ['Unable to verify username availability']
      }
    }
  }
}