import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySelector } from './CategorySelector';
import type { Transaction, NewTransaction } from '@/db/schema';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

interface TransactionFormProps {
  transaction?: Transaction;
  categories: Category[];
  onSubmit: (data: NewTransaction) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
  defaultType?: 'income' | 'expense' | 'debt' | 'receivable';
  isTypeLocked?: boolean;
  titleOverride?: string;
  embedded?: boolean;
}

interface FormData {
  type: 'income' | 'expense' | 'debt' | 'receivable';
  amount: string;
  description: string;
  category: string;
  transactionDate: string;
  relatedParty: string;
  dueDate: string;
  status: 'active' | 'settled' | 'cancelled';
}

export function TransactionForm({
  transaction,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  defaultType = 'expense',
  isTypeLocked = false,
  titleOverride,
  embedded = false,
}: TransactionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    type: defaultType,
    amount: '',
    description: '',
    category: '',
    transactionDate: new Date().toISOString().split('T')[0],
    relatedParty: '',
    dueDate: '',
    status: 'active',
  });

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Initialize form with transaction data if editing
  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type as 'income' | 'expense' | 'debt' | 'receivable',
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category || '',
        transactionDate: transaction.transactionDate,
        relatedParty: transaction.relatedParty || '',
        dueDate: transaction.dueDate || '',
        status: transaction.status as 'active' | 'settled' | 'cancelled',
      });
    }
  }, [transaction]);

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

    // Transaction date validation
    if (!formData.transactionDate) {
      errors.transactionDate = 'Transaction date is required';
    }

    // Related party validation for debts and receivables
    if ((formData.type === 'debt' || formData.type === 'receivable') && !formData.relatedParty.trim()) {
      errors.relatedParty = 'Related party is required for debts and receivables';
    }

    // Due date validation for debts and receivables
    if ((formData.type === 'debt' || formData.type === 'receivable') && !formData.dueDate) {
      errors.dueDate = 'Due date is required for debts and receivables';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const transactionData: NewTransaction = {
      type: formData.type,
      amount: formData.amount,
      description: formData.description.trim(),
      category: formData.category || null,
      transactionDate: formData.transactionDate,
      relatedParty: formData.relatedParty.trim() || null,
      dueDate: formData.dueDate || null,
      status: formData.status,
      currency: 'IDR',
      userId: 0, // This will be set by the API
    };

    try {
      await onSubmit(transactionData);
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

    // Clear category when changing transaction type
    if (field === 'type' && (value === 'debt' || value === 'receivable')) {
      setFormData((prev) => ({
        ...prev,
        category: '',
      }));
    }
  };

  const isEdit = !!transaction;
  const title = titleOverride || (isEdit ? 'Edit Transaction' : 'Add New Transaction');
  const submitText = isEdit ? 'Update Transaction' : 'Add Transaction';

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Transaction Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Transaction Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleFieldChange('type', value)}
          disabled={isLoading || isEdit || isTypeLocked}
        >
          <SelectTrigger className={validationErrors.type ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select transaction type" />
          </SelectTrigger>
          <SelectContent className="z-[99999]">
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="debt">Debt</SelectItem>
            <SelectItem value="receivable">Receivable</SelectItem>
          </SelectContent>
        </Select>
        {validationErrors.type && (
          <p className="text-sm text-destructive">{validationErrors.type}</p>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
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
          placeholder="Enter transaction description"
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          disabled={isLoading}
          className={validationErrors.description ? 'border-destructive' : ''}
        />
        {validationErrors.description && (
          <p className="text-sm text-destructive">{validationErrors.description}</p>
        )}
      </div>

      {/* Category Selector */}
      <CategorySelector
        categories={categories}
        value={formData.category}
        onValueChange={(value) => handleFieldChange('category', value)}
        transactionType={formData.type}
        disabled={isLoading}
        error={validationErrors.category}
      />

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

      {/* Related Party (for debts and receivables) */}
      {(formData.type === 'debt' || formData.type === 'receivable') && (
        <div className="space-y-2">
          <Label htmlFor="relatedParty">
            {formData.type === 'debt' ? 'Creditor' : 'Debtor'}
          </Label>
          <Input
            id="relatedParty"
            type="text"
            placeholder={`Enter ${formData.type === 'debt' ? 'creditor' : 'debtor'} name`}
            value={formData.relatedParty}
            onChange={(e) => handleFieldChange('relatedParty', e.target.value)}
            disabled={isLoading}
            className={validationErrors.relatedParty ? 'border-destructive' : ''}
          />
          {validationErrors.relatedParty && (
            <p className="text-sm text-destructive">{validationErrors.relatedParty}</p>
          )}
        </div>
      )}

      {/* Due Date (for debts and receivables) */}
      {(formData.type === 'debt' || formData.type === 'receivable') && (
        <div className="space-y-2">
          <Label htmlFor="dueDate">
            {formData.type === 'debt' ? 'Due Date' : 'Expected Date'}
          </Label>
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
      )}

      {/* Status (for editing existing transactions) */}
      {isEdit && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleFieldChange('status', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

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
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {isEdit
            ? 'Update the transaction details below'
            : 'Enter the details for your new transaction'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}