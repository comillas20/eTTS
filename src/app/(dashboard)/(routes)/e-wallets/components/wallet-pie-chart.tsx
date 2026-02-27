"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  transactions: {
    label: "Transactions",
  },
  cashIn: {
    label: "Cash-in",
    color: "var(--chart-1)",
  },
  cashOut: {
    label: "Cash-out",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type PieChartData = {
  type: string;
  transactions: number;
  fill: string;
};

type WalletPieChartProps = {
  data: PieChartData[];
};
export function WalletPieChart({ data }: WalletPieChartProps) {
  const totalTransactions = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.transactions, 0);
  }, [data]);

  return (
    <div className="flex-1 pb-0">
      {totalTransactions > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="transactions"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle">
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold">
                          {totalTransactions.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground">
                          Transactions
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      ) : (
        <div className="text-center text-sm font-medium">
          No transaction data
        </div>
      )}
    </div>
  );
}
