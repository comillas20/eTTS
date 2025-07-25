import {
  getMonth,
  getYear,
  isAfter,
  isSameMonth,
  lastDayOfMonth,
  subDays,
} from "date-fns";
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

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <OverviewHeader walletId={walletId} month={month} year={year} />
      <OverviewCards
        data={result.filter((res) =>
          isSameMonth(res.date, new Date(year, month)),
        )}
      />
      <OverviewChartArea
        data={result.filter((result) =>
          isAfter(
            result.date,
            subDays(lastDayOfMonth(new Date(year, month)), 90),
          ),
        )}
        // Filter records to only include those from the specified month and 90 days ago, relative
      />
    </main>
  );
}
