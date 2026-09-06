# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- An anonymous visitor who needs to turn a long URL into a short, shareable link quickly.
- A returning user who signs in to manage links, analytics, folders, tags, and team workspaces.
- A link recipient resolving a protected, expired, or missing short URL.

The repository does not establish a narrower market segment or persona; future work should not invent one without product input.

## Product Purpose

shrten creates short links without requiring an account. The public homepage is both the product introduction and the direct creation surface. An account adds persistent management, analytics, organization, and team workflows after the first-link experience.

Success means a visitor can create a link with minimal friction, then move into a coherent account workspace for organization, analytics, and collaboration without learning a second interface language.

## Positioning

The code supports an anonymous-first link creation flow with optional controls that are often treated as account-only features: custom aliases, password protection, expiration, and country-specific redirect destinations. Signed-in users can then manage links and analytics without changing the public creation path.

## Operating Context

- Entry: a visitor arrives directly at `/` and can create a link immediately.
- Core action: enter a destination URL and submit it through the homepage shortening form.
- Optional configuration: disclose advanced controls for a custom alias, password, expiration date, and geographic redirect rules.
- Success: show the new short URL in place and allow it to be copied.
- Account path: `Get started` leads to email-and-password sign-in at `/sign-in`; protected dashboard routes redirect unauthenticated users there with a callback URL.
- Signed-in operation: the dashboard lists, filters, creates, edits, archives, and analyzes personal or team links while folders and tags provide persistent organization.
- Collaboration: team routes support workspace creation, membership, invitation, role, and shared-link management subject to existing permissions.
- Recipient resolution: protected, expired, and missing-link routes explain the state and provide the existing recovery path.
- Downstream: opening a short slug resolves cache-first, then database-backed redirect rules, including active, expiration, password, and geographic checks, before recording analytics.

## Capabilities and Constraints

- The homepage allows anonymous link creation.
- Creation is rate-limited to 10 requests per minute per IP.
- Destination URLs must be valid URLs.
- Custom aliases accept letters, numbers, hyphens, and underscores and must be 2–50 characters.
- Alias availability is checked after a short debounce.
- Expiration must be in the future.
- Passwords are optional and are stored as hashes.
- Geographic redirects are optional and map supported country codes to destination URLs.
- The public surface supports light and dark themes.
- GitHub OAuth is deprecated in the user-facing interface and retained only as temporary compatibility for existing linked accounts.
- This redesign covers every current web surface: public creation, authentication, dashboard, analytics, teams, protected-link entry, and terminal link states.
- APIs, data models, permissions, persistence, shortening rules, authentication behavior, and business logic remain out of scope and must not change.

## Brand Commitments

- Preserve the product name `shrten`.
- Preserve the direct, compact tone already present in product copy.
- Do not invent customer logos, usage metrics, testimonials, pricing, or reliability claims.

## Evidence on Hand

- Homepage and public layout: `app/(public)/page.tsx`, `app/(public)/layout.tsx`
- Shortening interaction: `components/shorten-form.tsx`, `hooks/use-shorten-form.ts`
- Creation behavior: `lib/actions.ts`, `app/api/shorten/route.ts`
- Navigation and account handoff: `components/navbar.tsx`, `app/(public)/(auth)/sign-in/page.tsx`
- Data relationships: `prisma/schema.prisma`
- Existing product overview: `README.md`

No verified customer evidence, usage metrics, testimonials, or proprietary brand assets are present in the repository.

## Product Principles

1. Let a visitor complete the core job before asking for an account.
2. Keep the default path fast while making advanced routing and protection controls discoverable.
3. Explain the consequence of each option at the moment it is used.
4. Preserve trust through clear validation, visible system state, and honest product claims.
5. Let the public creation experience lead naturally into signed-in management without making sign-in a prerequisite.
6. Use one operational language across access, management, analytics, collaboration, and recipient states.

## Accessibility & Inclusion

The web interface should preserve semantic labels, keyboard access, visible focus, understandable validation, sufficient contrast, reduced-motion preferences, and responsive operation from narrow mobile screens through desktop layouts.
