import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/db/schema';

interface ReceivableFormProps {
  receivable?: Transaction;
  onSubmit: (data: {
    amount: string;
    description: string;
    debtor: string;
    expectedDate: string;
    transactionDate?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

interface FormData {
  amount: string;
  description: string;
  debtor: string;
  expectedDate: string;
  transactionDate: string;
}

export function ReceivableForm({
  receivable,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}: ReceivableFormProps) {
  const [formData, setFormData] = useState<FormData>({
    amount: receivable?.amount || '',
    description: receivable?.description || '',
    debtor: receivable?.relatedParty || '',
    expectedDate: receivable?.dueDate || '',
    transactionDate: receivable?.transactionDate || new Date().toISOString().split('T')[0],
  });

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Amount must be a positive number';
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    // Debtor validation
    if (!formData.debtor.trim()) {
      errors.debtor = 'Debtor name is required';
    }

    // Expected date validation
    if (!formData.expectedDate) {
      errors.expectedDate = 'Expected date is required';
    }

    // Transaction date validation
    if (!formData.transactionDate) {
      errors.transactionDate = 'Transaction date is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        amount: formData.amount,
        description: formData.description.trim(),
        debtor: formData.debtor.trim(),
        expectedDate: formData.expectedDate,
        transactionDate: formData.transactionDate,
      });
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const isEdit = !!receivable;
  const title = isEdit ? 'Edit Receivable' : 'Add New Receivable';
  const submitText = isEdit ? 'Update Receivable' : 'Add Receivable';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {isEdit
            ? 'Update the receivable details below'
            : 'Enter the details for your new receivable'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount Expected</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleFieldChange('amount', e.target.value)}
              disabled={isLoading}
              className={validationErrors.amount ? 'border-destructive' : ''}
            />
            {validationErrors.amount && (
              <p className="text-sm text-destructive">{validationErrors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="What is this receivable for?"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              disabled={isLoading}
              className={validationErrors.description ? 'border-destructive' : ''}
            />
            {validationErrors.description && (
              <p className="text-sm text-destructive">{validationErrors.description}</p>
            )}
          </div>

          {/* Debtor */}
          <div className="space-y-2">
            <Label htmlFor="debtor">Debtor (Who owes you)</Label>
            <Input
              id="debtor"
              type="text"
              placeholder="Enter debtor name"
              value={formData.debtor}
              onChange={(e) => handleFieldChange('debtor', e.target.value)}
              disabled={isLoading}
              className={validationErrors.debtor ? 'border-destructive' : ''}
            />
            {validationErrors.debtor && (
              <p className="text-sm text-destructive">{validationErrors.debtor}</p>
            )}
          </div>

          {/* Expected Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedDate">Expected Date</Label>
            <Input
              id="expectedDate"
              type="date"
              value={formData.expectedDate}
              onChange={(e) => handleFieldChange('expectedDate', e.target.value)}
              disabled={isLoading}
              className={validationErrors.expectedDate ? 'border-destructive' : ''}
            />
            {validationErrors.expectedDate && (
              <p className="text-sm text-destructive">{validationErrors.expectedDate}</p>
            )}
          </div>

          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="transactionDate">Transaction Date</Label>
            <Input
              id="transactionDate"
              type="date"
              value={formData.transactionDate}
              onChange={(e) => handleFieldChange('transactionDate', e.target.value)}
              disabled={isLoading}
              className={validationErrors.transactionDate ? 'border-destructive' : ''}
            />
            {validationErrors.transactionDate && (
              <p className="text-sm text-destructive">{validationErrors.transactionDate}</p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : submitText}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}