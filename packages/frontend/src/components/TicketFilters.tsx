import type { TicketQuery } from "@app/shared";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS: { value: NonNullable<TicketQuery["status"]> | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

interface TicketFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  status: TicketQuery["status"];
  onStatusChange: (status: TicketQuery["status"]) => void;
}

export function TicketFilters({ searchInput, onSearchInputChange, status, onStatusChange }: TicketFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Search by subject or requester..."
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
        className="sm:max-w-sm"
      />
      <Select
        value={status ?? "all"}
        onValueChange={(value) => onStatusChange(value === "all" ? undefined : (value as TicketQuery["status"]))}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
