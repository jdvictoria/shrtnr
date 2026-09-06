# Impeccable Dark Mode and Dashboard Audit

Date: 2026-09-07
Scope: local `staging` worktree at `http://localhost:3001`
Mode: technical audit only; no application fixes applied

## Evidence boundary

- The worktree was already broadly dirty before this audit. Existing application changes were preserved.
- Dark mode was rendered and measured on `/`, `/sign-in`, `/sign-up`, `/link-expired`, and `/not-found` in the local browser.
- The local dashboard is correctly protected and redirected the unauthenticated audit browser to `/sign-in?callbackUrl=%2Fdashboard`. Dashboard visual findings are therefore source- and build-backed unless explicitly marked rendered.
- The current production build data reports 219 kB first-load JavaScript for `/dashboard`, 210 kB for `/dashboard/teams/[id]`, and 122 kB for `/dashboard/[id]` after lazy analytics loading.
- The Impeccable detector returned `[]`. The issues below are verified framework, state, portal, accessibility, and responsive defects that the pattern detector does not model.
- `bun run check` currently fails after generated Next route types exist. The generated contract rejects `searchParams` on the dashboard layout.

## Executive summary

The public dark theme is healthier than it first appears: the same dark paper, ink, muted copy, blue registration, and orange commit colors render across the homepage, auth, and status routes, with no horizontal overflow at the tested desktop viewport. The inconsistency is concentrated in route-specific overrides and surfaces that leave the normal page tree.

The dashboard sidebar is genuinely broken. Its server layout depends on a prop Next does not provide, so filter selection cannot reach the sidebar and the generated type contract fails. The desktop shell exposes no visible collapse control. The mobile branch discards the sidebar class and other props precisely where the component moves into a portal, so the dashboard-specific theme and coarse-pointer rules cannot follow it. Several APIs imply working behavior—persistent state and tooltips—but are not completed.

Combined issue count: **0 P0 / 3 P1 / 9 P2 / 1 P3**.

## Dark mode audit health

| # | Dimension | Score | Key finding |
|---|---|---:|---|
| 1 | Accessibility | 3/4 | Core contrast is strong; the protected-link form does not match the accessible states of auth. |
| 2 | Performance | 3/4 | Theme switching is lightweight; dashboard visualization bundles are already lazy. |
| 3 | Responsive design | 3/4 | Public/auth/status routes reflow cleanly; the mobile dashboard sheet is the exception. |
| 4 | Theming | 2/4 | Public tokens match, but route CTA, portals, and data visualization bypass one canonical theme contract. |
| 5 | Implementation integrity | 2/4 | Two parallel token namespaces and descendant-only portal overrides make drift likely. |
| **Total** | | **13/20** | **Acceptable — unify the remaining theme boundaries.** |

### Rendered positives

- `html.dark` persisted while navigating all five rendered public routes.
- The measured nav, footer, body, and page surfaces resolve to the same dark paper around `rgb(17, 16, 13)` and light ink around `rgb(244, 240, 223)`.
- Measured contrast is strong: primary ink 16.65:1, muted copy 7.50:1, blue metadata 6.91:1, and black on orange 6.90:1.
- No tested public route had horizontal overflow at 1471 px.
- The home, auth, and status compositions remain recognizably part of the Dispatch system rather than generic dark cards.

### Dark mode findings

#### [P2] The primary nav action changes visual meaning between routes

- **Location:** `app/globals.css:1299-1302`, compared with `app/globals.css:227-239`
- **Category:** Theming / Implementation integrity
- **Evidence:** The homepage renders `Get started` in orange. Auth and status routes override the same control to light ink on dark paper, producing a cream block in dark mode.
- **Impact:** The same global action looks primary on one route and like an inverted utility control on another. This is the most visible reason the dark experience feels ununified.
- **Recommendation:** Keep one semantic CTA treatment across public routes. If auth needs the action demoted, change its label/destination or component variant rather than recoloring it through `body:has(...)`.
- **Suggested command:** `$impeccable colorize`

