import React from 'react';
import { Button } from '@/components/ui/button';
import { ValidatedInput } from '@/components/ui/validated-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormValidation } from '@/hooks/useFormValidation';
import { validateEmail, validateRequired } from '@/lib/validation';
import { InlineError } from '@/components/layout';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  isLoading?: boolean;
  error?: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm({ onSubmit, onSwitchToRegister, isLoading = false, error }: LoginFormProps) {
  const {
    submitError,
    isValid,
    isSubmitting,
    handleSubmit,
    getFieldProps,
    clearSubmitError
  } = useFormValidation<LoginFormData>({
    initialValues: {
      email: '',
      password: ''
    },
    validationRules: {
      email: validateEmail,
      password: (value) => validateRequired(value, 'Password')
    },
    onSubmit: async (formValues) => {
      await onSubmit(formValues.email, formValues.password);
    }
  });

  // Clear submit error when parent error changes
  React.useEffect(() => {
    if (error) {
      clearSubmitError();
    }
  }, [error, clearSubmitError]);

  const displayError = error || submitError;
  const formIsLoading = isLoading || isSubmitting;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Sign in</CardTitle>
        <CardDescription className="text-center">
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ValidatedInput
            label="Email"
            type="email"
            placeholder="Enter your email"
            required
            disabled={formIsLoading}
            {...getFieldProps('email')}
          />

          <ValidatedInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
            disabled={formIsLoading}
            {...getFieldProps('password')}
          />

          {displayError && (
            <InlineError 
              description={displayError}
              onDismiss={() => {
                clearSubmitError();
              }}
            />
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={formIsLoading || !isValid}
          >
            {formIsLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-sm text-primary hover:underline"
              disabled={formIsLoading}
            >
              Don't have an account? Sign up
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}