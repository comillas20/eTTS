"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEWalletsQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { getMonth, getYear } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { getMonthYears } from "../actions";

const months = [
  "Jaunary",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type OverviewHeaderProps = {
  walletId?: number;
  month?: number;
  year?: number;
};

export function OverviewHeader({ walletId, month, year }: OverviewHeaderProps) {
  const now = new Date();

  const monthYearsQuery = useQuery({
    queryKey: ["month-years", walletId],
    queryFn: async () => getMonthYears(walletId),
  });

  const years =
    monthYearsQuery.data && monthYearsQuery.data.length > 0
      ? Array.from(new Set(monthYearsQuery.data.map((y) => y.year)))
      : [getYear(now)];

  const eWalletQuery = useQuery(getEWalletsQuery());

  // check external data
  const validWalletId = eWalletQuery.data?.find((e) => e.id === walletId);

  const validYear = years.find((y) => y === year) || years[0];

  // available months based on selected year (validYear)
  const availableMonths = monthYearsQuery.data
    ?.filter((y) => y.year === validYear)
    .map((y) => y.month) || [getMonth(now)];

  const validMonth =
    typeof month === "number"
      ? availableMonths.includes(month)
        ? month
        : availableMonths[0]
      : availableMonths[0];

  const searchParams = useSearchParams();

  const router = useRouter();

  const onWalletChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") params.delete("wallet");
      else params.set("wallet", value);
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const onMonthChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", value);
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const onYearChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const firstAvailableMonth = monthYearsQuery.data
        ? monthYearsQuery.data.find((y) => y.year === parseInt(value, 10))
            ?.month || getMonth(new Date())
        : getMonth(new Date());
      params.set("year", value);
      params.set("month", String(firstAvailableMonth));
      router.push(`?${params.toString()}`);
    },
    [searchParams, router, monthYearsQuery.data],
  );

  return (
    <div className="flex justify-between gap-4">
      <Select
        value={validWalletId ? String(validWalletId.id) : "all"}
        onValueChange={onWalletChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {eWalletQuery.data?.map((eWallet) => (
            <SelectItem key={eWallet.id} value={String(eWallet.id)}>
              {eWallet.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Select value={String(validMonth)} onValueChange={onMonthChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((monthIndex) => (
              <SelectItem key={monthIndex} value={String(monthIndex)}>
                {months[monthIndex]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(validYear)} onValueChange={onYearChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
