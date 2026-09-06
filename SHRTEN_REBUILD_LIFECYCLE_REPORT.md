# shrten Rebuild and Workflow Lifecycle Report

**Report date:** 2026-08-09
**Repository:** `jdvictoria/shrten`
**Branch reviewed:** `staging`
**Reviewed commit:** `468d4d42` (`feat: rebrand colors`)
**Report type:** Read-only lifecycle gap analysis and clean-rebuild strategy

## Executive decision

`shrten` will be treated as a valuable legacy prototype and product reference. It will not be incrementally converted into the governed architecture.

The approved direction is to:

- Preserve the current repository as the legacy implementation and portfolio evidence.
- Start a clean, parallel `shrten-v2` repository through `/kickstart`.
- Rebuild it as a production-capable, web-only personal and open-source product without initial billing.
- Use personal and organization workspaces as the tenancy model.
- Retain anonymous shortening through temporary, claimable anonymous links.
- Preserve the recognizable shortening workflow and useful core features while replacing the security, authorization, data, analytics, testing, and delivery foundations.
- Defer native mobile applications, billing, landing-page builders, and AI features until the redirect and analytics system is reliable.

The existing [`AUDIT_REPORT.md`](AUDIT_REPORT.md) remains the repository-wide architecture, security, reliability, and release-readiness audit. It is discovery evidence for the rebuild, not a canonical schema-v2 `/kickstart-audit` artifact and cannot be supplied directly to `/kickstart-resolve`.

## Approved product and architecture decisions

| Decision | Approved selection | Consequence |
|---|---|---|
| Repository strategy | Parallel clean `shrten-v2` repository | Retains legacy history and avoids pretending an in-place retrofit is a one-time kickstart baseline |
| Product posture | Production-capable personal/open-source project | Builds a credible public portfolio product without introducing commercial billing requirements |
| Client topology | Web-only | Uses a public web experience and authenticated dashboard without premature mobile scope |
| Tenancy | Personal plus organization workspaces | Unifies personal ownership and team collaboration under one authorization model |
| Anonymous links | Temporary and claimable | Preserves low-friction shortening while creating a bounded ownership and abuse-control path |

These decisions are approved product input for the future `/kickstart` and `/document` interviews. They do not by themselves initialize a repository or establish canonical product, technical, or design authority.

## Lifecycle assessment

The current application is a **pre-governance legacy repository**, not a failed `/kickstart` project.

| Lifecycle stage | Current state | Result |
|---|---|---|
| `/kickstart` | No kickstart blueprint, Bun monorepo, business manifest, generated workers, or baseline evidence | Ineligible in place; initialize a clean repository |
| `/document` | No canonical PRD, TRD, traceability package, or approval ledger | Product and technical decisions are not installed authority |
| `/vibes` | Existing branding exists, but no approved design baseline | Useful reference, not canonical design authority |
| `/develop` | Legacy features were implemented without governed specifications and change records | No durable decision-to-code traceability |
| `/document-audit` | No canonical document package exists | Cannot run until `/document` produces the initial package |
| `/kickstart-audit` | The existing audit is handcrafted and repository-wide rather than feature-specific schema-v2 evidence | Cannot feed a resolver directly |
| `/vibes-audit` | No Vibes baseline or canonical feature audit exists | Ineligible until the earlier lifecycle stages are complete |
| `/release` | No verified build, tests, CI, preview, rollback, or release evidence | Not release-ready |
| `/operate` | No backup, restore, secret rotation, retention, dependency, or cost procedures | Operational authority is absent |
| `/incident` | No severity contract, incident record, communication plan, or recovery evidence | Must be established before a public production launch |

The formal lifecycle must begin in a clean repository because `/kickstart` is a one-time initialization workflow, not a legacy retrofitting tool.

## Core product capabilities to retain

The rebuilt product should preserve:

- Anonymous and authenticated short-link creation
- Custom aliases
- Editable destinations
- Activation, expiration, archiving, and pinning
- Password-protected links
- Geographic routing
- Country, browser, device, referrer, and time-based analytics
- QR generation and downloads
- CSV bulk creation
- Folders, tags, and notes
- GitHub and email authentication
- Teams, roles, and invitations
- Redis-backed redirect acceleration and rate limiting
- A documented management API

This is already a meaningful product surface. The rebuild should improve the trust boundaries and operating model without reducing `shrten` to a basic redirect demo.

## Recommended target architecture

