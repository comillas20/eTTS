import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMonth } from "date-fns";

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

const currentMonth = getMonth(new Date());

type MonthSelectProps = {
  month?: number;
  onMonthChange: (month: number) => void;
};
export function MonthSelect({
  month = currentMonth,
  onMonthChange,
}: MonthSelectProps) {
  return (
    <Select
      value={String(month)}
      onValueChange={(value) => onMonthChange(parseInt(value, 10))}>
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
  );
}
