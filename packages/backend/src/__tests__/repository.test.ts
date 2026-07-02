import { describe, it, expect } from "vitest";
import type { Ticket } from "@app/shared";
import { TicketQuerySchema } from "@app/shared";
import {
  filterTickets,
  sortTickets,
  paginateTickets,
  InMemoryTicketRepository,
} from "../repositories/inMemoryTicketRepository.js";

const tickets: Ticket[] = [
  { id: "T1", subject: "Login issue", requester: "Alice Chen", status: "open", priority: "low", createdAt: "2024-01-01T00:00:00.000Z", description: "d" },
  { id: "T2", subject: "Billing error", requester: "Bob Smith", status: "closed", priority: "urgent", createdAt: "2024-01-03T00:00:00.000Z", description: "d" },
  { id: "T3", subject: "Feature request", requester: "Chen Wu", status: "pending", priority: "medium", createdAt: "2024-01-02T00:00:00.000Z", description: "d" },
  { id: "T4", subject: "Password reset", requester: "Dana Lee", status: "resolved", priority: "high", createdAt: "2024-01-04T00:00:00.000Z", description: "d" },
  { id: "T5", subject: "App crash", requester: "Eve Adams", status: "open", priority: "urgent", createdAt: "2024-01-05T00:00:00.000Z", description: "d" },
];

describe("filterTickets", () => {
  it("matches search against subject or requester, case-insensitively", () => {
    const result = filterTickets(tickets, { search: "chen" });
    expect(result.map((t) => t.id)).toEqual(["T1", "T3"]);
  });

  it("filters by status", () => {
    const result = filterTickets(tickets, { status: "open" });
    expect(result.map((t) => t.id)).toEqual(["T1", "T5"]);
  });
});

describe("sortTickets", () => {
  it("sorts priority by ordinal, not alphabetically", () => {
    const result = sortTickets(tickets, "priority", "asc");
    expect(result.map((t) => t.priority)).toEqual(["low", "medium", "high", "urgent", "urgent"]);
  });

  it("sorts createdAt ascending and descending", () => {
    const asc = sortTickets(tickets, "createdAt", "asc").map((t) => t.id);
    const desc = sortTickets(tickets, "createdAt", "desc").map((t) => t.id);
    expect(asc).toEqual(["T1", "T3", "T2", "T4", "T5"]);
    expect(desc).toEqual(["T5", "T4", "T2", "T3", "T1"]);
  });
});

describe("paginateTickets", () => {
  it("computes page 2 correctly", () => {
    const sorted = sortTickets(tickets, "createdAt", "asc");
    const page2 = paginateTickets(sorted, 2, 2);
    expect(page2.map((t) => t.id)).toEqual(["T2", "T4"]);
  });
});

describe("InMemoryTicketRepository", () => {
  it("returns empty items with the correct total for an out-of-range page", async () => {
    const repo = new InMemoryTicketRepository(tickets);
    const result = await repo.findMany({
      sortBy: "createdAt",
      sortDir: "asc",
      page: 10,
      pageSize: 2,
    });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(5);
  });
});

describe("TicketQuerySchema", () => {
  it("applies defaults for an empty query", () => {
    const parsed = TicketQuerySchema.parse({});
    expect(parsed).toMatchObject({ sortBy: "createdAt", sortDir: "desc", page: 1, pageSize: 20 });
  });

  it("rejects an invalid status", () => {
    expect(TicketQuerySchema.safeParse({ status: "bogus" }).success).toBe(false);
  });

  it("rejects page=0", () => {
    expect(TicketQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });
});
