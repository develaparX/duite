import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { InvestmentBalance, NewInvestmentBalance } from '@/db/schema';

interface InvestmentBalanceFormProps {
  balance?: InvestmentBalance;
  onSubmit: (data: NewInvestmentBalance) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
  existingAccountNames?: string[];
  existingAccountTypes?: string[];
}

export function InvestmentBalanceForm({
  balance,
  onSubmit,
  onCancel,
  isLoading = false,
  error = '',
  existingAccountNames = [],
  existingAccountTypes = [],
}: InvestmentBalanceFormProps) {
  const [formData, setFormData] = useState<NewInvestmentBalance>({
    userId: 0, // Will be set by parent component
    accountName: balance?.accountName || '',
    balance: balance?.balance || '0',
    accountType: balance?.accountType || 'general',
    notes: balance?.notes || '',
    recordedAt: balance?.recordedAt || new Date(),
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isNewAccount, setIsNewAccount] = useState(!balance?.accountName);

  // Default account types
  const defaultAccountTypes = [
    'general',
    '401k',
    'ira',
    'roth-ira',
    'brokerage',
    'savings',
    'cd',
    'bonds',
    'crypto',
    'real-estate',
    'commodities',
    'other',
  ];

  // Combine existing and default account types
  const allAccountTypes = Array.from(new Set([...defaultAccountTypes, ...existingAccountTypes])).sort();

  useEffect(() => {
    if (balance) {
      setFormData({
        userId: balance.userId,
        accountName: balance.accountName,
        balance: balance.balance,
        accountType: balance.accountType || 'general',
        notes: balance.notes || '',
        recordedAt: balance.recordedAt,
      });
      setIsNewAccount(false);
    }
  }, [balance]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Account name validation
    if (!formData.accountName.trim()) {
      errors.accountName = 'Account name is required';
    } else if (formData.accountName.trim().length < 2) {
      errors.accountName = 'Account name must be at least 2 characters';
    }

    // Balance validation
    const balanceNum = typeof formData.balance === 'string' ? parseFloat(formData.balance) : formData.balance;
    if (isNaN(balanceNum)) {
      errors.balance = 'Balance must be a valid number';
    }

    // Account type validation
    if (!formData.accountType || !formData.accountType.trim()) {
      errors.accountType = 'Account type is required';
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
        ...formData,
        balance: typeof formData.balance === 'string' ? formData.balance : String(formData.balance),
        accountName: formData.accountName.trim(),
        accountType: (formData.accountType || 'general').trim(),
        notes: formData.notes?.trim() || null,
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof NewInvestmentBalance, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const formatAccountTypeName = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {balance ? 'Update Investment Balance' : 'Record Investment Balance'}
        </CardTitle>
        <CardDescription>
          {balance 
            ? 'Update the balance for this investment account'
            : 'Record a new balance for your investment account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name *</Label>
            {isNewAccount && existingAccountNames.length > 0 ? (
              <div className="space-y-2">
                <Select
                  value={formData.accountName}
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setFormData(prev => ({ ...prev, accountName: '' }));
                    } else {
                      handleInputChange('accountName', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing account or create new" />
                  </SelectTrigger>
                  <SelectContent className="z-[99999]">
                    <SelectItem value="new">Create New Account</SelectItem>
                    {existingAccountNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.accountName === '' && (
                  <Input
                    id="accountName"
                    type="text"
                    placeholder="Enter new account name"
                    value={formData.accountName}
                    onChange={(e) => handleInputChange('accountName', e.target.value)}
                    className={validationErrors.accountName ? 'border-red-500' : ''}
                  />
                )}
              </div>
            ) : (
              <Input
                id="accountName"
                type="text"
                placeholder="e.g., Fidelity 401k, Vanguard IRA"
                value={formData.accountName}
                onChange={(e) => handleInputChange('accountName', e.target.value)}
                className={validationErrors.accountName ? 'border-red-500' : ''}
                disabled={!!balance} // Disable editing account name for existing balances
              />
            )}
            {validationErrors.accountName && (
              <p className="text-sm text-red-600">{validationErrors.accountName}</p>
            )}
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="balance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.balance}
                onChange={(e) => handleInputChange('balance', e.target.value)}
                className={`pl-8 ${validationErrors.balance ? 'border-red-500' : ''}`}
              />
            </div>
            {validationErrors.balance && (
              <p className="text-sm text-red-600">{validationErrors.balance}</p>
            )}
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type *</Label>
            <Select
              value={formData.accountType || 'general'}
              onValueChange={(value) => handleInputChange('accountType', value)}
            >
              <SelectTrigger className={validationErrors.accountType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent className="z-[99999]">
                {allAccountTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatAccountTypeName(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.accountType && (
              <p className="text-sm text-red-600">{validationErrors.accountType}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Any additional notes about this balance update"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (balance ? 'Update Balance' : 'Record Balance')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}