#### [P2] Dashboard portals escape the dashboard theme boundary

- **Location:** `app/globals.css:1549-1558`; `components/ui/dialog.tsx:28-49`; `components/ui/sheet.tsx:30-59`
- **Category:** Theming / Implementation integrity
- **Evidence:** Ledger variables and dialog styling are scoped below `.dispatch-app`, but Radix dialogs and sheets portal to `body`. `.dispatch-app [role="dialog"]` cannot select those portaled surfaces, and the portal cannot inherit variables declared only on `.dispatch-app`.
- **Impact:** Add/edit/QR dialogs and mobile navigation use the global component theme rather than the dashboard's ledger treatment. Typography, borders, focus behavior, and surface color can drift between the page and the interaction it opens.
- **Recommendation:** Put canonical semantic tokens at `:root`/`.dark`, and give portaled dashboard surfaces an explicit durable variant or portal class. Do not rely on descendant selectors across a portal boundary.
- **Suggested command:** `$impeccable colorize`

#### [P2] Data visualization colors are dark-first constants, not theme tokens

- **Location:** `components/country-map.tsx:41-45, 86-102, 110-119`; `components/breakdown-pie.tsx:5-11, 36-52`
- **Category:** Theming
- **Evidence:** Map fill, stroke, hover, legend, and pie colors are fixed hex values. They do not resolve through the active theme or a chart token set.
- **Impact:** The values happen to blend with dark mode, but cannot adapt coherently to light mode, contrast changes, or future palette corrections. Charts become a separate visual system.
- **Recommendation:** Define theme-aware chart, map-empty, map-stroke, and series tokens; preserve a stable categorical order across themes.
- **Suggested command:** `$impeccable colorize`

#### [P2] The protected-link gate does not share auth's accessible state model

- **Location:** `components/password-form.tsx:31-67`
- **Category:** Accessibility / Implementation integrity
- **Evidence:** Pending submission replaces `Continue` with an unlabeled spinner; the error is not a live alert, the input is not marked invalid or described by the error, and `CardTitle` remains a non-heading `div`.
- **Impact:** Screen-reader users may not learn why access failed or that submission is still running. The final credential-like route feels less complete than sign-in/sign-up.
- **WCAG:** 3.3.1 Error Identification; 4.1.3 Status Messages; 1.3.1 Info and Relationships
- **Recommendation:** Reuse the auth form's inline error, focus, `aria-busy`, persistent loading label, password reveal, and semantic heading pattern.
- **Suggested command:** `$impeccable harden`

#### [P3] Dispatch colors are duplicated under two token namespaces

- **Location:** `app/globals.css:129-149` and `app/globals.css:1043-1063`
- **Category:** Theming / Implementation integrity
- **Evidence:** `--dispatch-*` and `--ledger-*` repeat nearly identical light/dark values instead of sharing canonical semantic tokens.
- **Impact:** Current renders match, but every palette or contrast change must be applied twice and can silently diverge.
- **Recommendation:** Keep one canonical paper/ink/action/registration/muted/rule layer and alias surface-specific names only where their meaning differs.
- **Suggested command:** `$impeccable extract`

## Dashboard and sidebar audit health

| # | Dimension | Score | Key finding |
|---|---|---:|---|
| 1 | Accessibility | 2/4 | Navigation has no landmark and collapsed icon help is not implemented. |
| 2 | Performance | 3/4 | Main dashboard is moderately heavy, but detail analytics are already split. |
| 3 | Responsive design | 2/4 | Mobile uses a sheet, but its branch discards the dashboard sidebar contract. |
| 4 | Theming | 2/4 | Desktop inherits ledger colors; mobile and portaled interactions do not reliably do so. |
| 5 | Implementation integrity | 1/4 | Invalid layout props, dead persistence, dead tooltips, and disconnected active state are systemic. |
| **Total** | | **10/20** | **Acceptable — significant shell repair required.** |

### Dashboard findings

#### [P1] Dashboard layout uses an unsupported `searchParams` prop

