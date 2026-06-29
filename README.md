# Ascendra Workspaces

A dashboard for managing developer virtual machines, built for the **Product
Design Engineer** take-home. It serves two deliberately different personas:

- **Developer** — a focused, personal view of *their own* VMs and resource usage.
- **Admin (DevOps/DevEx)** — a fleet-wide operations console: health, utilization,
  cost, inventory and templates.

The two experiences use different route groups, navigation, and visual treatment
so they never feel like the same screens.

---

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

```bash
pnpm build        # production build (must pass)
pnpm start        # serve the production build
pnpm test         # vitest (unit + one hook/integration test)
pnpm lint         # eslint (flat config)
```

> Requires Node 20+ and pnpm 9+ (`corepack enable pnpm` or `npm i -g pnpm`).

When the app loads, MSW (the in-browser mock backend) starts first — you'll
briefly see "Starting Ascendra mock environment…". Use the **persona switcher**
in the header to flip between Developer and Admin.

---

## Tech stack

| Concern        | Choice |
| -------------- | ------ |
| Framework      | Next.js 15 (App Router) + TypeScript (strict) |
| Package manager| pnpm |
| Styling        | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Data fetching  | TanStack Query v5 (all reads + mutations) |
| Mock backend   | MSW (Mock Service Worker) — in-memory, persists across the session |
| Charts         | Recharts |
| Forms          | react-hook-form + zod |
| Tests          | Vitest + Testing Library |

---

## Part A — interpretation, decisions, trade-offs

### How I read the brief

The brief is two products wearing one logo. The interesting work isn't the CRUD —
it's making the **mock backend feel real** (latency, errors, lifecycle state
machines that persist) and making the **two personas feel genuinely different**.
So I invested most effort there and in the four async states (loading / empty /
error / in-progress), and deliberately did **not** gold-plate breadth.

### Key decisions

> These are the calls I made where the brief was intentionally vague. Please skim
> and push back on any you'd have made differently.

1. **No auth → persona switcher in the header.** Persona is demo-state, persisted
   to `localStorage`, and derived from the route group (`(developer)` vs
   `(admin)`). Switching navigates to that persona's home. The "current developer"
   and "current admin" identities come from `GET /api/identity`, so nothing is
   hard-coded in components.

2. **Two different shells, not one shell with different links.** Developer gets an
   airy, centered, **top-nav** layout ("this is *your* workspace"). Admin gets a
   dense, full-width **sidebar console** ("Control Plane"). This is the strongest
   signal that they're distinct experiences.

3. **Domain models are a reconstruction.** The brief says to use the interfaces
   "verbatim", but the literal interface bodies weren't included in the prompt. I
   designed clean, well-reasoned ones in [`src/lib/api/types.ts`](src/lib/api/types.ts)
   (`VM`, `VMStatus`, `VMTemplate`, `User`, `Policy`, `FleetUtilization`, plus a
   few supporting types). Notable choices: `Policy` drives the idle heuristic;
   each VM stores denormalised `specs` + a derived `hourlyCost`.

4. **Idle / underused heuristic** — implemented as a documented, unit-tested util
   in [`src/lib/utils/idle.ts`](src/lib/utils/idle.ts). A VM is flagged idle when
   it is **running** *and* at least one of:
   - **Sustained low CPU**: the last `idleSustainedSamples` (default **6**) hourly
     samples are all below `idleCpuThresholdPct` (default **5%**). Sustained, not
     instantaneous, so a brief dip doesn't trip it.
   - **Stale activity**: `lastActiveAt` older than `staleActiveHours` (default 24h).

   The util returns human-readable **reasons** so the inventory can explain *why* a
   VM was flagged (shown on the "Idle" badge tooltip). Idle is computed
   **server-side** (in the MSW store, reusing the same util) so the client doesn't
   fetch 14 utilization series just to render a table.

5. **Cost model** — derived, not hard-coded, in
   [`src/lib/utils/cost.ts`](src/lib/utils/cost.ts). `hourlyCost = vCPU·$0.04 +
   memGB·$0.005 + diskGB·$0.0002`. Fleet hourly cost sums **running** VMs.
   - **Month-to-date** = `hourlyCost × hours-elapsed-this-month`. This is an
     explicit approximation — the mock has no historical billing ledger, so it
     assumes the current running set ran all month so far.
   - **Projected monthly** = `hourlyCost × 730` (avg hours/month).

6. **Lifecycle as a real state machine that persists.** The MSW store
   ([`src/lib/api/store.ts`](src/lib/api/store.ts)) lives in memory for the tab's
   lifetime. `start` → `starting` (~3s) → `running`; `stop` → `stopping` (~2s) →
   `stopped`; `restart` → `restarting` (~3.5s) → `running`. Transitions are real
   timers, invalid transitions are rejected (409), and a VM you start stays running
   across navigations and refetches. Important for a deployed demo.

7. **Optimistic + invalidate for lifecycle.** The mutation optimistically flips the
   VM into its transient state so controls react instantly, then invalidates so the
   server-authoritative settle is picked up. While transitioning, the detail query
   polls faster (1.5s) so the UI settles itself without a manual refresh.

