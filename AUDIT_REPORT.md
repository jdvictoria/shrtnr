# shrten Application Audit Report

**Audit date:** 2026-08-09
**Repository:** `jdvictoria/shrten`
**Branch:** `staging`
**Audited commit:** `468d4d42` (`feat: rebrand colors`)
**Audit type:** Read-only repository-wide architecture, security, reliability, and release-readiness review

## Executive summary

`shrten` is a compact Next.js URL-shortening application with a clear high-level architecture: PostgreSQL is the system of record, Redis serves the redirect hot path and rate limits, and Auth.js protects the account dashboard. The application includes anonymous and authenticated link creation, click analytics, password and geographic redirects, folders, tags, QR codes, bulk CSV creation, and an early teams implementation.

The current repository should be treated as a portfolio prototype rather than a production-ready public service. The most urgent blockers are unauthenticated link-management APIs, bypassable password protection, known vulnerable authentication/framework dependencies, and an incompatible Redis value written by the REST shortening endpoint. Team sharing is also incomplete and contains authorization defects. Build, lint, test, migration, and CI controls are not currently sufficient to establish release readiness.

## Scope and method

The audit covered:

- Repository structure, manifests, configuration, and documentation
- Authentication and dashboard protection
- Anonymous and authenticated link creation
- Redirect, expiration, password, and geographic-routing behavior
- Link management, folders, tags, analytics, and teams
- Prisma schema and Redis contracts
- REST APIs and server actions
- Dependency vulnerability status
- Type checking, linting, tests, migrations, and CI evidence
- Local secret-handling indicators

No source code, dependencies, application configuration, data, Git history, or external systems were changed. Live PostgreSQL, Redis, OAuth, Vercel, and production journeys were not exercised.

## Application architecture

### Runtime components

| Layer | Implementation | Responsibility |
|---|---|---|
| Web and API | Next.js 15 App Router | Public pages, dashboard, REST routes, server actions, and redirects |
| Authentication | Auth.js / NextAuth v5 | GitHub OAuth, credentials login, JWT sessions, and dashboard middleware |
| Source of truth | PostgreSQL through Prisma | Users, links, events, folders, tags, teams, and invitations |
| Cache and rate limiting | Upstash Redis | Cached redirect records and sliding-window request tracking |
| Interface | React 19, Tailwind, shadcn/ui | Public shortener and authenticated management UI |

The database model is defined in [`prisma/schema.prisma`](prisma/schema.prisma). Auth configuration is divided between [`auth.config.ts`](auth.config.ts) for edge-compatible middleware settings and [`auth.ts`](auth.ts) for providers, Prisma, and password verification.

### Link creation flow

The public form calls the `shortenUrl` server action in [`lib/actions.ts`](lib/actions.ts):

1. Derive the caller IP and apply a Redis rate limit.
2. Validate the destination and optional slug and expiration.
3. Read the current session, if present.
4. Hash an optional link password with bcrypt.
5. Insert the link and geographic rules in PostgreSQL.
6. Cache a `CachedLink` object in Redis for 30 days.
7. Return the slug to the browser for copying.

The authenticated dashboard uses a similar `createLink` server action and adds notes and folder assignment.

### Redirect flow

[`app/[slug]/route.ts`](app/%5Bslug%5D/route.ts) implements the redirect path:

1. Read `link:<slug>` from Redis.
2. On a miss, load the link and geographic rules from PostgreSQL and populate Redis.
3. Reject inactive or expired links.
4. Redirect password-protected links to `/pw/<slug>` unless an authorization cookie is present.
5. Select a country-specific destination using `x-vercel-ip-country`, when configured.
6. Start aggregate and per-click analytics writes.
7. Return an HTTP 302 redirect.

### Dashboard flow

`middleware.ts` and `app/dashboard/layout.tsx` require an Auth.js session. Server components call user-scoped server actions to load links and summary statistics. Client components invoke server actions for editing, deletion, pinning, activation, archiving, folders, tags, and team membership operations.

