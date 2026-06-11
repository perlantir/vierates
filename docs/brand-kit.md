# VieRates — Design & Conversion Flow Specification

### The Brand & Build Kit: visual identity, page blueprints, flow-by-flow conversion mechanics

_Companion to the Master Plan and the Platform Build Spec. This document IS the "Brand & Build Kit" the build spec references — drop it into the repo at `/docs/brand-kit.md`. Sections §6–§9 match the build spec's cross-references exactly (§6 tokens & signatures, §7 copy, §8 microcopy/compliance language incl. §8.5 soft-pull sentence, §9 component inventory & definition of done)._

---

## §0 — HOW TO USE THIS DOCUMENT

1. **Every screen ships against this spec.** Token-only colors, the type rules in §3.2, and the §9 definition-of-done checklist are enforceable in code review, not aspirational.
2. **Every design decision here is tied to a conversion job.** The two KPIs that decide whether VieRates works — **Listing → Verified (target 20–30%)** and **Bids → Pick (target 50–60%)** — each get a dedicated flow blueprint (§5.2, §5.5). When a design tradeoff is unclear, resolve it in favor of those two numbers.
3. **The research base (§2) is the tiebreaker.** When someone proposes a redesign, ask which §2 principle it serves. If the answer is "it looks cooler," decline it.
4. Anything marked `[COUNSEL]` is a slot for legal-approved language — design around the slot, never invent regulated copy.

---

## §1 — POSITIONING & DESIGN THESIS

### 1.1 What the design must communicate in 5 seconds

A first-time visitor — likely arriving on a phone, from an ad, primed by years of lead-gen sleaze — must absorb three things before they scroll:

1. **Lenders compete for me** (the power inversion — this is the category-defining claim)
2. **I stay anonymous and in control** (the anti-LendingTree promise)
3. **This is a serious financial institution-grade product, not a lead farm** (the credibility floor)

Everything in this kit serves those three messages. The visual concept that carries them:

### 1.2 The concept: "The Sealed Ledger"

VieRates' world is the auction house and the underwriter's ledger — not the world of refi-blast landing pages. The design borrows its materials directly from that world:

