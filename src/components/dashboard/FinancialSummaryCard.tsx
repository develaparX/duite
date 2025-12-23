import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

interface FinancialSummaryCardProps {
  title: string;
  description?: string;
  value: number | string;
  change?: {
    amount: number;
    percentage: number;
    isPositive: boolean;
  };
  className?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  isPercentage?: boolean;
}

export function FinancialSummaryCard({
  title,
  description,
  value,
  change,
  icon,
  className,
  loading = false,
  onClick,
  isPercentage = false,
}: FinancialSummaryCardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    if (isPercentage) {
      return `${val.toFixed(1)}%`;
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <Card className={cn(onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-full bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : '', className)}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1 pr-2">
          <CardTitle className="text-sm font-medium text-muted-foreground break-words">
            {title}
          </CardTitle>
        </div>
        {icon && (
          <div className="text-muted-foreground h-4 w-4 flex-shrink-0 mt-1">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold break-words">
          {formatValue(value)}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {change && (
          <p className="text-xs flex items-center mt-1 text-muted-foreground">
            <span
              className={cn(
                "flex items-center",
                change.isPositive ? "text-green-500" : "text-red-500"
              )}
            >
              {change.isPositive ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
              {Math.abs(change.percentage).toFixed(1)}%
            </span>
            <span className="ml-2 opacity-70">from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}