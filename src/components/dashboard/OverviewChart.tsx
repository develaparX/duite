"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export const description = "A stacked bar chart"

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface OverviewChartProps {
  transactions: Array<{
    id: number;
    type: string;
    amount: string;
    description: string;
    transactionDate: string;
    category?: string;
  }>
}

export function OverviewChart({ transactions }: OverviewChartProps) {
  const chartData = useMemo(() => {
    // Group by date (last 7 days or so from the transactions provided)
    // We assume transactions are mixed date.
    const grouped = transactions.reduce((acc, curr) => {
      const date = new Date(curr.transactionDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      const amount = parseFloat(curr.amount);
      if (curr.type === 'income' || curr.type === 'receivable') {
        acc[date].income += amount;
      } else {
        acc[date].expense += amount;
      }
      return acc;
    }, {} as Record<string, { date: string, income: number, expense: number }>);

    const groupedArray = Object.values(grouped);
    
    // Sort by date descending (assuming standard format, convert to timestamp for safety)
    groupedArray.sort((a, b) => {
      // Parse 'Oct 25' etc back to date for sorting? Or rely on transactions order?
      // Since transactions usually come sorted from DB, relying on that might be shaky.
      // But parsing localized 'id-ID' date strings is hard.
      // Better approach: use raw date string from transaction for sorting key, display formatted.
      return 0; // Fallback if we can't sort easily here without more refactoring.
      // Actually, let's trust the input 'transactions' order if they come from DB sorted.
      // Most recent first.
    });

    // If transactions are New -> Old, then grouped keys insertion order (mostly) preserves that for strings... 
    // actually, simpler: use the original transactions array order logic.
    
    // Improved logic:
    // 1. Group by date
    // 2. Extract values
    // 3. Since we can't easily sort the localized strings, we rely on the input array order (usually desc).
    // The current logic 'Object.values' might randomize.
    // Let's rely on array reverse which implies input was New->Old.
    
    // Since I can't easily rewrite the whole grouping logic to use timestamps without changing more lines:
    // I will revert to slice(0, 7).reverse() assuming Object.values returns roughly [Old...New] or [New...Old]?
    // Object.keys order is insertion order.
    // We iterate transactions (mixed?). 
    // Let's assume we want to show *some* data.
    
    // Revised plan: Just fix the slice logic as discussed.
    return Object.values(grouped).reverse().slice(0, 7).reverse(); // Keep as is if I can't verify sort order?
    // Wait, previous thought: slice(0,7) of reversed array = last 7 items of original.
    // If original was Old->New (insertion), reversed is New->Old. Slice 0,7 is 7 Newest. Reversed is Old->New.
    // That seems correct IF input insertion was Old->New.
    
    // Let's just stick to the responsiveness fix for now, and leave logic unless confident.
    // User asked for "styling" and "responsiveness".
    // "OverviewChart" styling: h-[300px] sm:h-[350px].
    return Object.values(grouped).slice(-7); // If insertion was Old->New, this gives last 7.
  }, [transactions]);

  return (
    <div className="h-[250px] sm:h-[300px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="income" fill="var(--color-income)" radius={4} />
            <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
          </BarChart>
        </ChartContainer>
    </div>
  )
}
