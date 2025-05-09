"use server";

import { recordsTable } from "@/db/schema";
import { getMonth, getYear, isSameMonth } from "date-fns";
import { getFilteredRecords } from "./actions";
import { OverviewCards } from "./components/overview-cards";
import { OverviewChartArea } from "./components/overview-chart-area";
import { OverviewHeader } from "./components/overview-header";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  const now = new Date();

  const currentMonth = getMonth(now);
  const currentYear = getYear(now);

  const walletId =
    params.wallet &&
    typeof params.wallet === "string" &&
    !isNaN(parseInt(params.wallet, 10))
      ? parseInt(params.wallet, 10)
      : undefined;

  const month =
    params.month &&
    typeof params.month === "string" &&
    !isNaN(parseInt(params.month, 10))
      ? parseInt(params.month, 10)
      : currentMonth;

  const year =
    params.year &&
    typeof params.year === "string" &&
    !isNaN(parseInt(params.year, 10))
      ? parseInt(params.year, 10)
      : currentYear;

  const result = await getFilteredRecords({ walletId, month, year });
  const chartData = aggregateTransactions(result);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <OverviewHeader walletId={walletId} month={month} year={year} />
      <OverviewCards
        data={result.filter((res) =>
          isSameMonth(res.date, new Date(year, month)),
        )}
      />
      <OverviewChartArea data={chartData} />
    </main>
  );
}

type ChartData = {
  date: string;
  cashIn: number;
  cashOut: number;
};

function aggregateTransactions(
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
