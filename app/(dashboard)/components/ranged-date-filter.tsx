import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarCheckIcon, CalendarIcon, RefreshCwIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

type RangedDateFilterProps = {
  dates: DateRange | undefined;
  onDateChange: (dates: DateRange | undefined) => void;
};

export function RangedDateFilter({
  dates,
  onDateChange,
}: RangedDateFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {dates ? <CalendarCheckIcon /> : <CalendarIcon />}
          <span className="hidden lg:inline">Transaction dates</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-fit flex-col p-0">
        <Calendar
          mode="range"
          selected={dates}
          onSelect={(dates) => {
            onDateChange(dates);
          }}
        />
        <Button
          className="m-3 mt-0"
          onClick={() => {
            onDateChange(undefined);
          }}
          variant="outline">
          <RefreshCwIcon />
          Reset
        </Button>
      </PopoverContent>
    </Popover>
  );
}
