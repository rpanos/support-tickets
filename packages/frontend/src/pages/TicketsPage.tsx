import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { TicketQuery } from "@app/shared";
import { getTickets } from "@/api/tickets";
import { TicketsTable } from "@/components/TicketsTable";
import { TableSkeleton } from "@/components/TableSkeleton";

const PAGE_SIZE = 20;

export function TicketsPage() {
  const [sortBy, setSortBy] = useState<TicketQuery["sortBy"]>("createdAt");
  const [sortDir, setSortDir] = useState<TicketQuery["sortDir"]>("desc");
  const [page] = useState(1);

  const query: TicketQuery = { sortBy, sortDir, page, pageSize: PAGE_SIZE };

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

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-semibold">Support Tickets</h1>

      <div className="mt-6">
        {isLoading ? (
          <TableSkeleton rows={PAGE_SIZE} />
        ) : (
          <TicketsTable tickets={data?.items ?? []} sortBy={sortBy} sortDir={sortDir} onToggleSort={toggleSort} />
        )}
      </div>
    </div>
  );
}