- **Location:** `app/dashboard/layout.tsx:9-23`; generated `.next/types/app/dashboard/layout.ts:34, 58-62`
- **Category:** Implementation integrity
- **Evidence:** Next's generated `LayoutProps` includes `children` and `params`, not `searchParams`. After route types are generated, `bun run check` fails because the dashboard layout declares the unsupported prop.
- **Impact:** The verification gate is order-dependent and currently red. More importantly, the sidebar never receives the folder, tag, or archive selection from the URL.
- **Recommendation:** Read selection state in the client sidebar through `useSearchParams`, or lift it through a supported page/client boundary. Remove `searchParams` from the layout contract.
- **Suggested command:** `$impeccable harden`

#### [P1] Sidebar selection is disconnected from the route

- **Location:** `components/dashboard-sidebar.tsx:43-59, 137, 170-179, 232-241, 292-301`; `app/dashboard/layout.tsx:18-32`
- **Category:** Accessibility / Implementation integrity
- **Evidence:** `isAll`, archived state, folder active state, tag active state, and delete-redirect behavior depend on props sourced from the invalid layout prop. Team navigation never receives `isActive` at all.
- **Impact:** `All Links` is reported as active while users view archived, folder, tag, or team contexts. The sidebar stops functioning as orientation and deleting the current filter may leave the user on an invalid URL.
- **WCAG:** 2.4.8 Location (AAA guidance); 1.3.1 Info and Relationships
- **Recommendation:** Derive active state from `usePathname` and `useSearchParams` inside the client navigation. Apply `aria-current="page"` or the equivalent current-state semantics to the actual link.
- **Suggested command:** `$impeccable clarify`

#### [P1] The mobile sidebar drops its own class and component props

- **Location:** `components/ui/sidebar.tsx:104-117`; caller at `components/dashboard-sidebar.tsx:140`; dependent rules at `app/globals.css:1381-1406, 1570-1586`
- **Category:** Responsive design / Theming / Implementation integrity
- **Evidence:** The mobile branch returns `SheetContent` without forwarding `className`, `ref`, or `...props`. The desktop branch forwards all three. The `dispatch-sidebar` class therefore disappears exactly when navigation moves into a portal.
- **Impact:** Mobile navigation bypasses its ledger surface override and the `.dispatch-app` coarse-pointer/focus rules. The desktop and mobile sidebars are not the same themed component.
- **Recommendation:** Forward the sidebar class and props to a mobile wrapper/content element, preserve the flex/overflow contract, and attach an explicit dashboard portal theme class.
- **Suggested command:** `$impeccable adapt`

#### [P2] Desktop collapse is implemented but has no visible control

- **Location:** `app/dashboard/layout.tsx:34-40`; `components/ui/sidebar.tsx:62-79, 149-169`
- **Category:** Accessibility / Responsive design
- **Evidence:** `SidebarTrigger` appears only in a `md:hidden` mobile header. Desktop users can collapse with the undocumented `Cmd/Ctrl+B` shortcut, but no visible trigger communicates or reverses the state.
- **Impact:** Collapsibility is effectively hidden functionality. A user who encounters a collapsed state has no discoverable on-screen recovery.
- **Recommendation:** Add a desktop trigger with expanded/collapsed state, tooltip, and accessible name; keep the shortcut as an accelerator.
- **Suggested command:** `$impeccable clarify`

#### [P2] Sidebar persistence is written but never restored

- **Location:** `components/ui/sidebar.tsx:11-15, 36-60`
- **Category:** Implementation integrity
- **Evidence:** State changes write `sidebar:state` for seven days, but `SidebarProvider` always initializes from `defaultOpen=true` and no server or client code reads the cookie.
- **Impact:** The sidebar re-expands on reload, contradicting the apparent persistence contract and making the desktop collapse state unreliable.
- **Recommendation:** Read the cookie in the server layout and pass a real `defaultOpen`, or remove the persistence write until it is supported.
- **Suggested command:** `$impeccable harden`

#### [P2] The tooltip API does not render a tooltip

