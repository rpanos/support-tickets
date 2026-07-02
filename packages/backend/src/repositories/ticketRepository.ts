import type { TicketQuery, TicketPagedResult } from "@app/shared";

export interface TicketRepository {
  findMany(query: TicketQuery): Promise<TicketPagedResult>;
}