## Findings

### AUD-001 — Unauthenticated link-management APIs

**Severity:** Critical
**Status:** Open

The REST management endpoints do not authenticate the caller or enforce ownership:

- [`GET /api/links`](app/api/links/route.ts#L10) returns destination URLs and statistics across all users.
- [`GET /api/links/:id`](app/api/links/%5Bid%5D/route.ts#L27) returns the complete Prisma `Link` record. This can include `passwordHash`, notes, user, folder, and team identifiers.
- [`DELETE /api/links/:id`](app/api/links/%5Bid%5D/route.ts#L9) deletes a link solely by ID.
- [`GET /api/links/:id/stats`](app/api/links/%5Bid%5D/stats/route.ts#L9) exposes the complete link and recent analytics without ownership checks.

This contradicts the README, which describes these endpoints as authenticated and user-scoped.

**Recommended resolution:** Require a valid session on every management endpoint, scope database operations to the caller's user or authorized team membership, and return explicit response DTOs that never include password hashes or internal ownership fields.

### AUD-002 — Password protection can be bypassed

**Severity:** Critical
**Status:** Open

[`verifyLinkPassword`](lib/actions.ts#L416) sets the static cookie `pw_<slug>=1` after successful password comparison. The redirect route verifies only that this cookie exists; it does not authenticate its value, bind it to a user or browser session, or verify an expiry server-side.

An HTTP client can manually submit the same cookie and bypass the password. `httpOnly` prevents browser JavaScript from reading a server-issued cookie, but it does not prove that a received cookie was issued by the application. Password attempts are also not rate-limited.

**Recommended resolution:** Issue a signed, short-lived grant containing the slug and expiry, verify its signature on every redirect, use constant-time validation, and rate-limit attempts by link and client identity.

### AUD-003 — Vulnerable production dependencies

**Severity:** Critical
**Status:** Open

`npm audit --omit=dev --json` reported nine production dependency findings: two critical and seven high. Not every transitive finding is necessarily reachable, but the following direct dependencies overlap active security boundaries:

- `next-auth@5.0.0-beta.28` is within the affected range for an authentication-check fail-open advisory.
- `next@15.5.12` is within affected ranges for App Router middleware-bypass advisories while middleware is used to protect `/dashboard`.

Other reported packages included `@auth/core`, `@auth/prisma-adapter`, `nanoid`, `postcss`, `sharp`, `d3-color`, and `lodash`. Several are transitive or concern APIs not visibly used by the application, so reachability should be confirmed after upgrading the direct framework dependencies.

**Recommended resolution:** Upgrade Auth.js and Next.js to patched, compatible releases, regenerate the lockfile intentionally, rerun type/build/E2E validation, and repeat the production dependency audit.

### AUD-004 — REST shortening writes the wrong Redis value shape

**Severity:** High
**Status:** Open

[`POST /api/shorten`](app/api/shorten/route.ts#L81) writes only the destination string to `link:<slug>`. The redirect reader expects a `CachedLink` object containing `id`, `url`, `expiresAt`, `hasPassword`, `isActive`, and `geoRules`.

A newly created REST link can therefore produce an invalid redirect path until its Redis key is removed or expires and the route repopulates the correct object from PostgreSQL.

**Recommended resolution:** Centralize link creation and cache serialization so the public form, dashboard, REST endpoint, and bulk endpoint cannot drift. Validate cached data at runtime before use.

### AUD-005 — Team authorization is unsafe and shared links are incomplete

**Severity:** High
**Status:** Open

The team implementation has several separate problems:

- Invitation acceptance in [`lib/team-actions.ts`](lib/team-actions.ts#L111) does not compare the invitation email with the signed-in user's normalized email.
- Role updates and member removals verify that the caller is an administrator of the supplied team, but update/delete `memberId` globally without confirming that the member belongs to that same team.
- Existing membership can be overwritten with an invitation role, potentially demoting an existing administrator.
- No normal application path writes `Link.teamId`; the team page can display team links, but the UI and server actions cannot create them.
- The advertised admin/editor/viewer link permissions are not implemented. The generic personal-link mutation actions require personal ownership instead of team role authorization.
- There is no last-administrator invariant or server-side prohibition on self-demotion/removal.

**Recommended resolution:** Establish one team authorization policy, verify every target record belongs to the authorized team, bind invitations to normalized email identities, enforce role and last-admin invariants transactionally, and add explicit team-link creation and mutation paths.

### AUD-006 — Probable database credential in ignored local settings

**Severity:** High
**Status:** Open

The ignored and untracked `.claude/settings.local.json` file contains a credential-bearing PostgreSQL URI. No evidence was found that this file was committed to repository history, and the credential was not used during this audit.

**Recommended resolution:** Rotate the associated database credential, remove secret values from command-allowlist history, and replace them with placeholders or environment-variable references.

### AUD-007 — Build, lint, test, migration, and CI gates are incomplete

**Severity:** High
**Status:** Open

- TypeScript checking currently fails against generated Next route types because [`app/dashboard/layout.tsx`](app/dashboard/layout.tsx#L8) declares `searchParams`, which is not a valid layout prop.
- `npm run lint` invokes deprecated `next lint` and opens an interactive configuration prompt instead of linting.
- No automated test files, test runner configuration, or test scripts were found.
- No CI workflow was found.
- Prisma has no migration history; the repository relies on `prisma db push`.
- A full `next build` was not executed because it writes generated `.next` artifacts and this audit was explicitly read-only.

**Recommended resolution:** Correct the layout contract, establish non-interactive lint/type/build commands, add unit/integration/E2E coverage for security-critical flows, introduce versioned Prisma migrations, and enforce the commands in CI.

### AUD-008 — URL and slug validation is insufficient

**Severity:** Medium
**Status:** Open

- `new URL(...)` accepts schemes beyond `http:` and `https:`.
- Geographic rule URLs receive no equivalent server-side URL validation.
- Country codes are not normalized or schema-validated at the server boundary.
- Invalid date strings are not rejected explicitly.
- Application routes such as `dashboard`, `api`, `sign-in`, `sign-up`, `pw`, `not-found`, and `link-expired` are not reserved. A database record can be created for one of these aliases even though the fixed application route will take precedence.

**Recommended resolution:** Use shared schemas for HTTP(S)-only destinations, dates, country codes, and slugs, including a centralized reserved-slug registry.

### AUD-009 — Cross-tenant folder and tag integrity is not enforced

**Severity:** Medium
**Status:** Open

Authenticated link creation accepts `folderId` without checking that the folder belongs to the signed-in user. Editing similarly accepts arbitrary folder and tag identifiers after validating only link ownership in [`lib/actions.ts`](lib/actions.ts#L310).

This can create unauthorized cross-user relations when another identifier is obtained, causing integrity and metadata-count errors even where link query scoping prevents direct disclosure.

**Recommended resolution:** Resolve folder and tag identifiers through ownership-scoped queries before writing, preferably within the same transaction.

### AUD-010 — Authentication and expensive operations lack abuse controls

**Severity:** Medium
**Status:** Open

Credential sign-in, account creation, invitation creation/acceptance, and link-password verification do not have application-level rate limits. Password verification and registration perform bcrypt work and can be abused for resource consumption. Registration also reveals whether an email already exists and does not consistently normalize email before both lookup and storage.

**Recommended resolution:** Normalize identity fields centrally, add layered rate limits and lockout/backoff controls, bound password sizes, and decide whether registration should expose account existence.

### AUD-011 — Redirect analytics are not durable

**Severity:** Medium
**Status:** Open

The redirect handler starts a `Promise.all` containing two PostgreSQL writes, does not await it, and suppresses every error. In a serverless environment, work after the response is returned is not a durable delivery mechanism. The aggregate click increment and event insert are also independent, so they can diverge.

Referer URLs are stored directly and may contain sensitive path or query information. No retention, minimization, consent, or deletion policy is represented in the repository.

**Recommended resolution:** Send analytics to a durable queue or platform-supported deferred task, make aggregation idempotent, add observable failures, and define retention/minimization rules.

### AUD-012 — Redis failures have no graceful degradation

**Severity:** Medium
**Status:** Open

Redirects, shortening, and rate limiting call Redis without a fallback around connection or provider errors. A Redis outage can prevent redirects even though PostgreSQL remains available.

The sliding-window implementation also uses a pipeline rather than an atomic transaction/script while documentation describes the operation as atomic.

**Recommended resolution:** Define availability behavior for cache and limiter failures, fall back to PostgreSQL on cache errors where acceptable, and use an atomic provider-supported rate-limit primitive.

### AUD-013 — Accessibility and metadata gaps

**Severity:** Low
**Status:** Open

Several icon-only edit, copy, QR, remove, and overflow buttons do not provide accessible names. Public metadata globally permits indexing while dashboard protection relies mainly on authentication and `robots.txt`; explicit protected-route `noindex` metadata would be clearer. Sign-in and sign-up pages are also included in the sitemap despite limited search value.

**Recommended resolution:** Add accessible names to icon-only controls, validate keyboard/focus behavior, introduce automated accessibility checks, and define route-specific indexing policy.

## Documentation discrepancies

The README currently states or implies behavior not supported by the implementation:

- REST creation and management endpoints require authentication.
- All API queries are scoped to the authenticated user.
- Team invitations are scoped to the invited email.
- Team role permissions are enforced for shared links.
- Team links can be created and managed normally.
- Password cookies provide meaningful authorization rather than an unsigned presence check.
- All creation paths write the full Redis `CachedLink` object.
- The rate-limit pipeline is atomic.
- Fire-and-forget analytics are reliable enough for the stated click guarantees.

The README should be corrected after behavior is fixed so it describes verified implementation rather than intended design.

## Verification results

| Check | Result | Evidence |
|---|---|---|
| Prisma schema validation | Passed | `prisma validate` reported a valid schema |
| TypeScript | Failed | One invalid dashboard layout prop contract |
| Lint | Failed to run | Interactive ESLint setup prompt from `next lint` |
| Production dependency audit | Failed threshold | 2 critical, 7 high findings |
| Automated tests | Not available | No test files or runner configuration found |
| CI | Not available | No workflow found |
| Migration history | Not available | No `prisma/migrations` directory |
| Full production build | Not run | Excluded to preserve read-only scope |
| Live services and deployment | Not verified | No database, Redis, OAuth, or production mutations performed |

## Remediation order

1. Restrict or remove the unauthenticated link-management REST endpoints.
2. Replace the password-presence cookie with a signed, expiring authorization grant and rate-limit verification.
3. Rotate the credential present in local settings.
4. Upgrade vulnerable Auth.js and Next.js dependencies and repeat the audit.
5. Centralize link creation, validation, reserved slugs, and Redis serialization.
6. Repair team authorization and implement an intentional shared-link lifecycle.
7. Correct the layout type failure and establish lint, type, build, migration, and CI gates.
8. Add tests for API ownership, password bypass attempts, cache hit/miss behavior, team permissions, expiration, geo routing, and analytics delivery.
9. Add observability, durable analytics processing, Redis failure behavior, privacy retention, and accessibility verification.

## Release assessment

**Current assessment: Not ready for public production release.**

The application is suitable for continued local development and portfolio demonstration using non-sensitive data. Public deployment should wait until the critical authorization, password, dependency, and cache-contract findings are resolved and verified by automated tests and a production build.
