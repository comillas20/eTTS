import {
  Pagination as P,
  PaginationButton,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Table } from "@tanstack/react-table";

type PaginationProps<TData> = {
  table: Table<TData>;
};

export function Pagination<TData>({ table }: PaginationProps<TData>) {
  const currentPage = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const mid = Math.floor((currentPage + 1 + pageCount) / 2);
  if (pageCount >= 2)
    return (
      <div className="flex items-center justify-end px-2">
        <div className="flex items-center space-x-6">
          <div className="flex w-32 items-center justify-center text-sm font-medium">
            {`Page ${currentPage + 1} of ${pageCount}`}
          </div>
          <P className="flex items-center space-x-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationButton
                  isActive={!table.getCanPreviousPage()}
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}>
                  1
                </PaginationButton>
              </PaginationItem>
              {/* Middle, always active except on first page and last page */}
              <PaginationItem>
                <PaginationButton
                  isActive={
                    table.getCanPreviousPage() && table.getCanNextPage()
                  }
                  disabled={
                    table.getCanPreviousPage() && table.getCanNextPage()
                  }
                  onClick={() => table.setPageIndex(currentPage)}>
                  {mid === 1 ? 2 : mid}
                </PaginationButton>
              </PaginationItem>
              {/* Last page */}
              {pageCount >= 3 && (
                <PaginationItem>
                  <PaginationButton
                    isActive={!table.getCanNextPage()}
                    onClick={() => table.setPageIndex(pageCount)}
                    disabled={!table.getCanNextPage()}>
                    {pageCount}
                  </PaginationButton>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                />
              </PaginationItem>
            </PaginationContent>
          </P>
        </div>
      </div>
    );
}