- **Location:** `components/ui/sidebar.tsx:250-270`; usages throughout `components/dashboard-sidebar.tsx:170-354`
- **Category:** Accessibility / Implementation integrity
- **Evidence:** `SidebarMenuButton` accepts `tooltip?: string`, but does not destructure or render it. The value is forwarded as an inert DOM attribute.
- **Impact:** Collapsed icon navigation has no sighted label on hover/focus even though callers believe one exists.
- **Recommendation:** Implement a real accessible tooltip only in collapsed mode, or remove the false API and keep labels visible.
- **Suggested command:** `$impeccable harden`

#### [P2] Sidebar lacks a navigation landmark

- **Location:** `components/ui/sidebar.tsx:120-145`; `components/dashboard-sidebar.tsx:139-363`
- **Category:** Accessibility
- **Evidence:** The shell renders as nested `div` elements with menu lists but no `aside`/`nav` landmark or navigation label.
- **Impact:** Screen-reader users cannot jump directly to dashboard navigation or distinguish it from page content.
- **WCAG:** 1.3.1 Info and Relationships; 2.4.1 Bypass Blocks
- **Recommendation:** Render the structural shell as `aside` with a labelled `nav`, keeping existing lists and links.
- **Suggested command:** `$impeccable harden`

#### [P2] The dashboard's main bundle remains comparatively heavy

- **Location:** `/dashboard` build output; `components/links-table.tsx` and its dialog/action dependencies
- **Category:** Performance
- **Evidence:** `/dashboard` loads 219 kB first-load JavaScript versus 122 kB for `/dashboard/[id]`, where analytics components are dynamically split.
- **Impact:** The primary daily-use surface pays the largest interaction cost before users open row actions or bulk tools.
- **Recommendation:** Profile the links table bundle and split infrequent bulk, QR, edit, and advanced action surfaces after preserving keyboard and dialog behavior.
- **Suggested command:** `$impeccable optimize`

### Dashboard positives

- Protected routing correctly preserves `/dashboard` as the sign-in callback.
- The base sidebar includes a mobile sheet, keyboard shortcut, screen-reader trigger label, menu lists, and focus-ring primitives.
- Folder/tag creation supports Enter and Escape.
- Analytics visualization loading has already been split on the detail route, reducing that surface to 122 kB first-load JavaScript.
- The deterministic detector is clean; this is not generic styling drift but a set of concrete state and boundary defects.

## Patterns and systemic causes

1. **State ownership is split across unsupported boundaries.** The page owns URL filters, the layout attempts to read them, and the client sidebar already has access to them. The result is duplicated and disconnected state.
2. **Portal behavior is treated like normal descendant rendering.** Theme variables, focus rules, and dialog typography are scoped under `.dispatch-app`, while the interactive surfaces render under `body`.
3. **Component APIs overpromise.** `tooltip` and persisted collapse state exist in names and writes, but not in completed behavior.
4. **Theme tokens are duplicated instead of semantic.** Current values align, but public, ledger, sidebar, charts, and portals do not share one enforceable source.

## Recommended fix order

1. **[P1] `$impeccable harden`** — remove the unsupported dashboard layout prop and make the verification gate deterministic.
2. **[P1] `$impeccable clarify`** — reconnect active/current navigation state to pathname and query state, including teams and delete recovery.
3. **[P1] `$impeccable adapt`** — repair mobile prop/class forwarding and add a visible desktop collapse control.
4. **[P2] `$impeccable colorize`** — unify route CTA, portal, sidebar, and chart tokens under one dark/light contract.
5. **[P2] `$impeccable harden`** — implement real collapsed tooltips, cookie restoration, navigation landmarks, and protected-link form states.
6. **[P2] `$impeccable optimize`** — profile and split infrequent dashboard row/bulk interactions.
7. **[P3] `$impeccable polish`** — run one final desktop/mobile, light/dark confirmation after the structural fixes.

You can ask me to run these one at a time, all at once, or in any order you prefer.

Re-run `$impeccable audit` after fixes to see your score improve.
