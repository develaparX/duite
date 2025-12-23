import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/db/schema';

interface DebtFormProps {
  debt?: Transaction;
  onSubmit: (data: {
    amount: string;
    description: string;
    creditor: string;
    dueDate: string;
    transactionDate?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

interface FormData {
  amount: string;
  description: string;
  creditor: string;
  dueDate: string;
  transactionDate: string;
}

export function DebtForm({
  debt,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}: DebtFormProps) {
  const [formData, setFormData] = useState<FormData>({
    amount: debt?.amount || '',
    description: debt?.description || '',
    creditor: debt?.relatedParty || '',
    dueDate: debt?.dueDate || '',
    transactionDate: debt?.transactionDate || new Date().toISOString().split('T')[0],
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

    // Creditor validation
    if (!formData.creditor.trim()) {
      errors.creditor = 'Creditor name is required';
    }

    // Due date validation
    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required';
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
        creditor: formData.creditor.trim(),
        dueDate: formData.dueDate,
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

  const isEdit = !!debt;
  const title = isEdit ? 'Edit Debt' : 'Add New Debt';
  const submitText = isEdit ? 'Update Debt' : 'Add Debt';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {isEdit
            ? 'Update the debt details below'
            : 'Enter the details for your new debt'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount Owed</Label>
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
              placeholder="What is this debt for?"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              disabled={isLoading}
              className={validationErrors.description ? 'border-destructive' : ''}
            />
            {validationErrors.description && (
              <p className="text-sm text-destructive">{validationErrors.description}</p>
            )}
          </div>

          {/* Creditor */}
          <div className="space-y-2">
            <Label htmlFor="creditor">Creditor (Who you owe)</Label>
            <Input
              id="creditor"
              type="text"
              placeholder="Enter creditor name"
              value={formData.creditor}
              onChange={(e) => handleFieldChange('creditor', e.target.value)}
              disabled={isLoading}
              className={validationErrors.creditor ? 'border-destructive' : ''}
            />
            {validationErrors.creditor && (
              <p className="text-sm text-destructive">{validationErrors.creditor}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              disabled={isLoading}
              className={validationErrors.dueDate ? 'border-destructive' : ''}
            />
            {validationErrors.dueDate && (
              <p className="text-sm text-destructive">{validationErrors.dueDate}</p>
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