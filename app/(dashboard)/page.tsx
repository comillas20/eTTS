import {
  getMonth,
  getYear,
  isSameMonth,
  lastDayOfMonth,
  subDays,
} from "date-fns";
import { getRecords } from "./actions/records";
import { OverviewCards } from "./components/overview-cards";
import { OverviewChartArea } from "./components/overview-chart-area";
import { OverviewHeader } from "./components/overview-header";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

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
      : undefined;

  const year =
    params.year &&
    typeof params.year === "string" &&
    !isNaN(parseInt(params.year, 10))
      ? parseInt(params.year, 10)
      : undefined;

  const hasSelectedYear = typeof year === "number";
  const hasSelectedMonth = typeof month === "number";
  const selectedDate =
    hasSelectedMonth || hasSelectedYear
      ? lastDayOfMonth(
          new Date(
            hasSelectedYear ? year : getYear(Date.now()),
            hasSelectedMonth ? month : getMonth(Date.now()),
          ),
        )
      : undefined;
  const latestRecord = await getRecords({ walletId, limit: 1 });

  // only prioritize latestRecord's date if it exists, and if there was no selected month / year
  const targetDate =
    !selectedDate && latestRecord.success && latestRecord.data.length > 0
      ? latestRecord.data[0].date
      : selectedDate!;
  targetDate.setHours(23, 59, 59);

  const range = 90;
  const result = await getRecords({
    walletId,
    range: { startDate: subDays(targetDate, range), endDate: targetDate },
  });

  const records = result.success ? result.data : [];
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <OverviewHeader walletId={walletId} month={month} year={year} />
      <OverviewCards
        data={records.filter((res) => isSameMonth(targetDate, res.date))}
      />
      <OverviewChartArea data={records} />
    </main>
  );
}
