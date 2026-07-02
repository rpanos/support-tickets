import type { Ticket, TicketQuery } from "@app/shared";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type SortableColumn = "createdAt" | "priority";

interface TicketsTableProps {
  tickets: Ticket[];
  sortBy: TicketQuery["sortBy"];
  sortDir: TicketQuery["sortDir"];
  onToggleSort: (column: SortableColumn) => void;
  onRowClick: (ticket: Ticket) => void;
}

const STATUS_LABEL: Record<Ticket["status"], string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_LABEL: Record<Ticket["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function SortIcon({ active, dir }: { active: boolean; dir: TicketQuery["sortDir"] }) {
  if (!active) return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
  return dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
}

function SortableHead({
  label,
  column,
  sortBy,
  sortDir,
  onToggleSort,
}: {
  label: string;
  column: SortableColumn;
  sortBy: TicketQuery["sortBy"];
  sortDir: TicketQuery["sortDir"];
  onToggleSort: (column: SortableColumn) => void;
}) {
  return (
    <TableHead>
      <button
        type="button"
        className="flex items-center gap-1 hover:text-foreground"
        onClick={() => onToggleSort(column)}
      >
        {label}
        <SortIcon active={sortBy === column} dir={sortDir} />
      </button>
    </TableHead>
  );
}

export function TicketsTable({ tickets, sortBy, sortDir, onToggleSort, onRowClick }: TicketsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>Requester</TableHead>
          <TableHead>Status</TableHead>
          <SortableHead label="Priority" column="priority" sortBy={sortBy} sortDir={sortDir} onToggleSort={onToggleSort} />
          <SortableHead
            label="Created Date"
            column="createdAt"
            sortBy={sortBy}
            sortDir={sortDir}
            onToggleSort={onToggleSort}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id} className="cursor-pointer" onClick={() => onRowClick(ticket)}>
            <TableCell className="font-medium">{ticket.subject}</TableCell>
            <TableCell>{ticket.requester}</TableCell>
            <TableCell>{STATUS_LABEL[ticket.status]}</TableCell>
            <TableCell>{PRIORITY_LABEL[ticket.priority]}</TableCell>
            <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
