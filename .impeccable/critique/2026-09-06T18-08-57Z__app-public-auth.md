---
target: sign-in and sign-up form UI
total_score: 22
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: "file:/Users/jdvictoria/Documents/GitHub/shrten/app/(public)/(auth)"
timestamp: 2026-09-06T18-08-57Z
slug: app-public-auth
closed: true
---
Method: dual-agent (A: app_finish_reviewer · B: app_documenter)

# Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2/4 | Submission replaces the label with an unlabeled spinner; errors live only in toasts. |
| 2 | Match System / Real World | 3/4 | Core auth language is clear, but “operator” and “ledger access” add avoidable translation. |
| 3 | User Control and Freedom | 2/4 | No password recovery is exposed, and GitHub can discard the requested destination. |
| 4 | Consistency and Standards | 3/4 | Shared visual structure is strong; password reveal and route continuity differ between methods. |
| 5 | Error Prevention | 2/4 | Basic HTML constraints exist, but inline validation and typo prevention are weak. |
| 6 | Recognition Rather Than Recall | 3/4 | Persistent labels help, while blank fields and detached feedback make users infer state. |
| 7 | Flexibility and Efficiency | 3/4 | OAuth, credentials, and autocomplete are efficient; mobile delays access to all three. |
| 8 | Aesthetic and Minimalist Design | 2/4 | The narrative panel outweighs the task, especially on narrow screens. |
| 9 | Error Recovery | 1/4 | Failures do not identify the field or provide a recovery action. |
| 10 | Help and Documentation | 1/4 | Password length is the only contextual help; recovery and provider context are absent. |
| **Total** | | **22/40** | **Acceptable — focused revision needed** |

# Design Specificity Verdict

The surrounding access surface is unmistakably shrten: thermal stock, carbon rules, cobalt registration marks, condensed typography, and handoff language make authentication part of the Dispatch Ledger. The forms themselves are category-interchangeable: provider button, “or,” blank fields, and full-width submit. The shell promises an operational instrument; the task area behaves like an unmodified authentication starter.

The deterministic source scan returned `[]` across both auth pages and their form components. That is useful but incomplete: manual evidence found semantic and state defects the detector does not model—toast-only errors, spinner-only pending labels, a non-heading ticket title, sign-up password-reveal asymmetry, and GitHub callback loss.

No reliable user-visible overlay was created. Independent fresh-browser attempts found no available controllable browser, and the URL fallback could not run because Puppeteer is not installed. HTTP 200 responses, server-rendered markup, current captures, and source inspection were used instead.

# Overall Impression

The page has a strong entrance and a weak task finish. “Keep every handoff on record” creates confidence, then the actual credential interaction becomes visually generic and emotionally silent. The biggest opportunity is to make the access ticket behave like a real accepted/rejected document: task-first on mobile, explicit states in place, and clear continuity to the destination the user originally requested.

# What’s Working

- The split, ruled composition and type hierarchy make authentication feel connected to link management rather than bolted onto it.
- GitHub and credential paths are clearly separated, with explicit labels, autocomplete, required fields, focus treatment, and pending disabling.
- Orange remains reserved for the commitment action while cobalt carries registration and metadata, preserving the visual system’s hierarchy.

# Cognitive Load

No decision point exceeds four choices. The failure is priority rather than quantity.

- On a 390px screen, the first viewport is almost entirely brand promise and three benefits; credential fields remain below the fold.
- Desktop gives the persuasive context more visual authority than the returning-user task.
- Users must infer where errors will appear and what happens after submission.
- “Get started” competes conceptually with the active sign-in task while linking back to the same route.

# Emotional Journey

The opening feels confident and trustworthy. The emotional valley begins at the generic blank form, which offers no readiness, security, or destination context. Failure is the weakest moment: a transient toast appears away from the field and gives no next step. Sign-up also lacks a deliberate ending—partial success and retry states feel like implementation messages rather than a completed access workflow.

# Priority Issues

## P1 — Mobile buries the primary task

**Why it matters:** A returning user can spend the entire first viewport reading persuasion before reaching any credential control. This increases abandonment and makes an Operate surface behave like a landing page.

**Fix:** On narrow screens, lead with the access ticket. Collapse the proposition into a compact header and move the three benefit rows below the form or into a short post-form proof strip. Keep the desktop split composition.

**Suggested command:** `$impeccable adapt`

## P1 — Submission and failure states are detached from the fields

**Why it matters:** Spinner-only buttons lose their action name, and toast-only errors are neither proximal nor associated with the input that needs correction. Keyboard and screen-reader users receive especially weak recovery guidance.

**Fix:** Retain “Signing in…” or “Creating account…” during submission, set `aria-busy`, add ticket-level status for system failures, and attach field errors with `aria-invalid` and `aria-describedby`. Preserve values and focus the first invalid field.

**Suggested command:** `$impeccable harden`

## P1 — Recovery and destination continuity are incomplete

**Why it matters:** A forgotten password is a dead end. Users choosing GitHub after arriving from a protected link are sent to `/dashboard`, while credential sign-in preserves `callbackUrl`.

**Fix:** Preserve the validated callback for every authentication method. Expose password recovery only if the backend can support it; otherwise add honest recovery guidance rather than a dead control.

**Suggested command:** `$impeccable clarify`

## P2 — The form interior does not earn the Dispatch Ledger identity

**Why it matters:** The visual drop from authored shell to generic controls creates the unfinished feeling even when the form technically works.

**Fix:** Turn credential fields into ruled access rows with stable slots for requirements, accepted state, and correction messages. Make the ticket title a real heading. Keep the flat square material language—do not add decorative cards or more branding.

**Suggested command:** `$impeccable layout`

## P2 — Sign-up lacks parity and reassurance

**Why it matters:** New users face the highest uncertainty but receive less assistance than returning users. There is no password reveal, persistent requirement feedback, or provider/account context.

**Fix:** Add password-visibility parity, persistent requirement state, and concise factual reassurance near the commitment action. Avoid unsupported privacy or security claims.

**Suggested command:** `$impeccable onboard`

# Persona Red Flags

**Jordan, first-time user:** On mobile, encounters a product statement and numbered benefits before the account-creation task. “New operator” adds vocabulary at the moment clarity matters most, and failed validation provides no in-form recovery.

**Sam, accessibility-dependent user:** The credential ticket lacks its own semantic heading. Pending action names disappear, and toast-only failures are not programmatically tied to fields.

**Casey, distracted mobile user:** Must scroll through persuasion before reaching the form, then type a new password without a reveal control or persistent requirement confirmation.

# Minor Observations

- “Get started” is a redundant self-link on sign-in and an ambiguous mode switch on sign-up.
- Operational labels around 0.68–0.72rem are visually authentic but risk becoming decorative furniture.
- The sign-in password reveal is now accessible; its absence on sign-up makes the newer-user path feel less complete.
- The three benefit rows are presentation content, not necessary access guidance.

# Questions to Consider

- If authentication is an Operate surface, why does mobile spend its first screen persuading rather than granting access?
- What would an invalid credential look like if the ticket itself had been rejected and marked for correction?
- Is “operator” helping users feel capable, or asking them to perform the aesthetic?
- What reassurance belongs exactly where a user commits credentials?