- **The ledger:** append-only rows, tabular monospaced figures, timestamps. Money is always set in mono. The homepage hero is literally a live ledger of bids (already specified in the build spec — we make it the brand's signature).
- **The seal / redaction:** borrower identity is physically masked until the borrower chooses. The **redaction bar** (a solid ink block over identity fields) becomes the recurring brand motif — in product (the masked-profile preview), in marketing ("Your name is `██████` until you say so"), and in the reveal animation when a borrower picks a winner. No other mortgage brand can use this motif honestly; it is the design expression of the legal moat.
- **The paddle:** the auction paddle is the bid mark. The gold accent is named `--paddle` and appears _only_ on bids and primary CTAs — gold is the color of action, and scarcity of the accent is what makes it work (see "the gold budget," §3.1).

**Personality in four words: calm, exact, discreet, on-your-side.**
**Anti-personality (what we must never resemble):** urgency-red countdown spam, stock-photo handshakes, "Rates as low as 2.99%!\*" bait, exclamation points, dense disclaimer walls hiding tricks.

### 1.3 Two audiences, one system, two densities

| Surface                  | User mindset                                     | Design register                                                                                  |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Marketing + Borrower app | Anxious, skeptical, mobile, financially stressed | Calm, spacious, one-decision-per-screen, 8th-grade language, big mono numbers                    |
| Lender portal            | Professional at a desk, time-boxed, ROI-driven   | Same tokens at 1.5× information density — a "terminal calm" trading-desk feel, zero gamification |

Same color, type, and components — different spacing scale and layout density (§3.3). This keeps the build cheap (one design system) while feeling native to each user.

---

## §2 — CONVERSION DOCTRINE: TEN LAWS, EACH MAPPED TO THIS PRODUCT

These are the research-backed principles the entire experience is built on. Each law names its evidence base and its specific application in VieRates. (Sources summarized in Appendix A.)

**Law 1 — The 50-millisecond verdict.** Users form an aesthetic and trust judgment in ~50ms, and it anchors everything after (Google/Tuch et al.; confirmed repeatedly since). Low visual complexity + high prototypicality win. → _Application:_ the homepage above-the-fold is exactly four elements: headline, subhead, one gold CTA, the LiveBidLedger. Nothing else. No carousel, no popups, no chat widget on first paint.

**Law 2 — Familiar layout, surprising substance (Jakob's Law).** People expect your site to work like every other site; spend novelty on content, not navigation (NN/g). → _Application:_ logo top-left, single primary CTA top-right, footer disclosures where footers go. The _surprise_ is the live ledger and the redaction motif — never the navigation.

**Law 3 — Multi-step beats long-form, dramatically.** Breaking one long form into one-question-per-screen steps routinely lifts completion 50–300% in published fintech/lead-gen tests (the "Figure pattern" the build spec already mandates; Venture Harbour and others have replicated it for years). Reasons: lower perceived effort, micro-commitments, mobile thumb ergonomics. → _Application:_ §5.1 — the 12-screen wizard, auto-advance, sub-60-second target.

**Law 4 — Easy first, sensitive last (commitment & consistency + sunk cost, ethically used).** Ask the cheapest questions first; ask for the phone number only after the user has invested ~10 answers (Cialdini; standard in every high-converting lead flow). → _Application:_ phone + OTP is screen 11 of 12, framed as security ("prove you're human"), never as "so lenders can call you."

**Law 5 — Reassure at the moment of anxiety, not in the footer.** Baymard's research is unambiguous: trust microcopy works when placed _adjacent to the field that triggers the fear_ (card fields, phone fields), not on a separate trust page. → _Application:_ every sensitive input carries an inline pledge — phone field: "We'll text one code. We never sell your number." Credit step: the §8.5 soft-pull sentence. Address field: "Checked against public records, then sealed — lenders never see your street address."

**Law 6 — Show, don't claim, the anonymity.** Claims of privacy are cheap; _demonstrations_ convert. → _Application:_ the masked-profile preview ("Here's what lenders see — and what they won't") with identity fields visibly redacted is a mandatory screen before every auction, and the redaction motif appears in marketing so the demonstration starts pre-signup.

**Law 7 — Real numbers are the best persuasion.** Specific, verifiable figures outperform adjectives (every credibility study since Stanford's web-credibility work; design quality and verifiable detail are the top two trust drivers). → _Application:_ the market-context band ("Verified borrowers like you received bids between 6.13%–6.41% this week") is the single most important conversion asset on the borrower side — it is the Tier-1 → Tier-2 tease, the homepage proof, and the Bid Index flywheel, all from the same data. Always set in mono, always with an as-of date, never rounded into vagueness.

**Law 8 — Progress is a motivator; near-completion is a stronger one (goal-gradient effect).** People accelerate as they approach a goal; visible progress reduces abandonment. → _Application:_ thin top progress bar in the wizard (never percentage text — it invites math); verification flow framed as "you're one step from your Bid Room" rather than starting a new journey from zero.

**Law 9 — Live activity converts, dark-pattern urgency corrodes.** Genuine real-time signals (bids arriving, countdown to a _real_ deadline) are powerful; fake scarcity destroys exactly the trust this brand sells. → _Application:_ the 48-hour countdown and bid arrivals are real system events and are displayed prominently; we _never_ show fake viewer counts, fake "2 spots left," or decoy bids. The empty-auction state is choreographed honestly (§5.4) because the Master Plan's rule — never let a borrower see an empty auction — is a design problem as much as a liquidity problem.

**Law 10 — Speed is a feature of trust.** ~Half of mobile users abandon pages that take >3 seconds; perceived performance also raises credibility scores. → _Application:_ hard budgets in §10 (LCP < 2.0s on mid-tier 4G, CLS < 0.05, ≤ 130KB JS on marketing routes), enforced in CI alongside the build spec's Lighthouse gates.

**Standing ethical rule:** every persuasion technique above is used only in the borrower's genuine interest (verification genuinely gets them firm bids; picking promptly genuinely preserves their offers). If a tactic only works by misleading, it's out — bid integrity is the entire brand, and the design must be held to the same bar as the bids.

---

## §3 — VISUAL IDENTITY

### 3.1 Color system

**Concept:** banker's-ledger green (not fintech navy — every lender owns navy; ledger green is the color of the actual artifact this product is built on), bond-paper white, brass paddle gold, redaction ink. Trustworthy at first glance, unmistakably VieRates at second.

#### Core palette

| Token          | Hex       | Role                                                                                              |
| -------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `--ink-900`    | `#07211B` | Redaction bars, max-contrast text on light                                                        |
| `--ink-800`    | `#0C2A23` | **Primary brand dark.** Dark surfaces (footer, lender portal chrome, ledger hero), headlines      |
| `--ink-700`    | `#143B31` | Hover states on dark, secondary dark surfaces                                                     |
| `--ink-600`    | `#1E4F42` | Borders on dark, large decorative type on light                                                   |
| `--paper`      | `#F5F7F3` | **Page background** (bond white with a faint green cast — deliberately not cream, not pure white) |
| `--card`       | `#FFFFFF` | Cards, inputs, sheets                                                                             |
| `--line`       | `#DCE3DB` | Hairline borders, dividers                                                                        |
| `--text`       | `#13241F` | Body text on light (≈14:1 on paper)                                                               |
| `--text-muted` | `#54655C` | Secondary text (≥4.5:1 on paper)                                                                  |
| `--text-faint` | `#7E8C83` | Placeholders, disabled — 18px+ or non-essential only                                              |

#### Accent & semantic

| Token           | Hex       | Role & rules                                                                                                                                                                                                                           |
| --------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--paddle`      | `#D9A52B` | **THE accent. Appears ONLY on: (a) primary CTA fills, (b) live-bid markers/best-bid highlights, (c) the countdown ring.** Never decorative, never on borders-for-flair, never as link color. CTA text on paddle is `--ink-900` (≈8:1). |
| `--paddle-deep` | `#B8881C` | Paddle hover/pressed                                                                                                                                                                                                                   |
| `--paddle-tint` | `#F9EFD6` | Best-bid row wash, CTA focus halo on light                                                                                                                                                                                             |
| `--verified`    | `#14724B` | Verification states, "Verified" badges, success. Text-safe on white (≥4.5:1). Tint `#E4F2EA`.                                                                                                                                          |
| `--info`        | `#2F5D7E` | Informational notes, "Why we ask" affordances. Tint `#E8F0F6`.                                                                                                                                                                         |
| `--alert`       | `#B23B2E` | Errors, disputes. Tint `#F9E9E7`. Never used for urgency theater.                                                                                                                                                                      |
| `--caution`     | `#8A4D0F` | Conditions flags on bids, expiring locks. Tint `#F6EDDF`. Visually distinct from paddle (browner, always paired with an icon + label).                                                                                                 |

#### The gold budget (enforced in review)

A screen may contain **at most one paddle-gold CTA** and any number of paddle-gold _bid_ markers (bids are the product; they've earned the color). If two actions both feel primary, the design is wrong — demote one to the secondary style (ink outline on light / paper outline on dark). This single rule is why the CTA will always win the eye-tracking heatmap.

#### Contrast guarantees (WCAG 2.2 AA, verified)

- `--text` on `--paper` / `--card`: ≥ 13:1 ✓
- `--text-muted` on `--paper`: ≥ 4.5:1 ✓
- `#FFFFFF` on `--ink-800`: ≥ 13:1 ✓
- `--ink-900` on `--paddle`: ≥ 7:1 ✓ (CTA label)
- `--paddle` on `--ink-800` (ledger figures, countdown): ≥ 4.5:1 ✓
- `--verified` on `--card`: ≥ 4.5:1 ✓
- Focus ring: 2px `--ink-800` + 2px offset on light; 2px `--paddle` on dark. Never remove.

**Dark mode:** not in v1 (scope discipline). The lender portal's chrome is dark by design (ink-800) but content panes stay light — data legibility beats theming.

### 3.2 Typography

**One superfamily, three voices: IBM Plex.** Plex Serif for editorial authority on marketing surfaces, Plex Sans for the interface, Plex Mono for money — the build spec already mandates mono tabular figures; we extend that into a complete system. One family means visual coherence, a single variable-font pipeline (fast — Law 10), and an institutional, engineered character that no competitor in this category uses.

| Role        | Face       | Size/leading                 | Weight & details                                                                                                                   |
| ----------- | ---------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `display-1` | Plex Serif | 52/58 desktop · 36/42 mobile | SemiBold, −1% tracking. Marketing heroes only.                                                                                     |
| `display-2` | Plex Serif | 36/44 · 28/34                | SemiBold. Marketing section heads.                                                                                                 |
| `h1`        | Plex Sans  | 30/38                        | SemiBold. App page titles, wizard questions.                                                                                       |
| `h2`        | Plex Sans  | 23/30                        | SemiBold.                                                                                                                          |
| `h3`        | Plex Sans  | 18/26                        | Medium.                                                                                                                            |
| `body`      | Plex Sans  | 17/27                        | Regular. Default — deliberately one notch larger than fintech norm (readability = trust, and our median user is 35–60 on a phone). |
| `body-sm`   | Plex Sans  | 15/22                        | Regular.                                                                                                                           |
| `label`     | Plex Sans  | 12/16                        | SemiBold, +6% tracking, sentence case. Eyebrows, chip labels, table headers.                                                       |
| `money-xl`  | Plex Mono  | 44/48 · 36/40                | Medium, tabular numerals, slashed zero. APR on RateDisplay, hero figures.                                                          |
| `money`     | Plex Mono  | 22/28                        | Medium tabular. Bid cards, ledger rows.                                                                                            |
| `money-sm`  | Plex Mono  | 15/22                        | Regular tabular. Fee itemizations, tables.                                                                                         |

**Hard type rules (§9 checks these):**

1. Any numeral representing money, a rate, an APR, points, or a countdown is **always Plex Mono tabular** — including inside sentences ("bids between `6.13%–6.41%`"). Mono numbers are the brand's voice of precision; mixed-font numbers are a defect.
2. Plex Serif never appears inside forms, the wizard, or the lender portal — it is the _editorial_ voice, not the _interface_ voice.
3. Sentence case everywhere. No Title Case Headlines, no ALL-CAPS except `label` style. The brand never shouts.
4. Reading measure ≤ 70ch. Body text never sits on `--ink-800` for more than 3 lines (long-form on dark is fatiguing).
5. Font loading: variable fonts, `font-display: swap`, subset to Latin, `size-adjust` fallback metrics (Georgia for Serif, Arial for Sans, Courier New for Mono) so swap causes zero CLS.

### 3.3 Space, grid, radius, elevation

- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96. Marketing sections: 96 vertical desktop, 56 mobile. App screens: 24 page padding mobile, 32 desktop.
- **Grid:** 12-col, 1200px max container, 24px gutters (marketing). Borrower app: single column, **480px max width for wizard/verification screens** — a deliberately narrow "focus column" that makes one-question screens feel effortless. Lender portal: full-width to 1440px, data tables edge-to-edge in their pane.
- **Density switch:** lender portal uses the same components with `compact` spacing (row heights 40px vs 56px, body-sm default). One token (`--density`) flips it.
- **Radius:** inputs 8, buttons 10, cards 14, chips/pills 999, the redaction bar **0** (a seal is square — the one deliberately sharp element).
- **Elevation:** borders over shadows. One shadow level only (`0 1px 2px rgb(7 33 27 / 6%), 0 4px 12px rgb(7 33 27 / 6%)`) for floating elements (sheets, toasts, the bid composer). Flat = honest; drop-shadow stacks read as ad-tech.

### 3.4 Iconography, illustration & imagery

- **Icons:** Lucide, 1.75px stroke, 20px default, `--text-muted` unless semantic. No filled icons except the verified check and the paddle mark.
- **The paddle mark:** a simple numbered auction paddle glyph — used as the bid icon, the favicon's companion, and lender anonymization on the lender board ("Best APR held by Paddle #3").
- **The redaction motif:** identity fields render as `--ink-900` solid blocks with 0 radius. In marketing, headlines may redact a word ("Your name is `██████` until you say so"). In product, the masked-profile preview uses real redaction bars over the user's actual field shapes — demonstrated privacy (Law 6). The reveal animation (§5.6) dissolves these bars exactly once, at the moment of consent.
- **Band chips:** credit/LTV/income bands render as bordered pills with mono values ("`FICO 720–759`") — bands are the product's data vocabulary; chips make them scannable and consistent everywhere (wizard, board, bid room).
- **Photography: none on conversion paths.** No stock humans, no handshakes, no house-with-keys. The product's own artifacts (ledger, bid cards, masked profiles) are the imagery. The single permitted photo style is real-founder/real-team on /about — credibility research favors verifiable humans over models.
- **Charts (Bid Index):** single-series line/band charts, `--ink-700` lines, `--paddle-tint` band fills, mono axis labels, no gridline clutter, always an as-of date.

### 3.5 Motion

Motion exists to make the marketplace feel _alive and exact_ — never to decorate.

| Moment                          | Spec                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wizard auto-advance             | 250ms delay after selection (build spec) → 180ms slide-left + fade. Back = reverse.                                                               |
| Bid arrival (ledger & Bid Room) | New row slides down 8px + fades in 220ms; paddle-gold left rule pulses once (600ms) then settles. Never bounces.                                  |
| Best-APR change                 | Mono digits roll (odometer style, 300ms). This is the signature micro-interaction — tabular mono makes it pixel-stable.                           |
| Countdown                       | mm:ss ticks per second; under 1 hour the ring stroke turns `--paddle`. No flashing, no red.                                                       |
| The Reveal (§5.6)               | Redaction bars dissolve top-to-bottom over 600ms after pick confirmation. The only "ceremonial" animation in the product — spend the moment here. |
| Everything else                 | 150–200ms ease-out fades. `prefers-reduced-motion` collapses all of the above to instant state changes (countdown still ticks).                   |

---

## §4 — PAGE BLUEPRINTS (MARKETING SITE)

Global rules: NavBar = logo left · "How it works / Bid Index / For lenders" center · "Start my listing" (paddle CTA) right; collapses to logo + CTA + menu on mobile. The paddle CTA persists in the nav on scroll — it is the only sticky element. FooterDisclosures on every page (Equal Housing logo, the `[COUNSEL]` marketplace-not-a-lender sentence, NMLS Consumer Access link, privacy/terms). No exit popups, no chat bubble on first paint, no cookie-wall theater beyond what counsel requires.

### 4.1 `/` Home — section by section, each with its conversion job

```
┌──────────────────────────────────────────────┐
│ NavBar                              [Start →]│
│                                              │
│  Lenders compete. You stay        ┌────────┐ │
│  anonymous. You choose.           │ LIVE   │ │
│  ─ subhead (2 lines) ─            │ BID    │ │
│  [Start my listing]  See how →    │ LEDGER │ │
│                                   └────────┘ │
├──────────────── TrustBar ────────────────────┤
├─ How it works (3 steps) ─────────────────────┤
├─ Two tiers explained (Connect vs Bid Room) ──┤
├─ The old way vs VieRates (contrast table) ───┤
├─ Bid Index teaser (real mono numbers) ───────┤
├─ FAQ (5 seeds) ──────────────────────────────┤
├─ CTA band ───────────────────────────────────┤
└─ FooterDisclosures ──────────────────────────┘
```

1. **Hero.** `display-1` headline (§7.1), 2-line subhead, one paddle CTA + one text link. Right (stacks below on mobile): the **LiveBidLedger** — 6 rows of anonymized bids streaming in on an `--ink-800` panel, mono figures, paddle-gold APR column, labeled "Example bids" in demo mode. _Job: prove the category exists in 5 seconds (Laws 1, 7, 9). The ledger is the proof; the headline is the claim._
2. **TrustBar.** Four quiet items in `label` style: "Free for borrowers — always · Your data is never sold · Soft check only — no score impact · Licensed, NMLS-verified lenders." _Job: defuse the four objections every visitor brings (Law 5)._
3. **HowItWorks.** Three steps, numbered (a true sequence): "List anonymously (60 seconds) → Lenders compete (48-hour auction) → You choose who meets you." Each step shows a miniature of the real UI (wizard chip screen, bid room, reveal) — product screenshots, not illustrations. _Job: make the unfamiliar mechanic feel concrete and short._
4. **TierExplainer.** Two cards: "Connect" (quiet, ink outline) vs "Bid Room" (paddle-trimmed, "Most popular" only if true). Honest comparison rows: what you share, what you get, time required. _Job: pre-seed the Tier-2 upgrade so the in-app Two Doors moment (§5.2) is the second exposure, not the first._
5. **Old way vs VieRates.** A contrast table — "Your number sold to 5 lenders / Your name sealed until you pick," "Teaser rates / Firm bids keyed to your verified profile," "They choose you / You choose them." _Job: position against LendingTree without naming them (the brand voice never punches; the table just states facts)._
6. **Bid Index teaser.** Real weekly band data in mono with an as-of date + link to `/bid-index`. _Job: Law 7 — verifiable numbers; also the SEO/PR flywheel surface._
7. **FAQ.** The five §7.4 seeds in an accordion (schema.org FAQ markup). _Job: objection handling for the deliberate readers; rich-result real estate._
8. **CTA band.** Ink-800 panel, one line, one paddle CTA. _Job: catch the bottom-scrollers; no new arguments._

### 4.2 `/how-it-works`

Long-form version of section 3 at 8th-grade reading level: the wizard (with real screenshots), the anonymity diagram (profile fields → redaction bars → reveal arrow gated by "you pick"), the soft-pull explainer (§8.5 verbatim), what lenders see vs never see (two-column table), what happens after you pick. Ends with the paddle CTA. This page is the send-to-spouse / send-from-realtor link — it must stand alone.

### 4.3 `/lenders`

Different audience, same system, ink-forward styling (this reads like a desk product, not a consumer pitch):

1. Hero (§7.2) + sub: the cost-per-funded math.
2. **Cost-per-funded comparison module:** three mono `[STAT]` columns — shared internet leads ($1,500–4,000+) / VieRates auctions (~$150–300) / VieRates connections (~$600) — with the assumptions written underneath (lenders are professional skeptics; show the math).
3. How bidding works: bid card anatomy, the firm-bid rule, the one-improve rule, what "verified" means operationally (score band, DTI band, reissuable income report).
4. **Founding Lender application** — the form: org, NMLS ID, states, products, volume band, contact. Consent checkbox unchecked, TCPA-correct `[COUNSEL]`. Scarcity stated only as fact: "15–25 founding seats. 90 days free, locked 30% pricing after."
5. FAQ: RESPA structure (flat fees, never success fees), exclusivity, consent proof (TrustedForm), SLA expectations.

### 4.4 `/bid-index`

The content flywheel. Weekly aggregate bands by profile (chart + table, mono everywhere, methodology note, as-of date, canonical URLs per week for SEO). Every figure links to "Get your own bids" — the index is a product demo disguised as content.

### 4.5 `/trust` and `/about`

/trust: the three published principles verbatim (free always / never sold / no bait numbers), security posture summary (vendor-handled credentials, encryption, pen test), the consent ledger explained in plain language. /about: real founder, real story, the post-trigger-ban moment. These pages exist to be found mid-decision — link them from sensitive steps' "Why we ask" popovers.

---

## §5 — FLOW BLUEPRINTS (THE CONVERSION CORE)

### 5.1 The Listing Wizard — design layer on the build spec's 12 screens

The build spec defines the screens and copy; this section defines how they look, feel, and convert.

**The frame (identical on all 12):** focus column (480px max, centered), thin 3px progress bar at top (`--verified` fill — progress is a kept promise, not an ad), back arrow top-left, step's single question in `h1`, inputs as large chips/sliders (min 56px tap height, 12px gaps), the persistent footnote "🔒 Anonymous — we never sell your info" in `body-sm` muted at bottom, optional "Why we ask" (`--info` text button → bottom sheet, never a tooltip on mobile). No nav, no footer, no sidebar — the wizard is a corridor, not a page.

**Per-screen conversion notes (beyond the build spec's table):**

| #   | Screen       | Design/conversion notes                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Goal         | Four chips, verb-first. This screen doubles as segmentation analytics. Chip order: Lower my payment / Get cash out / Pay off faster / Just see bids — "Just see bids" legitimizes the curious (they become rate-watch nurture, not bounces).                                                                                                                               |
| 2   | Address      | The scariest early ask. Inline pledge under the field (Law 5): "Checked against public records, then sealed. Lenders never see your street address." Autocomplete required; manual entry fallback after 2 failed lookups → manual-review messaging, never a dead end.                                                                                                      |
| 5   | Home value   | Slider pre-set to AVM: "We estimate **$412,000** — sound right?" (mono). This is the first _gift_ — the product gave value before asking for trust. Anchoring also reduces junk inputs.                                                                                                                                                                                    |
| 6   | Loan balance | Live LTV readout as they slide: "≈ **62%** of your home's value" — the second gift; users feel the system computing for them.                                                                                                                                                                                                                                              |
| 8   | Credit       | Judgment-free labels exactly as specced (Excellent/Good/Fair/**Building** — never "Poor"). Sub-line: "Just your best guess — no credit check here."                                                                                                                                                                                                                        |
| 11  | Phone + OTP  | Maximum-anxiety screen, placed at maximum sunk cost (Law 4). Framing is security, not contact: "Last step — prove you're human." Pledge under field: "We'll text one code. **We never sell your number.**" 6-digit auto-advancing OTP boxes, paste-friendly, auto-read on Android. Resend after 30s. Errors never accuse ("That code didn't match — try the newest text"). |
| 12  | Done         | Do NOT celebrate with confetti. Deliver the third gift instead: the market-context band in `money` mono — then the Two Doors (§5.2). The reward for finishing is _information_, on-brand.                                                                                                                                                                                  |

**Resume:** state saved per screen; magic-link SMS resume ("Pick up where you left off") fires once at +2h for abandons at screen ≥3. One nudge, not a drip — the anti-spam brand applies to our own messages.

**Edge states:** YELLOW/RED state → respectful gate ("VieRates isn't available in {state} yet — we'll text you the day it is", waitlist form, no dead-end); property match fail → "We couldn't confirm that address automatically — our team will review within 1 business day" (held in DRAFT, honest, human).

### 5.2 The Two Doors — the 20–30% KPI screen (highest-leverage design in the product)

Appears at wizard completion and persists as the dashboard's primary module until resolved.

```
┌─ focus column ────────────────────────────────┐
│  You're listed. Here's your market.           │
│  ┌──────────────────────────────────────────┐ │
│  │ Verified borrowers like you received     │ │
│  │ bids between  6.13% – 6.41%  this week   │ │  ← money-xl mono, as-of date
│  └──────────────────────────────────────────┘ │
│                                               │
│  ┌─ OPEN MY BID ROOM ──────── paddle trim ──┐ │
│  │ Lenders compete with firm, lockable      │ │
│  │ offers. ~3 minutes · soft check only ·   │ │
│  │ no score impact · you stay anonymous     │ │
│  │ [ Open my Bid Room ]   ← paddle CTA      │ │
│  └──────────────────────────────────────────┘ │
│  ┌─ CONNECT WITH ONE LENDER ── ink outline ─┐ │
│  │ Browse verified lenders and introduce    │ │
│  │ yourself to one. No verification needed. │ │
│  │ [ Browse lenders ]      ← secondary      │ │
│  └──────────────────────────────────────────┘ │
│  What's the difference? → (sheet: honest      │
│  comparison table)                            │
└───────────────────────────────────────────────┘
```

Mechanics, in order of importance:

1. **The market-context band leads.** It converts curiosity into a concrete personal question ("could I get 6.1?") that only verification answers (Law 7). It must be real data, banded to their profile, dated.
2. **Honest asymmetry.** The Bid Room card is visually primary (paddle CTA, first position, "3 minutes" time anchor, the three reassurances inline) because it genuinely serves the borrower better. Connect stays a fully respectable door — demoting it into a shame button would violate the brand and TCPA-clean positioning.
3. **Positive framing only.** "Verified profiles get firm, lockable numbers. Stated profiles get introductions." Never "don't miss out," never countdowns here — urgency belongs to real auctions only (Law 9).
4. **Objection pre-emption at the click:** tapping "Open my Bid Room" goes to a single interstitial: the §8.5 soft-pull sentence + "Here's what lenders will see" masked preview + [Continue]. Anxiety handled at the moment it spikes (Law 5, Law 6).
5. **Stall recovery:** if neither door is taken in 24h → one SMS with the market band refreshed ("Bids for profiles like yours moved to 6.08–6.39 this week"). Rate-watch, not nagging — it demonstrates the product's ongoing value.

### 5.3 Verification flow — keep momentum, hand off gracefully

One-question pacing continues. Intro screen = §8.5 sentence + the two vendor steps previewed as a 2-item checklist (goal gradient: a 2-step task, not a new journey). Vendor widgets (Array, Truv) open in full-height sheets with our chrome retained top (logo + "Secure connection · handled by Array — we never see your credentials"). On webhook success, the checklist item flips to `--verified` with a 200ms check draw. Abandonment inside a widget → resume card on dashboard + one nudge at +4h. Failure → honest copy ("We couldn't verify automatically — a specialist will review within 1 business day"), never a generic error.

**The masked-profile review screen (mandatory, pre-auction):** two columns — "Lenders see" (band chips: FICO band, DTI band, LTV, loan amount, county, product) vs "Lenders never see" (name, phone, email, street address — each rendered as a true redaction bar). Then scheduling ("Open my auction now" paddle CTA / "Pick a window"). This screen is the brand's thesis made tangible; it is also the §8 consent moment (HPPA_OPTIN + CREDIT_SOFT_PULL records written here).

### 5.4 The Bid Room — live auction UX

Layout (mobile-first): sticky header = countdown ring (mono `HH:MM:SS`, ring turns paddle under 1h) + "Best APR so far: **6.13%**" (money, odometer-rolls on change) + bid count. Below: bid cards, newest first, best-APR card pinned top with `--paddle-tint` wash and a small paddle mark.

**BidCard anatomy (borrower view):** lender name + NMLS chip (links to NMLS Consumer Access) → product/program chips → rate in `money` → points/credits → "Lender fees: $X — view itemized" (expandable, mono table) → **APR in `money-xl` with as-of + assumptions** (the RateDisplay component — emphasis on APR, not rate, is both Reg-Z-aligned and genuinely the honest comparison number) → lock days → conditions flag (`--caution` chip + plain-language sheet) → "(Improved their offer)" tag when re-bid.

**Sort control:** "Ranked by APR" default; alternates "Total cost over 5 years" and "Monthly payment" — computed uniformly by us, mono, with methodology sheet. Giving three honest lenses builds decision confidence, which feeds the 50–60% pick rate (§5.5).

**The warming-up state (critical — the Master Plan's "never an empty auction" rule, designed):** before the first bid, the room shows: "Your profile is live with **{n} lenders** whose coverage matches" (real CoverageBox count) + "Median first bid arrives in under 12 hours" (real SLA stat) + the room's own market-context band. The borrower should leave and be _pulled back_ by the first-bid push/SMS ("Your first bid is in: 6.27% APR from {lender}") — the single most exciting notification in the product; it gets the paddle treatment in email too.

**Notification choreography (Bid Room):** first bid (SMS+push, instant) → new best APR (push, batched ≥30min) → 6h-left (SMS) → closed: "Your bids are in — pick your winner" (SMS+email recap with the comparison table inlined).

### 5.5 Compare & Pick — the 50–60% KPI

Post-close, the room becomes a decision surface:

- **Comparison table:** bids as columns (mobile: horizontally snap-scrolled cards with sticky metric labels), rows = APR / rate / points / lender fees / lock / monthly payment / 5-yr total cost / conditions / lender rating. Best value per row gets a quiet `--verified` tick — never a screaming "WINNER" badge; the borrower is the only judge here.
- **"What happens when you pick" explainer (persistent, above the CTAs):** "Your name and contact go to that one lender only. The others never learn who you were. Your verified reports transfer — no repeat paperwork." This removes the _fear of the click_, which is the real abandonment cause at this step.
- **Pick deadline (real):** "Offers held until {date}" in mono with a calm day-counter. Reminder cadence: close+24h, close+4d, close+6d ("Your bids expire tomorrow — they're still the firm numbers you saw"). All factual.
- **Picking none is a visible, respectable path:** "Not ready / none fit" → offers re-auction later or rate-watch. Honoring the exit preserves the trust that powers referrals and returns (and the data says rate-watch users are future conversions, not losses).
- **Confirm modal:** chosen bid recap + TCPA_REVEAL consent (`[COUNSEL]` exact text, named lender) + [Reveal my identity to {lender}] — the button says exactly what happens (no "Continue" euphemism; the brand's honesty extends to button labels).

### 5.6 The Reveal — the brand's signature moment

On confirm: the borrower's own masked profile appears, and the redaction bars dissolve top-to-bottom (600ms; instant under reduced-motion) revealing their real details — then: "{Lender} can now see this. They typically reach out within {SLA}." One contextual next step: "Add a note to introduce yourself" (optional, in-app message). The losing lenders' cards collapse to a quiet "Auction ended" state. This is the only ceremony in the product; it lands precisely because everything else stayed calm.

### 5.7 Lifecycle surfaces

- **Rate-watch:** dashboard toggle + a monthly "Your market" SMS/email (band + delta in mono). The legal, opt-in trigger-lead replacement — designed as a gift, formatted exactly like the market-context band so it compounds familiarity.
- **Post-close:** anniversary check-ins reuse the same band module. One template, three lifecycle jobs — build once.

### 5.8 Lender portal — terminal calm

Same tokens, `compact` density, ink-800 left rail (Board / My bids / Connections / Wallet / ROI / Settings), content panes on `--paper`.

- **Board:** masked auction cards in a responsive grid — band chips, county, loan amount (mono), product/purpose, countdown, bid count, "Best APR: 6.13% — held by **Paddle #3**" (lender competitors are paddle-anonymized; identity masking is symmetrical and the snapshot tests already assert zero borrower PII). Filters mirror CoverageBox fields. Empty state: "No live auctions in your coverage box — widen products or FICO floor to see more" + edit link (an empty state that sells coverage expansion).
- **Bid composer:** right-side sheet, the BidCard form with **live server-computed APR preview** updating in mono as they type (the APR engine as a product feature — lenders feel the uniform comparison they're entering). Submit button shows the true cost: "Place bid — 1 credit + $2 data surcharge." Atomic debit messaging on success; insufficient balance → inline top-up, never a dead modal.
- **ROI dashboard:** bids, win rate, cost-per-funded (their inputs) in mono big-number cards + a plain sentence: "Your cost per funded loan on VieRates: **$212** vs your reported lead channel: **$2,400**." This screen is the renewal engine — design it like the sales collateral it is.
- **Connections inbox:** each intro card carries the consent record summary + TrustedForm link ("litigation-grade proof" framing from the Master Plan, made visible).

---

## §6 — DESIGN TOKENS & SIGNATURE ELEMENTS

_(The build spec's Global Context references this section: "all UI follows /docs/brand-kit.md §6 — tokens only, IBM Plex Mono tabular for all financial figures, gold (--paddle) appears ONLY on bids and primary CTAs." The tokens below are the implementation.)_

### 6.1 CSS variables (drop into `globals.css`; Tailwind theme maps 1:1)

```css
:root {
  /* surfaces & ink */
  --ink-900: #07211b;
  --ink-800: #0c2a23;
  --ink-700: #143b31;
  --ink-600: #1e4f42;
  --paper: #f5f7f3;
  --card: #ffffff;
  --line: #dce3db;
  --text: #13241f;
  --text-muted: #54655c;
  --text-faint: #7e8c83;
  /* accent & semantic */
  --paddle: #d9a52b;
  --paddle-deep: #b8881c;
  --paddle-tint: #f9efd6;
  --verified: #14724b;
  --verified-tint: #e4f2ea;
  --info: #2f5d7e;
  --info-tint: #e8f0f6;
  --alert: #b23b2e;
  --alert-tint: #f9e9e7;
  --caution: #8a4d0f;
  --caution-tint: #f6eddf;
  /* shape & depth */
  --r-input: 8px;
  --r-btn: 10px;
  --r-card: 14px;
  --r-chip: 999px;
  --r-redaction: 0;
  --shadow-1: 0 1px 2px rgb(7 33 27 / 6%), 0 4px 12px rgb(7 33 27 / 6%);
  /* type */
  --font-serif: "IBM Plex Serif", Georgia, serif;
  --font-sans: "IBM Plex Sans", Arial, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", "Courier New", monospace;
  /* density (lender portal sets --density:compact) */
  --row-h: 56px;
  --row-h-compact: 40px;
}
```

Tailwind: extend `colors`, `fontFamily`, `borderRadius`, `boxShadow` from these variables only; lint rule (`eslint-plugin-tailwindcss` + custom check) fails any arbitrary hex value in `className`.

### 6.2 Signature element specs

**LiveBidLedger (the homepage signature).** `--ink-800` panel, `--r-card`. Header row in `label` style (paper at 60% opacity): Time · Profile · Product · APR. 6 rows visible; new rows enter per §3.5 motion; rows older than ~90s fade one step. Row anatomy: mono timestamp (`14:02:11`) · band chips (`FICO 720–759` `LTV 62%`) · product chip (`30-yr fixed`) · **APR in `--paddle` mono** (`6.13%`). Demo mode: "Example bids" `label`-style tag pinned top-right (build spec requirement). Reserve the panel's exact height pre-hydration (zero CLS). On mobile the ledger sits directly under the CTA at 4 rows.

**RedactionBar.** `--ink-900`, radius 0, height = line-height of the text it masks, width = realistic field width (vary 60–90% — uniform bars look fake). Pairs with a `label`-style caption ("Sealed until you pick"). Accessibility: `aria-label="Hidden — revealed only to the lender you choose"`. Never used decoratively over non-identity content.

**RateDisplay.** The compliance-by-component primitive (build spec): renders APR in `money-xl`/`money`, with required props `apr`, `asOfDate`, `assumptions` (dev-throw if missing). Visual: APR dominant, rate secondary, assumptions in a `body-sm` muted line or info sheet. All rates everywhere flow through it — marketing included.

**Band chips.** Bordered pills (`--line` border, `--card` fill), `label`-style category + `money-sm` value. Verified variant: `--verified-tint` fill + check icon. These are the product's vocabulary — same component in wizard, board, bid room, and Bid Index.

**Countdown ring.** SVG ring, `--ink-600` track, `--verified` progress (> 1h) → `--paddle` (< 1h), mono time centered. Used in Bid Room and on lender board cards (smaller variant).

---

## §7 — COPY LIBRARY (VERBATIM)

Voice: plain, exact, on-your-side. Sentence case. Short sentences. Numbers do the persuading. Never exclamation points, never "unlock/supercharge/dream home," never punching competitors by name.

### 7.1 Home hero

- **H1:** Lenders compete. You stay anonymous. You choose.
- **Sub:** List your loan in 60 seconds — free, no spam calls, no credit hit. Verified borrowers get firm bids from licensed lenders in a 48-hour auction.
- **CTA:** Start my listing · **Secondary:** See how it works
- **TrustBar items:** Free for borrowers — always · Your data is never sold · Soft check only — no score impact · Licensed, NMLS-verified lenders

### 7.2 Lender hero (`/lenders`)

- **H1:** Stop buying leads. Start winning borrowers.
- **Sub:** Verified, consented borrowers. Exclusive introductions and firm-bid auctions — at a fraction of your current cost per funded loan.
- **CTA:** Apply for a Founding Lender seat
- **Stat module headers:** Shared internet leads `[STAT]` · VieRates auction `[STAT]` · VieRates connection `[STAT]` — "Here's the math" link opens assumptions.

### 7.3 The Two Doors (§5.2)

- **Header:** You're listed. Here's your market.
- **Market band template:** Verified borrowers like you received bids between `{low}%–{high}%` this week. _(as-of {date})_
- **Bid Room card:** Lenders compete with firm, lockable offers. About 3 minutes · soft check only · no score impact · you stay anonymous. **CTA:** Open my Bid Room
- **Connect card:** Browse verified lenders and introduce yourself to one. No verification needed. **CTA:** Browse lenders
- **Difference link:** What's the difference?

### 7.4 FAQ seeds (home)

1. **Is it really free?** Yes — borrowers never pay. Lenders pay flat fees to participate. We never take a cut of your loan.
2. **Will this hurt my credit?** No. Opening your Bid Room uses a soft inquiry, which doesn't affect your score. The lender you pick runs their normal credit check later, like any application.
3. **Who sees my information?** Lenders see your loan profile — credit band, loan size, county — never your name, phone, or street address. Your identity goes to one lender only: the one you choose.
4. **Are the bids real?** Every bid is a firm offer from a licensed, NMLS-verified lender, keyed to your verified profile, subject only to a standard appraisal. We compute every APR the same way so offers compare honestly. Lenders who don't honor bids lose access.
5. **What happens after I pick?** Your contact details and verified reports go to that one lender. They reach out, you proceed like any normal loan — just with a better deal and zero spam.

### 7.5 Key notification copy

- First bid (SMS): "Your first bid is in: `{apr}%` APR from {lender}. Your Bid Room: {link}"
- Auction closed (SMS): "Your bids are in. Compare and pick your winner: {link}"
- Pick reminder (close+6d): "Your bids expire tomorrow — still the firm numbers you saw. {link}"
- Rate-watch (monthly): "Your market this month: profiles like yours saw `{low}%–{high}%` ({delta} vs last month). {link}"

---

## §8 — MICROCOPY & COMPLIANCE LANGUAGE

### 8.1 Reassurance placement map (Law 5 — adjacent, not aggregated)

| Moment               | Exact line                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| Address field        | Checked against public records, then sealed. Lenders never see your street address. |
| Credit chips         | Just your best guess — no credit check here.                                        |
| Phone field          | We'll text one code. We never sell your number.                                     |
| Vendor widget header | Secure connection — handled by {Array/Truv}. We never see your credentials.         |
| Pick confirm         | Your identity goes to {lender} only. The other lenders never learn who you were.    |

### 8.2 Error register

Errors state what happened and the next step; they never apologize theatrically or blame. "That code didn't match — try the newest text." "We couldn't confirm that address automatically — our team will review within 1 business day." Field errors: `--alert` text + 1px `--alert` border, message under field, focus moved to field, never toast-only.

### 8.3 Empty states are directions

Bid Room pre-first-bid → the warming-up state (§5.4). Lender board empty → coverage-expansion prompt (§5.8). Dashboard pre-listing → "List in 60 seconds" with the three TrustBar pledges. No illustration-only empties.

### 8.4 Buttons say what they do

Start my listing · Open my Bid Room · Place bid — 1 credit + $2 data surcharge · Reveal my identity to {lender} · Request introduction. Never: Submit, Continue (except wizard auto-advance fallback), Get started, Learn more (use the actual topic).

### 8.5 The soft-pull sentence (exact, `[COUNSEL]`-final)

> Opening your Bid Room uses a **soft credit check**, which does not affect your credit score. You're giving written permission for this check. Your name and contact details are never shared with any lender unless you choose them.

Rendered verbatim at: the Bid Room interstitial, the verification intro, /how-it-works, and FAQ 2. One sentence, everywhere the same — consistency is a trust signal and a compliance control.

### 8.6 Forbidden phrases (lint the copy)

pre-approved · pre-qualified (until counsel approves a flow) · guaranteed · lowest rate · best loan · apply now · instant approval · no risk · limited time (unless a real bid expiry) · partner offers · we'll find you the best lender · any superlative about a specific rate. Required on every page: FooterDisclosures (Equal Housing logo, `[COUNSEL]` "VieRates is a marketplace, not a lender or broker…" sentence, NMLS Consumer Access link).

---

## §9 — COMPONENT INVENTORY & DEFINITION OF DONE

### 9.1 Inventory (matches build spec Phase 1, with required states)

| Component                  | Required states/variants                                                              |
| -------------------------- | ------------------------------------------------------------------------------------- |
| NavBar                     | default · scrolled (CTA persists) · mobile menu                                       |
| Footer + FooterDisclosures | marketing · app-minimal                                                               |
| Button                     | primary (paddle) · secondary (ink outline) · quiet · destructive · loading · disabled |
| Chip (band/select)         | default · selected · verified · caution                                               |
| Slider                     | default · with AVM preset annotation                                                  |
| ProgressBar                | wizard 3px top variant                                                                |
| RateDisplay                | xl · inline · table cell (props enforced)                                             |
| BidCard                    | borrower full · lender masked-board · best-APR pinned · improved · won/lost           |
| LenderCard                 | directory · connect-confirm                                                           |
| LiveBidLedger              | demo-labeled · live                                                                   |
| RedactionBar               | field mask · headline word                                                            |
| TrustBar                   | 4-item · 3-item mobile                                                                |
| CountdownRing              | >1h · <1h paddle · expired                                                            |
| FaqAccordion               | with schema.org markup                                                                |
| EmptyState                 | direction variant (CTA required)                                                      |
| Toast                      | success · alert · info (never for field errors)                                       |
| ComparisonTable            | post-close pick variant · marketing contrast variant                                  |
| BandChartCard              | Bid Index chart + as-of                                                               |

### 9.2 Definition of done — every screen, every PR

- [ ] Token-only colors (lint passes); **gold budget respected** (≤1 paddle CTA; paddle otherwise only on bids/countdown)
- [ ] All money/rate/countdown numerals in Plex Mono tabular; APRs only via RateDisplay with as-of + assumptions
- [ ] Serif only on marketing surfaces; sentence case; no §8.6 forbidden phrases; buttons say what they do
- [ ] FooterDisclosures present (or app-minimal variant); consent moments write their ConsentRecord
- [ ] Tap targets ≥44px; visible focus; AA contrast (spot-check vs §3.1 table); `prefers-reduced-motion` honored
- [ ] Mobile-first verified at 360px; wizard screens fit one viewport without scroll on 360×740
- [ ] Reassurance line present on any sensitive field (per §8.1 map)
- [ ] PostHog events firing per §11 taxonomy
- [ ] No real PII in any screenshot/demo content; demo data labeled "Example"

---

## §10 — ACCESSIBILITY & PERFORMANCE BUDGETS

**Accessibility (WCAG 2.2 AA):** semantic landmarks; wizard announces step changes (`aria-live=polite`); OTP inputs as a single described group; countdown has an accessible text mirror; redaction bars labeled (§6.2); all sheets focus-trapped with Esc; color never the sole signal (verified = check + label; caution = icon + label); forms navigable by keyboard end-to-end; target Lighthouse a11y ≥ 95 (build spec gate) but treat axe-clean as the real bar.

**Performance (marketing + wizard routes):** LCP < 2.0s on mid-tier Android/4G; CLS < 0.05 (reserve ledger + image dimensions; font `size-adjust`); JS ≤ 130KB gz on `/` (ledger animates with CSS + one tiny stream hook); fonts: 3 variable subsets, preloaded, `swap`; images AVIF/WebP, lazy below fold; SSG everything public (build spec). Bid Room: socket reconnect with state replay; offline banner ("Reconnecting — your bids are safe").

---

## §11 — MEASUREMENT PLAN & EXPERIMENT BACKLOG

### 11.1 Event taxonomy (PostHog; names are contracts)

`wizard_started` · `wizard_step_completed {step}` · `wizard_abandoned {step}` · `listing_published` · `doors_viewed` · `door_selected {bidroom|connect}` · `verify_started` · `verify_credit_done` · `verify_income_done` · `masked_preview_confirmed` · `auction_scheduled` · `first_bid_received` · `bidroom_opened {bids_visible}` · `auction_closed` · `compare_viewed` · `pick_confirmed` · `reveal_completed` · `pick_expired` · `ratewatch_enabled` · lender: `board_viewed` · `bid_composer_opened` · `bid_placed` · `bid_improved` · `connection_purchased` · `roi_viewed`.

Funnels mirror the Master Plan KPIs 1:1 so the Day-90 dashboard is a saved view, not a project: wizard completion (target P50 < 60s, per-step drop-off), **listing→verified (20–30%)**, **close→pick (50–60%)**, first-bid latency (<12h), bids/auction (3.5+).

### 11.2 How to experiment at pilot volume (be honest about power)

At 400–600 listings, classic A/B tests on small lifts are underpowered — running them anyway produces noise worshipped as signal. Sequence instead:

1. **Weeks 1–6: qualitative machine.** Session replays on every wizard abandon ≥ step 3; the Master Plan's "interview every borrower who stalls" with a 5-question script (where did you hesitate, what did you expect, what felt risky); 5-user hallway tests per release (the build spec's <60s gate).
2. **Fix obvious leaks first** (a confusing screen 8 beats any headline test).
3. **A/B only big swings** (expected lift >20%) on the highest-traffic decision: Two-Doors layout order, market-band presence/absence on screen 12, hero subhead. One test at a time, predeclared metric + guardrail (listing quality, complaint rate).

### 11.3 Seed backlog (hypothesis → metric → guardrail)

| Test                                                  | Hypothesis                                           | Metric               | Guardrail         |
| ----------------------------------------------------- | ---------------------------------------------------- | -------------------- | ----------------- |
| Market band on Done screen vs doors-only              | Real numbers lift verification intent                | doors→verify_started | wizard completion |
| Two Doors order (Bid Room first vs side-by-side)      | Primary-first lifts upgrades without killing Connect | listing→verified     | connect volume    |
| Hero sub: "60 seconds" vs "no spam calls" lead        | Anti-spam promise outpulls speed for cold traffic    | visit→wizard_started | bounce            |
| First-bid SMS copy: APR number vs lender name first   | The number is the hook                               | SMS→bidroom_opened   | unsub rate        |
| Pick reminder at +4d: comparison table inline vs link | Lowering re-decision cost lifts picks                | close→pick           | dispute rate      |

---

## APPENDIX A — RESEARCH BASE (what §2 stands on)

- **First impressions / visual complexity:** Tuch, Presslaber, Stöcklin, Opwis & Bargas-Avila (Google/Univ. Basel), _The role of visual complexity and prototypicality in first impressions of websites_; Lindgaard et al. (50ms).
- **Conventions, scanning, forms:** Nielsen Norman Group — Jakob's Law, F-pattern/scanning studies, form design and progress indicators; Luke Wroblewski, _Web Form Design_.
- **E-commerce/checkout trust & field placement:** Baymard Institute checkout usability research (reassurance adjacency, field reduction, error recovery).
- **Credibility:** Stanford Persuasive Technology Lab, _Web Credibility Project_ (design quality + verifiability as top trust factors).
- **Speed:** Google/SOASTA mobile speed studies (~53% abandonment >3s); Core Web Vitals correlation studies.
- **Multi-step lead flows:** published multi-step vs single-form tests (Venture Harbour et al.); Figure.com's one-question pattern (the build spec's named reference).
- **Behavioral:** Cialdini (commitment/consistency); Hull/Kivetz (goal-gradient); Hick's Law (choice load); Kahneman/Tversky (anchoring; loss aversion — used here only in honest framings).

_Numbers cited are directional benchmarks from these bodies of work, not guarantees; VieRates' own funnel data (§11) supersedes all of them from Day 30 onward._
