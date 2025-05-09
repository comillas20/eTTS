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
import { getYears } from "../actions";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

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

  const yearsQuery = useQuery({
    queryKey: ["years"],
    queryFn: getYears,
    placeholderData: [getYear(now)],
  });

  const years =
    yearsQuery.data && yearsQuery.data.length > 0
      ? yearsQuery.data
      : [getYear(now)];

  const eWalletQuery = useQuery(getEWalletsQuery());

  // check external data
  const validWalletId = eWalletQuery.data?.find((e) => e.id === walletId);
  const validMonth =
    typeof month === "number"
      ? month >= 0 && month < 12
        ? month
        : getMonth(now)
      : getMonth(now);
  const validYear = years.find((y) => y === year) || getYear(now);

  // const { searchParams } = new URL(window.location.href);
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
      params.set("year", value);
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
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
            {months.map((month, index) => (
              <SelectItem key={month} value={String(index)}>
                {month}
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
