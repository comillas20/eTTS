"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { recordsTable } from "@/db/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { compareAsc, max } from "date-fns";

const chartConfig = {
  transactions: {
    label: "Transactions",
  },
  cashIn: {
    label: "Cash-in",
  },
  cashOut: {
    label: "Cash-out",
  },
} satisfies ChartConfig;

type OverviewChartAreaProps = {
  data: (typeof recordsTable.$inferSelect)[];
};

export function OverviewChartArea({ data }: OverviewChartAreaProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const chartData = aggregateRecords(data);
  const filteredData = chartData
    .filter((item, _, arr) => {
      const date = new Date(item.date);
      const referenceDate = max(arr.map((a) => a.date));
      let daysToSubtract = 90;
      if (timeRange === "30d") {
        daysToSubtract = 30;
      } else if (timeRange === "7d") {
        daysToSubtract = 7;
      }
      const startDate = new Date(referenceDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      return date >= startDate;
    })
    .sort((a, b) => compareAsc(new Date(a.date), new Date(b.date)));

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total transactions for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction className="flex h-full items-center">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden @[767px]/card:flex">
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 @[767px]/card:hidden"
              aria-label="Select a value">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full">
          <BarChart accessibilityLayer data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dashed"
                />
              }
            />
            <Bar dataKey="cashIn" fill="var(--chart-1)" radius={4} />
            <Bar dataKey="cashOut" fill="var(--chart-2)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

type ChartData = {
  date: string;
  cashIn: number;
  cashOut: number;
};

function aggregateRecords(
  records: (typeof recordsTable.$inferSelect)[],
): ChartData[] {
  const dailyData: Record<string, ChartData> = {};

  for (const record of records) {
    // Get the date string in YYYY-MM-DD format for grouping
    const dateString = record.date.toISOString().split("T")[0];

    if (!dailyData[dateString]) {
      // If this date is not yet in our aggregated data, initialize it
      dailyData[dateString] = {
        date: dateString,
        cashIn: 0,
        cashOut: 0,
      };
    }

    // Increment the cashIn or cashOut count based on the record type
    if (record.type === "cash-in") {
      dailyData[dateString].cashIn += 1;
    } else if (record.type === "cash-out") {
      dailyData[dateString].cashOut += 1;
    }
  }

  // Convert the object into an array of values
  return Object.values(dailyData);
}