8. **"Live" feel without a websocket.** Running VMs' usage snapshots jitter slightly
   on each read, and queries poll on an interval. Cheap, and good enough to feel
   alive.

9. **Errors are reachable by design.** Reads fail ~10% of the time (toggleable via
   `setErrorRate` in the store). Queries retry twice with backoff, so a single
   hiccup self-heals but a persistent failure still surfaces the **error state with
   a retry button**.

10. **Dark mode included** (cheap with shadcn tokens), class-based, persisted, with
    a system-preference default.

### Trade-offs / intentionally left out (time-box)

- **No real backend, auth, or persistence** beyond the in-memory session store.
- **No "create VM" flow** — templates are CRUD-able, but provisioning a VM from a
  template is out of scope. The data layer would support it trivially.
- **Targeted tests only** (idle util, cost calc, store lifecycle, one hook) — not
  full coverage. Components are largely untested by design.
- **Charts are functional, not bespoke** — a single shared `TimeSeriesChart`
  wrapper rather than per-view custom visuals.
- VM **detail is developer-scoped**; admins don't deep-link into it from the
  inventory (kept the personas cleanly separated).

### What I'd do next with more time

- A "provision VM" wizard (pick template → region → name) closing the loop.
- Bulk actions in the inventory (stop all idle, with a confirm) — the idle util
  already surfaces the candidates.
- Real cost history (a billing ledger in the store) so MTD isn't an approximation.
- A toast system for mutation success/failure instead of inline messages.
- More component-level tests (the lifecycle-controls disabled-state matrix) and a
  Playwright smoke test.
- Virtualize the inventory table for large fleets.

---

## Architecture

```
src/
  app/
    (developer)/my-machines/         # cards + [id] detail
    (admin)/{fleet,inventory,templates}/
    layout.tsx                       # global providers
    page.tsx                         # root → last-used persona
  lib/
    api/
      types.ts                       # domain models
      seed.ts                        # deterministic seed data
      store.ts                       # in-memory store + lifecycle + fleet rollups
      client.ts                      # typed fetch wrapper (throws ApiClientError)
      keys.ts                        # query-key factory
      hooks/                         # useVms, useVm, useFleetUtilization, useTemplates, mutations…
    utils/{cost,idle,format}.ts      # documented, tested utils
    validation/template.ts           # zod schema (mirrors server validation)
  mocks/{handlers,browser}.ts        # MSW REST API + worker
  components/
    ui/                              # shadcn primitives
    domain/                          # StatusBadge, UsageBar, MetricCard, DataTable, charts…
    shell/                           # the two persona shells, nav, persona switcher
    providers/                       # theme, query, MSW gate, persona
```

### The mock API (MSW)

All data flows through `fetch('/api/…')`, intercepted by MSW. Every handler adds
**300–800ms latency**; reads inject **~10% errors**.

| Method & path | Purpose |
| ------------- | ------- |
| `GET /api/identity` | current developer/admin ids |
| `GET /api/users` | all users |
| `GET /api/policy` | idle policy |
| `GET /api/vms?ownerId=` | VMs (optionally owner-scoped) |
| `GET /api/vms/:id` | one VM |
| `GET /api/vms/:id/utilization` | 24h hourly series |
| `POST /api/vms/:id/actions` | `{ action: start \| stop \| restart }` |
| `GET /api/fleet/utilization` | aggregate series + rollups + cost |
| `GET /api/fleet/inventory` | all VMs enriched with idle evaluation |
| `GET /api/templates` · `POST` · `PUT /:id` | template CRUD |

---

## Testing

```bash
pnpm test
```

- `cost.test.ts` — cost derivation, running-only summation, MTD/projection math.
- `idle.test.ts` — the idle heuristic (sustained CPU, staleness, non-running, custom policy).
- `store.test.ts` — seed shape + lifecycle transitions (fake timers) + template create.
- `hooks/vms.test.tsx` — a hook driven through the real client + MSW + store.

---

## Deploy to Vercel

This is a standard Next.js app; MSW runs **client-side**, so no server env is
needed.

1. Push this repo to GitHub/GitLab.
2. In Vercel, **New Project → Import** the repo.
3. Framework preset: **Next.js** (auto-detected). Build command `pnpm build`,
   install command `pnpm install`.
4. No environment variables required.
5. Deploy. The first load boots the MSW worker (`public/mockServiceWorker.js` is
   committed), then the dashboard is fully interactive.

> The committed `pnpm-workspace.yaml` uses `nodeLinker: hoisted` (npm-style flat
> `node_modules`) and disables a few optional native postinstall scripts — both
> are cross-platform and Vercel-safe.

---

## Notes

- `pnpm-workspace.yaml` pins `nodeLinker: hoisted`. This was chosen for robustness
  across environments (and to sidestep a symlink-resolution quirk on the Windows
  machine this was built on). It is fully portable.
- A persona switch is just a perspective change — there is no login. Treat the two
  personas as "what a developer sees" vs "what an admin sees".