```text
shrten.app
    |
    v
Next.js web application
marketing + authenticated dashboard
    | authenticated generated API client
    v
api.shrten.app -----------> Supabase Postgres/Auth
Hono /v1 API                    |
    |                           `-- RLS, migrations, audit data
    |
    |-- Upstash Redis
    |   redirect cache + rate limits
    |
    `-- QStash
        durable analytics + webhooks

s.shrten.app/:slug
    |
    `-- Hono redirect runtime
        Redis -> database fallback -> redirect
```

### Foundation

- Bun and Turborepo modular monolith
- `apps/web`: Next.js public site and authenticated dashboard
- `apps/api`: Hono management API and latency-sensitive redirect runtime
- Supabase Auth and PostgreSQL as the source of truth
- Row Level Security on every exposed tenant resource, with explicit grants and indexed authorization predicates
- Server-only privileged operations in private functions or RPCs
- Upstash Redis accessible only through the API
- QStash only for durable click ingestion, webhooks, and scheduled work that genuinely require it
- Zod request/response schemas, versioned `/v1` endpoints, OpenAPI, and generated client DTOs
- Bun API tests, pgTAP authorization tests, and Playwright browser tests
- Separate Vercel web and API projects
- A dedicated redirect hostname to isolate the redirect hot path from the dashboard and marketing application

Authorization should become a database-enforced per-operation contract rather than a collection of application-side ownership checks. Service-role credentials must remain server-only, and privileged database helpers must not be exposed through ordinary client data access.

### Cleaner ownership model

Every authenticated link should belong to a workspace instead of using separate nullable user and team ownership fields.

Recommended primary resources:

- `profiles`
- `workspaces`
- `workspace_members`
- `workspace_invitations`
- `links`
- `routing_rules`
- `folders`
- `tags`
- `link_tags`
- `domains`
- `redirect_events`
- `analytics_aggregates`
- `api_keys`
- `webhooks`
- `webhook_deliveries`
- `audit_events`
- A job or idempotency ledger

A personal workspace gives each account private ownership. Organization workspaces provide shared links and roles through the same policy model.

The precise anonymous-link lifetime, claim-token behavior, cleanup schedule, and pre-claim management rights remain requirements to define during `/document`; only the temporary-and-claimable product direction is approved.

## Required improvements

### Security and tenancy

- Authenticate every management endpoint.
- Scope browser sessions and API keys to an authorized workspace.
- Return explicit DTOs that cannot expose password hashes or internal ownership fields.
- Replace cookie-presence password checks with signed, short-lived access grants.
- Rate-limit sign-in, registration, password attempts, invitations, anonymous creation, and bulk operations.
- Enforce invitation email binding, tenant membership, target-record ownership, and last-owner invariants.
- Validate HTTP(S)-only destinations, country codes, date values, and reserved slugs.
- Add abuse reporting, administrative takedown, disabled-link reasons, and immutable audit events.

### Reliability and privacy

- Use one link service for dashboard, API, bulk, and anonymous creation so cache representations cannot drift.
- Use versioned cache keys and validate cached values at runtime.
- Fall back to PostgreSQL when redirect-cache reads fail.
- Fail closed when an abuse-protection dependency cannot safely degrade.
- Send click events through durable, observable, idempotent work.
- Prevent click-event and aggregate-count divergence.
- Minimize referrer collection and define retention, export, deletion, and consent rules.
- Keep product analytics separate from redirect-domain analytics.
- Do not treat provider logs or PostHog as the redirect analytics source of truth.

### Engineering and delivery quality

- Versioned SQL migrations
- RLS and authorization tests for every operation and role
- Redirect, password, expiration, routing, and cache-failure integration tests
- API contract, scope, and idempotency tests
- Dashboard and anonymous-link Playwright journeys
- Non-interactive lint, typecheck, build, dependency, and security checks
- CI evidence and reproducible local validation
- Health and readiness endpoints
- Preview and production deployment evidence
- Rollback procedures and operational runbooks

## Additional feature roadmap

### Tier 1: Responsible public foundation

- Anonymous link claim flow
- Abuse reports and administrative takedown
- Blocked-domain and dangerous-destination controls
- Scoped API keys and idempotency keys
- Data export, deletion, and retention controls
- Link health monitoring and destination-failure alerts

### Tier 2: Strong portfolio differentiators

- Verified custom domains
- Campaign and UTM templates
- Device-specific routing
- Scheduled activation and fallback destinations
- Webhook event delivery
- SVG and PNG branded QR codes
- Opt-in public statistics

Branded domains, bulk operations, UTM tools, QR customization, exports, API access, webhooks, geographic/device routing, password protection, public analytics, and workspace permissions are established expectations in the current short-link market. Relevant official references include [Bitly pricing and capabilities](https://bitly.com/pages/pricing), [Dub link features](https://dub.co/help/article/dub-links), [Dub's create-link API](https://dub.co/docs/api-reference/links/create), and [Short.io team permissions](https://help.short.io/en/articles/10162622-team-members-permissions-and-features).

### Tier 3: Signature shrten capabilities

- A redirect decision simulator that shows which routing rule would win
- An explainable trace for geographic, device, schedule, and variant decisions
- Weighted A/B routing with auditable assignments
- A seeded, non-sensitive demo workspace for portfolio visitors
- MCP-compatible scoped link operations after the API is stable
- Synthetic load and failure-mode demonstrations for the portfolio case study

Device and geographic targeting, variants, public statistics, folders, tags, QR output, and webhook capabilities are represented in [Dub's official link API](https://dub.co/docs/api-reference/links/create). `shrten` can differentiate by making rule evaluation transparent rather than merely duplicating those controls.

### Explicitly deferred scope

- Billing and subscriptions
- Native mobile applications
- Landing-page or link-in-bio builders
- Affiliate payouts or conversion commerce
- AI analytics assistants
- Browser extensions

These can be reconsidered through later `/develop` decisions after the redirect, tenancy, privacy, analytics, and operational foundations are verified.

## Rebuild workflow

1. Preserve the current `shrten` repository and its audit as legacy evidence.
2. Run `/kickstart` in a clean `shrten-v2` repository using the approved decisions in this report.
3. Use `/document` to establish product authority, including anonymous-link limits, abuse policy, analytics minimization, retention, role permissions, and success criteria.
4. Run `/document-audit`, resolve selected findings, and explicitly approve the PRD/TRD package.
5. Run `/vibes`; use the current brand as evidence for one possible direction rather than automatically installing it as the winner.
6. Implement bounded `/develop` slices:
   1. Identity, personal workspaces, organization workspaces, and RLS
   2. Link CRUD, redirect resolution, cache behavior, expiration, and rate limiting
   3. Password grants and geographic/device routing rules
   4. Dashboard, folders, tags, QR, and bulk creation
   5. Durable analytics, privacy, retention, export, and deletion
   6. Team roles, invitations, and workspace administration
   7. API keys, OpenAPI, idempotency, and webhooks
   8. Custom domains, campaigns, health monitoring, and advanced routing
7. Run feature-specific `/kickstart-audit` and `/vibes-audit` reviews.
8. Send safe, non-behavioral findings through the relevant resolver. Route product, permission, data, routing, privacy, or behavior changes back through `/develop`.
9. Use `/release` for preview deployment, preview verification, explicit production approval, production deployment, post-deployment verification, and rollback evidence.
10. Use `/operate` for backups, restore drills, dependency review, secret rotation, capacity, cost, and data lifecycle work.
11. Use `/incident` for active security, privacy, availability, provider, or data-integrity events.

## Legacy data and cutover

If meaningful live data exists:

1. Inventory link, ownership, team, folder, tag, routing, and analytics records.
2. Define versioned target migrations and deterministic identifier mappings.
3. Build a dry-run import with counts, rejects, and rollback evidence.
4. Migrate link slugs and metadata without importing old sessions or secrets.
5. Require account identity re-verification or password reset rather than silently transferring legacy authentication state.
6. Verify representative public, expired, protected, geographic, and disabled redirects.
7. Switch redirect DNS only after the new deployment and data checks pass.
8. Retain the legacy deployment temporarily as a controlled rollback target.

If no meaningful production data exists, prefer a clean seed and manually preserve only representative portfolio examples.

## Completion criteria

The rebuild is not production-ready merely because local validation passes. Production readiness requires:

- Approved canonical product, technical, and design authority
- Closed critical/high security and authorization findings within declared scope
- Passing automated tests and CI
- Verified migration and rollback evidence
- Preview deployment and representative journey verification
- Explicit production approval
- Production deployment and post-deployment verification
- Backup, restore, monitoring, alerting, retention, and incident procedures

Until those conditions are satisfied, describe `shrten-v2` as a development or preview system rather than a production-certified service.
