import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { TICKET_STATUSES, TICKET_PRIORITIES, type Ticket } from "@app/shared";

const TICKET_COUNT = 200;
const SEED = 42;
const DAY_SPREAD = 90;

// Deterministic PRNG so re-running this script reproduces the same fixture.
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function pickWeighted<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1]![0];
}

// Small pool relative to TICKET_COUNT so several tickets share a requester —
// makes the search-by-requester demo obvious.
const REQUESTERS = [
  "Alice Chen", "Marcus Reed", "Priya Natarajan", "Diego Alvarez", "Sofia Kim",
  "James O'Malley", "Fatima Rahman", "Liam Novak", "Grace Osei", "Noah Bergström",
  "Elena Petrova", "Carlos Mendez", "Aisha Bello", "Ryan Whitfield", "Mei Tanaka",
  "Oliver Schmidt", "Zara Ahmed", "Lucas Ferreira", "Ingrid Larsen", "Tariq Hassan",
  "Chloe Dubois", "Ben Okafor", "Hana Suzuki", "Nadia Kowalski", "Ethan Brooks",
] as const;

const SUBJECTS = [
  "Unable to reset password",
  "Login page returns 500 error",
  "Invoice shows incorrect total",
  "Feature request: dark mode for dashboard",
  "Export to CSV is missing columns",
  "App crashes when uploading large files",
  "Cannot connect to API from mobile app",
  "Billing charged twice this month",
  "Need help configuring SSO",
  "Slow page load on reports tab",
  "Broken link in welcome email",
  "Two-factor authentication not sending codes",
  "Dashboard widget shows stale data",
  "Request to upgrade subscription plan",
  "Notification emails going to spam",
  "Data export stuck at 0%",
  "Typo in terms of service page",
  "API rate limit reached unexpectedly",
  "Unable to delete old account",
  "Search results missing recent tickets",
  "Integration with Slack not syncing",
  "Password reset email never arrives",
  "Mobile app freezes on startup",
  "Refund request for duplicate charge",
  "Team member cannot be invited",
  "Custom domain SSL certificate expired",
  "Timezone displayed incorrectly in reports",
  "Bulk import fails for CSV over 5MB",
  "Dark mode toggle not saving preference",
  "Webhook events arriving out of order",
] as const;

const DETAILS = [
  "Steps to reproduce are attached in the linked doc.",
  "Happens consistently on the latest browser version.",
  "Customer is on the enterprise plan and needs a fast turnaround.",
  "Screenshot attached showing the error state.",
  "Only reproducible on mobile Safari so far.",
  "Started after last week's release.",
  "Second time this has been reported this month.",
  "No workaround found yet.",
] as const;

const STATUS_WEIGHTS: Record<(typeof TICKET_STATUSES)[number], number> = {
  open: 35,
  pending: 25,
  resolved: 25,
  closed: 15,
};

const PRIORITY_WEIGHTS: Record<(typeof TICKET_PRIORITIES)[number], number> = {
  low: 30,
  medium: 35,
  high: 25,
  urgent: 10,
};

function buildDescription(subject: string, requester: string, priority: string): string {
  return `${requester} reported: "${subject}". ${pick(DETAILS)} Priority: ${priority}.`;
}

function randomCreatedAt(): string {
  const now = Date.now();
  const offsetMs = Math.floor(rand() * DAY_SPREAD * 24 * 60 * 60 * 1000);
  return new Date(now - offsetMs).toISOString();
}

const tickets: Ticket[] = Array.from({ length: TICKET_COUNT }, (_, i) => {
  const requester = pick(REQUESTERS);
  const subject = pick(SUBJECTS);
  const status = pickWeighted(STATUS_WEIGHTS);
  const priority = pickWeighted(PRIORITY_WEIGHTS);

  return {
    id: `TKT-${1000 + i}`,
    subject,
    requester,
    status,
    priority,
    createdAt: randomCreatedAt(),
    description: buildDescription(subject, requester, priority),
  };
});

const outPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "tickets.fixture.json",
);
writeFileSync(outPath, JSON.stringify(tickets, null, 2) + "\n");
console.log(`Wrote ${tickets.length} tickets to ${outPath}`);
