import {
  Pagination,
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

export function DatatablePagination<TData>({ table }: PaginationProps<TData>) {
  const currentPage = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const mid = Math.ceil((currentPage + 1 + pageCount) / 2);
  if (pageCount >= 2)
    return (
      <div className="flex items-center justify-end space-x-6">
        <span className="flex w-32 items-center justify-center text-sm font-medium">
          {`Page ${currentPage + 1} of ${pageCount}`}
        </span>
        <Pagination className="mx-0 flex w-fit items-center space-x-2">
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
            {mid !== 1 && mid !== pageCount && (
              <PaginationItem>
                <PaginationButton
                  disabled={mid === 1 || mid === pageCount}
                  onClick={() => table.setPageIndex(mid - 1)}>
                  {mid}
                </PaginationButton>
              </PaginationItem>
            )}
            {/* Last page */}
            {pageCount >= 3 && (
              <PaginationItem>
                <PaginationButton
                  isActive={!table.getCanNextPage()}
                  onClick={() => table.setPageIndex(pageCount - 1)}
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
        </Pagination>
      </div>
    );
}
