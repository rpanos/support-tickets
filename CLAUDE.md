# CLAUDE.md

Project conventions for AI-assisted work on this repo.

## Architecture rules
- All ticket data access goes through the `TicketRepository` interface.
  Never import the fixture directly outside `inMemoryTicketRepository`.
- The Zod schemas in `@app/shared` are the single source of truth for the API
  contract. Backend validates inbound query params with them; frontend parses
  responses with them. Never hand-write a duplicate type.
- Search, filtering, sorting, and pagination are SERVER-SIDE concerns.
  No client-side filtering or sorting of ticket lists.
- `handler.ts` must stay pure Lambda: no Express, no dev-server imports.
  The dev server is an adapter around the handler, never the reverse.
- Priority sorts by ordinal (low < medium < high < urgent), never alphabetically.

## Conventions
- Conventional commits. One logical change per commit.
- shadcn/ui components only for UI primitives; Tailwind 4 for layout.
- TanStack Query for all server state; no useEffect fetching.
- Tests: Vitest, pure logic only.

## Commands
- `pnpm dev` — backend :3001 + frontend :5173
- `pnpm test` — backend test suite
