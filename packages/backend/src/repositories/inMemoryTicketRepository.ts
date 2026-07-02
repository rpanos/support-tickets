import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { TicketSchema, type Ticket, type TicketQuery, type TicketPagedResult } from "@app/shared";
import type { TicketRepository } from "./ticketRepository.js";

const FIXTURE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/tickets.fixture.json",
);

const PRIORITY_ORDER: Record<Ticket["priority"], number> = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3,
};

let cachedFixture: Ticket[] | undefined;

function loadFixtureTickets(): Ticket[] {
  if (!cachedFixture) {
    const raw: unknown[] = JSON.parse(readFileSync(FIXTURE_PATH, "utf-8"));
    cachedFixture = raw.map((item) => TicketSchema.parse(item));
  }
  return cachedFixture;
}

export function filterTickets(
  tickets: Ticket[],
  query: Pick<TicketQuery, "search" | "status">,
): Ticket[] {
  const search = query.search?.trim().toLowerCase();
  return tickets.filter((ticket) => {
    if (query.status && ticket.status !== query.status) return false;
    if (search) {
      const inSubject = ticket.subject.toLowerCase().includes(search);
      const inRequester = ticket.requester.toLowerCase().includes(search);
      if (!inSubject && !inRequester) return false;
    }
    return true;
  });
}

export function sortTickets(
  tickets: Ticket[],
  sortBy: TicketQuery["sortBy"],
  sortDir: TicketQuery["sortDir"],
): Ticket[] {
  const factor = sortDir === "asc" ? 1 : -1;
  return [...tickets].sort((a, b) => {
    if (sortBy === "priority") {
      return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * factor;
    }
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor;
  });
}

export function paginateTickets(tickets: Ticket[], page: number, pageSize: number): Ticket[] {
  const start = (page - 1) * pageSize;
  return tickets.slice(start, start + pageSize);
}

export class InMemoryTicketRepository implements TicketRepository {
  private readonly tickets: Ticket[];

  constructor(tickets: Ticket[] = loadFixtureTickets()) {
    this.tickets = tickets;
  }

  async findMany(query: TicketQuery): Promise<TicketPagedResult> {
    const filtered = filterTickets(this.tickets, query);
    const sorted = sortTickets(filtered, query.sortBy, query.sortDir);
    const items = paginateTickets(sorted, query.page, query.pageSize);

    return {
      items,
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}
