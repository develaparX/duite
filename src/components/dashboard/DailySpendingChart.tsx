"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  thisMonth: {
    label: "This Month",
    color: "hsl(var(--chart-1))",
  },
  lastMonth: {
    label: "Last Month",
    color: "hsl(var(--chart-2))", 
  },
} satisfies ChartConfig

interface DailySpendingChartProps {
  data: {
    thisMonth: Array<{
      date: string;
      amount: number;
      category?: string;
    }>;
    lastMonth: Array<{
      date: string;
      amount: number;
      category?: string;
    }>;
    comparison: {
      averageThisMonth: number;
      averageLastMonth: number;
      percentageChange: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
  };
}

export function DailySpendingChart({ data }: DailySpendingChartProps) {
  // Transform the data for the chart
  const chartData = [];
  const maxDays = Math.max(data.thisMonth.length, data.lastMonth.length, 31);
  
  for (let day = 1; day <= maxDays; day++) {
    const thisMonthEntry = data.thisMonth.find(entry => 
      new Date(entry.date).getDate() === day
    );
    const lastMonthEntry = data.lastMonth.find(entry => 
      new Date(entry.date).getDate() === day
    );
    
    chartData.push({
      date: day.toString(),
      thisMonth: thisMonthEntry?.amount || 0,
      lastMonth: lastMonthEntry?.amount || 0,
    });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <p className="text-muted-foreground">This Month Avg</p>
          <p className="text-sm sm:text-base font-semibold break-words">{formatCurrency(data.comparison.averageThisMonth)}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Last Month Avg</p>
          <p className="text-sm sm:text-base font-semibold break-words">{formatCurrency(data.comparison.averageLastMonth)}</p>
        </div>
      </div>
      
      <div className="h-[250px] sm:h-[300px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis 
               tickLine={false}
               axisLine={false}
               tickFormatter={(value) => formatCurrency(value)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                formatter={(value, name) => [formatCurrency(value as number), name]}
              />}
            />
            <Line
              dataKey="thisMonth"
              type="monotone"
              stroke="var(--color-thisMonth)"
              strokeWidth={2}
              dot={false}
              name="This Month"
            />
            <Line
              dataKey="lastMonth"
              type="monotone"
              stroke="var(--color-lastMonth)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              name="Last Month"
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}