"use server";

import { Suspense } from "react";
import { getFilteredRecords } from "./actions";
import { OverviewCards } from "./components/overview-cards";
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

  const result = await getFilteredRecords({ walletId, month, year });

  console.log(result);
  // TODO: Try getting the data here (years & wallets), pass it in the overview header and do magic there
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Suspense fallback={<div className="h-4 animate-pulse"></div>}>
        <OverviewHeader walletId={walletId} month={month} year={year} />
      </Suspense>

      <OverviewCards data={result} />
    </main>
  );
}
