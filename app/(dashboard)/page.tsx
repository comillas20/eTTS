import { getMonth, getYear, isSameMonth, lastDayOfMonth } from "date-fns";
import { getFilteredRecords } from "./actions";
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

  const targetDate = lastDayOfMonth(
    new Date(
      typeof year === "number" ? year : getYear(Date.now()),
      typeof month === "number" ? month : getMonth(Date.now()),
    ),
  );
  targetDate.setHours(23, 59, 59);

  const result = await getFilteredRecords({ walletId, targetDate });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <OverviewHeader walletId={walletId} month={month} year={year} />
      <OverviewCards
        data={result.filter((res) => isSameMonth(targetDate, res.date))}
      />
      <OverviewChartArea data={result} />
    </main>
  );
}
