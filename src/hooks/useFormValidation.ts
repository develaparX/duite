import { useState, useCallback } from 'react'
import { ValidationResult, FieldValidationResult } from '@/lib/validation'

interface FormField {
  value: string
  error?: string
  touched: boolean
}

interface UseFormValidationOptions<T> {
  initialValues: T
  validationRules: Record<keyof T, (value: any) => FieldValidationResult>
  onSubmit?: (values: T) => void | Promise<void>
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit
}: UseFormValidationOptions<T>) {
  const [fields, setFields] = useState<Record<keyof T, FormField>>(() => {
    const initialFields: Record<keyof T, FormField> = {} as any
    
    for (const key in initialValues) {
      initialFields[key] = {
        value: initialValues[key] || '',
        touched: false
      }
    }
    
    return initialFields
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  // Validate a single field
  const validateField = useCallback((fieldName: keyof T, value: string): FieldValidationResult => {
    const validator = validationRules[fieldName]
    if (!validator) {
      return { isValid: true }
    }
    
    return validator(value)
  }, [validationRules])

  // Update field value and validate
  const setFieldValue = useCallback((fieldName: keyof T, value: string) => {
    setFields(prev => {
      const validation = validateField(fieldName, value)
      
      return {
        ...prev,
        [fieldName]: {
          value,
          error: validation.isValid ? undefined : validation.error,
          touched: prev[fieldName]?.touched || false
        }
      }
    })
  }, [validateField])

  // Mark field as touched and validate
  const setFieldTouched = useCallback((fieldName: keyof T, touched = true) => {
    setFields(prev => {
      const currentField = prev[fieldName]
      const validation = validateField(fieldName, currentField.value)
      
      return {
        ...prev,
        [fieldName]: {
          ...currentField,
          touched,
          error: touched && !validation.isValid ? validation.error : currentField.error
        }
      }
    })
  }, [validateField])

  // Validate all fields
  const validateAllFields = useCallback((): ValidationResult => {
    const errors: string[] = []
    const updatedFields = { ...fields }

    for (const fieldName in fields) {
      const field = fields[fieldName]
      const validation = validateField(fieldName, field.value)
      
      updatedFields[fieldName] = {
        ...field,
        touched: true,
        error: validation.isValid ? undefined : validation.error
      }

      if (!validation.isValid && validation.error) {
        errors.push(validation.error)
      }
    }

    setFields(updatedFields)

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [fields, validateField])

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    setSubmitError('')
    
    const validation = validateAllFields()
    if (!validation.isValid) {
      return
    }

    if (!onSubmit) {
      return
    }

    setIsSubmitting(true)

    try {
      const values = {} as T
      for (const fieldName in fields) {
        values[fieldName] = fields[fieldName].value as any
      }

      await onSubmit(values)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }, [fields, validateAllFields, onSubmit])

  // Reset form to initial values
  const resetForm = useCallback(() => {
    const resetFields: Record<keyof T, FormField> = {} as any
    
    for (const key in initialValues) {
      resetFields[key] = {
        value: initialValues[key] || '',
        touched: false
      }
    }
    
    setFields(resetFields)
    setSubmitError('')
    setIsSubmitting(false)
  }, [initialValues])

  // Get field props for input components
  const getFieldProps = useCallback((fieldName: keyof T) => {
    const field = fields[fieldName]
    
    return {
      value: field?.value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFieldValue(fieldName, e.target.value)
      },
      onBlur: () => {
        setFieldTouched(fieldName, true)
      },
      error: field?.touched ? field.error : undefined
    }
  }, [fields, setFieldValue, setFieldTouched])

  // Check if form is valid
  const isValid = Object.values(fields).every(field => !field.error)

  // Check if form has been touched
  const isTouched = Object.values(fields).some(field => field.touched)

  // Get current form values
  const values = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].value as any
    return acc
  }, {} as T)

  // Get all errors
  const errors = Object.values(fields)
    .filter(field => field.touched && field.error)
    .map(field => field.error!)

  return {
    fields,
    values,
    errors,
    submitError,
    isValid,
    isTouched,
    isSubmitting,
    setFieldValue,
    setFieldTouched,
    validateAllFields,
    handleSubmit,
    resetForm,
    getFieldProps,
    clearSubmitError: () => setSubmitError('')
  }
}