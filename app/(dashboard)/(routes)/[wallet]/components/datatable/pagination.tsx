import { Table } from "@tanstack/react-table";
import {
  Pagination as P,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type PaginationProps<TData> = {
  table: Table<TData>;
};

export function Pagination<TData>({ table }: PaginationProps<TData>) {
  return (
    <div className="flex items-center justify-end px-2">
      <div className="flex items-center space-x-6">
        {table.getPageCount() > 0 && (
          <div className="flex w-32 items-center justify-center text-sm font-medium">
            {`Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
          </div>
        )}
        <div className="flex items-center space-x-2">
          <P>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </P>
        </div>
      </div>
    </div>
  );
}
