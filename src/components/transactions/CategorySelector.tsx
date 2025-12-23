
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

interface CategorySelectorProps {
  categories: Category[];
  value?: string;
  onValueChange: (value: string) => void;
  transactionType: 'income' | 'expense' | 'debt' | 'receivable';
  disabled?: boolean;
  error?: string;
}

export function CategorySelector({
  categories,
  value,
  onValueChange,
  transactionType,
  disabled = false,
  error,
}: CategorySelectorProps) {
  // Filter categories based on transaction type
  const filteredCategories = categories.filter((category) => {
    if (transactionType === 'income') return category.type === 'income';
    if (transactionType === 'expense') return category.type === 'expense';
    // For debt and receivable, we don't use categories
    return false;
  });

  // Don't show category selector for debt and receivable types
  if (transactionType === 'debt' || transactionType === 'receivable') {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent className="z-[99999]">
          {filteredCategories.map((category) => (
            <SelectItem key={category.id} value={category.name}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}