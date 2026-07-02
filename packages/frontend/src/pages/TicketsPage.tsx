import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { TicketQuery } from "@app/shared";
import { getTickets } from "@/api/tickets";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { TicketsTable } from "@/components/TicketsTable";
import { TableSkeleton } from "@/components/TableSkeleton";
import { TicketFilters } from "@/components/TicketFilters";
import { TablePagination } from "@/components/TablePagination";

const PAGE_SIZE = 20;

export function TicketsPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = useState<TicketQuery["status"]>(undefined);
  const [sortBy, setSortBy] = useState<TicketQuery["sortBy"]>("createdAt");
  const [sortDir, setSortDir] = useState<TicketQuery["sortDir"]>("desc");
  const [page, setPage] = useState(1);

  const query: TicketQuery = {
    search: debouncedSearch || undefined,
    status,
    sortBy,
    sortDir,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", query],
    queryFn: () => getTickets(query),
    placeholderData: keepPreviousData,
  });

  function toggleSort(column: "createdAt" | "priority") {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDir("desc");
      return;
    }
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  function handleStatusChange(next: TicketQuery["status"]) {
    setStatus(next);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold">Support Tickets</h1>

      <div className="mt-6">
        <TicketFilters
          searchInput={searchInput}
          onSearchInputChange={handleSearchInputChange}
          status={status}
          onStatusChange={handleStatusChange}
        />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <TableSkeleton rows={PAGE_SIZE} />
        ) : (
          <TicketsTable tickets={data?.items ?? []} sortBy={sortBy} sortDir={sortDir} onToggleSort={toggleSort} />
        )}
      </div>

      <TablePagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
    </div>
  );
}
