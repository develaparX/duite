import React from 'react';
import { Button } from '@/components/ui/button';
import { ValidatedInput } from '@/components/ui/validated-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormValidation } from '@/hooks/useFormValidation';
import { validateEmail, validatePassword, validateFullName, FieldValidationResult } from '@/lib/validation';
import { InlineError } from '@/components/layout';

interface RegisterFormProps {
  onSubmit: (email: string, password: string, fullName: string) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
  error?: string;
}

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterForm({ onSubmit, onSwitchToLogin, isLoading = false, error }: RegisterFormProps) {
  const {
    values,
    submitError,
    isValid,
    isSubmitting,
    handleSubmit,
    getFieldProps,
    clearSubmitError
  } = useFormValidation<RegisterFormData>({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationRules: {
      fullName: validateFullName,
      email: validateEmail,
      password: validatePassword,
      confirmPassword: (value): FieldValidationResult => {
        if (!value) {
          return { isValid: false, error: 'Please confirm your password' }
        }
        if (value !== values.password) {
          return { isValid: false, error: 'Passwords do not match' }
        }
        return { isValid: true }
      }
    },
    onSubmit: async (formValues) => {
      await onSubmit(formValues.email, formValues.password, formValues.fullName.trim());
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
        <CardTitle className="text-2xl text-center">Create account</CardTitle>
        <CardDescription className="text-center">
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ValidatedInput
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            required
            disabled={formIsLoading}
            {...getFieldProps('fullName')}
          />

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
            helperText="Must be at least 8 characters with uppercase, lowercase, and number"
            {...getFieldProps('password')}
          />

          <ValidatedInput
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            required
            disabled={formIsLoading}
            {...getFieldProps('confirmPassword')}
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
            {formIsLoading ? 'Creating account...' : 'Create account'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-primary hover:underline"
              disabled={formIsLoading}
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}