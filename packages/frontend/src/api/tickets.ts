import { TicketPagedResultSchema, type TicketPagedResult, type TicketQuery } from "@app/shared";

export function buildTicketsSearchParams(query: TicketQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  params.set("sortBy", query.sortBy);
  params.set("sortDir", query.sortDir);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params;
}

export async function getTickets(query: TicketQuery): Promise<TicketPagedResult> {
  const response = await fetch(`/api/tickets?${buildTicketsSearchParams(query)}`);

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => ({}));
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return TicketPagedResultSchema.parse(await response.json());
}
