import { z } from "zod";

export const TICKET_STATUSES = ["open", "pending", "resolved", "closed"] as const;
export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export const TicketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  requester: z.string(),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
  createdAt: z.string().datetime(),
  description: z.string(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const TicketQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  sortBy: z.enum(["createdAt", "priority"]).optional().default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type TicketQuery = z.infer<typeof TicketQuerySchema>;

export function createPagedResultSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  });
}

export const TicketPagedResultSchema = createPagedResultSchema(TicketSchema);
export type TicketPagedResult = z.infer<typeof TicketPagedResultSchema>;
