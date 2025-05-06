"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getMonth, getYear } from "date-fns";
import { getYears } from "../actions";
import { getEWalletsQuery } from "@/lib/queries";

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

export function OverviewHeader() {
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

  return (
    <div className="flex justify-between gap-4">
      {eWalletQuery.data && (
        <Select defaultValue={eWalletQuery.data[0].name}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {eWalletQuery.data.map((eWallet) => (
              <SelectItem key={eWallet.id} value={eWallet.name}>
                {eWallet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex gap-2">
        <Select defaultValue={months[getMonth(now)]}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue={String(years[0])}>
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
