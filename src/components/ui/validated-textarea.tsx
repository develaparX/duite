import * as React from 'react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

export interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  maxLength?: number
  showCharCount?: boolean
}

const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ className, label, error, helperText, required, maxLength, showCharCount, id, value, ...props }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <Label 
              htmlFor={inputId} 
              className={cn(
                "text-sm font-medium",
                hasError && "text-destructive",
                required && "after:content-['*'] after:ml-0.5 after:text-destructive"
              )}
            >
              {label}
            </Label>
            
            {showCharCount && maxLength && (
              <span className={cn(
                "text-xs text-muted-foreground",
                currentLength > maxLength && "text-destructive"
              )}>
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        
        <div className="relative">
          <Textarea
            id={inputId}
            ref={ref}
            value={value}
            maxLength={maxLength}
            className={cn(
              hasError && "border-destructive focus-visible:ring-destructive",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {hasError && (
            <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

ValidatedTextarea.displayName = 'ValidatedTextarea'

export { ValidatedTextarea }