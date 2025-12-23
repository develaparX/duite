import * as React from 'react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ValidatedSelectProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  placeholder?: string
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
}

const ValidatedSelect = React.forwardRef<HTMLButtonElement, ValidatedSelectProps>(
  ({ label, error, helperText, required, placeholder, options, value, onValueChange, disabled, className, id }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error

    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={selectId} 
            className={cn(
              "text-sm font-medium",
              hasError && "text-destructive",
              required && "after:content-['*'] after:ml-0.5 after:text-destructive"
            )}
          >
            {label}
          </Label>
        )}
        
        <div className="relative">
          <Select
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
          >
            <SelectTrigger
              id={selectId}
              ref={ref}
              className={cn(
                hasError && "border-destructive focus:ring-destructive",
                className
              )}
              aria-invalid={hasError}
              aria-describedby={
                error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
              }
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            
            <SelectContent>
              {options.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {hasError && (
            <AlertCircle className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive pointer-events-none" />
          )}
        </div>

        {error && (
          <p id={`${selectId}-error`} className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${selectId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

ValidatedSelect.displayName = 'ValidatedSelect'

export { ValidatedSelect }