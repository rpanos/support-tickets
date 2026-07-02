# Support Tickets

## Run it

```
pnpm install
pnpm dev          # http://localhost:5173
pnpm test
```

Requires Node 20+ and pnpm. Nothing else — no Docker, no AWS account, no
network calls beyond `pnpm install`.

## What's here

A React + Vite + TypeScript + Tailwind 4 + shadcn/ui frontend talks to a
TypeScript Lambda handler through a thin local dev-server adapter that stands
in for API Gateway. Both sides share one Zod contract (`packages/shared`) for
the ticket shape and query params, so there's no drift between what the
backend validates and what the frontend parses. Ticket data lives in a
200-row JSON fixture behind a repository interface, ready to swap for a real
datastore — see the DocumentDB design below.

## Design decisions & tradeoffs

- **Repo structure — pnpm workspace with `frontend`, `backend`, `shared`
  packages.** Frontend and backend have disjoint dependency trees, so I gave
  them real package boundaries; `shared` holds the Zod contract both sides
  import.
- **Lambda runtime — pure `APIGatewayProxyEventV2` handler + a ~30-line Node
  adapter dev server; `template.yaml` committed as an artifact of intent,
  never deployed.** The handler is genuinely Lambda-shaped; the dev server
  just fakes what API Gateway does. Point `sam deploy` at the template
  tomorrow and `handler.ts` doesn't change.
- **API design — full server-side search, status filter, sort, and
  pagination.** Ticketing is a high-volume domain, so I treated the dataset
  as too big to ship to the client. All filtering, sorting, and pagination
  are server-side — which also made the DocumentDB bonus concrete: my query
  params map 1:1 to the indexes I proposed.
- **Data layer — repository pattern, `InMemoryTicketRepository` backed by a
  ~200-ticket fixture, no Mongo runtime.** The spec explicitly blesses an
  in-memory fixture. The repository interface is the seam where
  `DocumentDbTicketRepository` plugs in — see the bonus writeup.
- **Table — plain shadcn/ui `<Table>` primitive, no TanStack Table.** My
  design pushes sorting and pagination to the API, leaving a headless
  client-side table engine with nothing to do. I'd reach for TanStack Table
  if requirements grew client-heavy: column visibility, row selection,
  inline editing.
- **Search UX — debounced input (~300ms) + `placeholderData:
  keepPreviousData`.** Debounce cuts request volume; `keepPreviousData` keeps
  the table stable between keystrokes and page changes.
- **Detail view — shadcn `Sheet` on desktop, `Drawer` on mobile.** The spec
  called out responsiveness and listed Dialog/Drawer as options — I read
  that as an invitation to use the right surface per viewport.
- **Validation — Zod schemas in `shared`, used on both sides.** TypeScript
  types are erased at runtime — they can't protect the network boundary. One
  Zod schema is both the runtime validator and the source of the static
  type, so the contract can't drift.
- **Error states — persistent `Alert` + Retry for hard failures, a toast for
  soft ones.** Hard failures get persistent UI because a toast auto-dismisses
  and leaves a dead page. Soft failures get a toast because the user still
  has usable data.
- **Tests — one tight Vitest suite on pure logic, no UI snapshot tests.** I
  tested the logic that can silently break — search matching, the priority
  ordinal sort, pagination math — and skipped snapshot noise.

Known trap I made sure to get right: priority sorts by ordinal
(`low < medium < high < urgent`), never alphabetically.

## Production design: Lambda + DocumentDB (bonus)

### Data model

One document per ticket in a `tickets` collection — the entity is
self-contained and there are no joins to model. `status` and `priority` are
short string enums; `createdAt` is a real BSON `Date`, not a string, so range
queries and sorts stay native.

```json
{
  "_id": "TKT-1042",
  "subject": "Unable to reset password",
  "requester": "Alice Chen",
  "status": "open",
  "priority": "high",
  "createdAt": "2026-04-12T15:04:00Z",
  "description": "..."
}
```

### The seam

`DocumentDbTicketRepository implements TicketRepository` — `handler.ts`
doesn't change. Query params translate to a Mongo filter + sort +
skip/limit; `total` comes from `countDocuments` on the same filter so the
count and the page always agree.

### Search strategy

A naive `$regex /term/i` contains-match can't use a B-tree index (it's
unanchored and case-insensitive), so it degrades to a collection scan — fine
at 10k documents, not at 10M. Three real options, in order of effort:

- **Text index** on `subject` + `requester` with `$text` — token/word-boundary
  matching, one text index per collection. My pick for this feature as
  specced.
- **Lowercase shadow fields** (`subject_lc`, `requester_lc`) plus an anchored
  prefix regex — index-eligible, and the right shape for typeahead
  semantics.
- **CDC → OpenSearch** once search needs to be true full-text/fuzzy at scale.
  I've built the eventing side of this pattern before — change streams or
  stream-to-queue fan-out — so this isn't a hand-wave.

### Indexes

Compound `{ status: 1, createdAt: -1 }` for the filtered-list access
pattern — equality field first, then the sort field, so one index serves
both the filter and the sort without an in-memory sort stage. Add the text
index (or the lowercase shadow-field indexes) for whichever search strategy
above gets used. `{ priority: 1, createdAt: -1 }` only if priority-sorted
views turn out to be hot in practice — I wouldn't index it speculatively.

### Lambda-specific realities

DocumentDB is VPC-only, so the Lambda needs VPC config (ENI attachment, and
the cold-start cost that comes with it); the Mongo client has to be cached
*outside* the handler so it's reused across warm invocations instead of
reconnecting every call; TLS is required; and credentials come from Secrets
Manager, not environment variables.

## How this was built

Built with an AI-assisted workflow (Claude for architecture planning, Claude
Code for implementation), one reviewed commit at a time — the git history
tells the story, and CLAUDE.md documents the conventions the work was held
to. Every decision above is mine and I'm happy to defend any of them.

## With more time

- URL-synced filter/sort/page state (shareable views)
- Frontend component tests (React Testing Library)
- Cursor-based pagination for deep result sets
