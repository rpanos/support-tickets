import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import type { Ticket, TicketQuery, TicketPagedResult } from "@app/shared";
import { getTickets } from "@/api/tickets";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { TicketsTable } from "@/components/TicketsTable";
import { TableSkeleton } from "@/components/TableSkeleton";
import { TicketFilters } from "@/components/TicketFilters";
import { TablePagination } from "@/components/TablePagination";
import { TicketDetailSheet } from "@/components/TicketDetailSheet";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function TicketsPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = useState<TicketQuery["status"]>(undefined);
  const [sortBy, setSortBy] = useState<TicketQuery["sortBy"]>("createdAt");
  const [sortDir, setSortDir] = useState<TicketQuery["sortDir"]>("desc");
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Last successfully fetched page, kept on screen through a failed
  // background refetch (soft failure) instead of being wiped by the error.
  const [lastGoodData, setLastGoodData] = useState<TicketPagedResult | null>(null);

  const query: TicketQuery = {
    search: debouncedSearch || undefined,
    status,
    sortBy,
    sortDir,
    page,
    pageSize: PAGE_SIZE,
  };

  const {
    data,
    isLoading,
    isError,
    error,
    errorUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["tickets", query],
    queryFn: () => getTickets(query),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (data) setLastGoodData(data);
  }, [data]);

  useEffect(() => {
    if (isError && lastGoodData) {
      toast.error(errorMessage(error));
    }
    // Only re-fire when a new error actually lands, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorUpdatedAt]);

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

  function handleClearFilters() {
    setSearchInput("");
    setStatus(undefined);
    setPage(1);
  }

  const isHardFailure = isError && !lastGoodData;
  const items = lastGoodData?.items ?? [];
  const isEmpty = !isLoading && !isHardFailure && items.length === 0;

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
        ) : isHardFailure ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Couldn't load tickets</AlertTitle>
            <AlertDescription>{errorMessage(error)}</AlertDescription>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </Alert>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <p className="text-muted-foreground">No tickets match your filters.</p>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <TicketsTable
            tickets={items}
            sortBy={sortBy}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            onRowClick={setSelectedTicket}
          />
        )}
      </div>

      {!isHardFailure && (
        <TablePagination page={page} pageSize={PAGE_SIZE} total={lastGoodData?.total ?? 0} onPageChange={setPage} />
      )}

      <TicketDetailSheet
        ticket={selectedTicket}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
      />
    </div>
  );
}
