import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'destructive'
}

/**
 * Generic error state component
 */
export function ErrorState({ 
  title = "Something went wrong", 
  description = "We encountered an error while loading this page.",
  action,
  variant = 'default'
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {action && (
          <CardContent className="text-center">
            <Button onClick={action.onClick} variant={variant === 'destructive' ? 'destructive' : 'default'}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

/**
 * Network error component
 */
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Error"
      description="Unable to connect to the server. Please check your internet connection and try again."
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
    />
  )
}

/**
 * Not found error component
 */
export function NotFoundError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl font-bold text-muted-foreground">404</div>
          <CardTitle className="text-xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-2">
          {onGoHome && (
            <Button onClick={onGoHome} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          )}
          <Button variant="outline" onClick={() => window.history.back()} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Unauthorized error component
 */
export function UnauthorizedError({ onLogin }: { onLogin?: () => void }) {
  return (
    <ErrorState
      title="Access Denied"
      description="You need to be logged in to access this page."
      action={onLogin ? { label: "Login", onClick: onLogin } : undefined}
    />
  )
}

/**
 * Inline error alert component
 */
export function InlineError({ 
  title = "Error", 
  description, 
  onDismiss,
  variant = 'destructive' 
}: {
  title?: string
  description: string
  onDismiss?: () => void
  variant?: 'default' | 'destructive'
}) {
  return (
    <Alert variant={variant} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{description}</span>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Form validation error component
 */
export function FormError({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Please fix the following errors:</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc list-inside space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Empty state component (not exactly an error, but related)
 */
export function EmptyState({ 
  title, 
  description, 
  action,
  icon: Icon = AlertTriangle 
}: {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}