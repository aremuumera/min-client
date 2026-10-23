---
version: 1.0
name: MINMEG-design-system
description: MINMEG's light-mode product design system for the admin and merchant portals — white working surfaces, the MINMEG logo green (#1e8742) for actions with white text, the dark brand green (#0a1f1a) for text, the sidebar and overlays, Euclid Circular A everywhere, flat (no shadows), and red / amber used only for errors and warnings. Adapted from a MongoDB design analysis (kept as design.reference-mongodb.md); every colour now comes from the MINMEG logo and website.

colors:
  # ---- brand (from the MINMEG logo) ----
  primary: "#1e8742"
  primary-deep: "#196f37"
  primary-pressed: "#145a2c"
  on-primary: "#ffffff"
  brand-green: "#1e8742"
  brand-green-dark: "#145a2c"
  brand-green-mid: "#5cb948"
  brand-green-light: "#96e12e"
  brand-green-soft: "#e6f4ea"
  # ---- brand dark (from the MINMEG website) ----
  brand-dark: "#0a1f1a"
  brand-dark-hover: "#132f28"
  overlay: "rgba(10, 31, 26, 0.7)"
  # ---- status (errors and warnings only) ----
  semantic-error: "#d92d20"
  semantic-error-bg: "#fef3f2"
  semantic-error-text: "#b42318"
  semantic-warning: "#f5a524"
  semantic-warning-bg: "#fff8e0"
  semantic-warning-text: "#946f3f"
  # ---- surfaces ----
  canvas: "#ffffff"
  surface: "#f9fbfa"
  surface-soft: "#f4f7f6"
  surface-feature: "#f1f9f3"
  hairline: "#e1e5e8"
  hairline-soft: "#eceff1"
  hairline-strong: "#c1ccd6"
  hairline-dark: "#1d3530"
  # ---- text ----
  ink: "#0a1f1a"
  charcoal: "#1c2d38"
  slate: "#3d4f5b"
  steel: "#5c6c7a"
  stone: "#7c8c9a"
  muted: "#a8b3bc"
  on-dark: "#ffffff"
  on-dark-muted: "#a8b3bc"

typography:
  hero-display:
    fontFamily: Euclid Circular A
    fontSize: 72px
    fontWeight: 500
    lineHeight: 1.10
    letterSpacing: -1.5px
  display-lg:
    fontFamily: Euclid Circular A
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -1px
  heading-1:
    fontFamily: Euclid Circular A
    fontSize: 48px
    fontWeight: 500
    lineHeight: 1.20
    letterSpacing: -0.5px
  heading-2:
    fontFamily: Euclid Circular A
    fontSize: 36px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.5px
  heading-3:
    fontFamily: Euclid Circular A
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.30
  heading-4:
    fontFamily: Euclid Circular A
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.35
  heading-5:
    fontFamily: Euclid Circular A
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.40
  subtitle:
    fontFamily: Euclid Circular A
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.50
  body-md:
    fontFamily: Euclid Circular A
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  body-md-medium:
    fontFamily: Euclid Circular A
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.55
  body-sm:
    fontFamily: Euclid Circular A
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.50
  body-sm-medium:
    fontFamily: Euclid Circular A
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.50
  caption:
    fontFamily: Euclid Circular A
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.40
  caption-bold:
    fontFamily: Euclid Circular A
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.40
  micro:
    fontFamily: Euclid Circular A
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.40
  micro-uppercase:
    fontFamily: Euclid Circular A
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.40
    letterSpacing: 1px
  button-md:
    fontFamily: Euclid Circular A
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.30
  code-md:
    fontFamily: Source Code Pro
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 40px
  section-sm: 48px
  section: 64px
  section-lg: 96px
  hero: 120px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "10px 22px"
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
  button-primary-disabled:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "10px 22px"
    border: "1px solid {colors.hairline-strong}"
  button-danger:
    backgroundColor: "{colors.semantic-error}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "10px 22px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.brand-green-dark}"
    typography: "{typography.body-sm-medium}"
    padding: "0"
  button-on-dark:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "10px 22px"
  button-secondary-on-dark:
    backgroundColor: "transparent"
    textColor: "{colors.on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "10px 22px"
    border: "1px solid {colors.hairline-dark}"
  card-base:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.hairline}"
  card-feature:
    backgroundColor: "{colors.surface-feature}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.brand-green-soft}"
  card-dark:
    backgroundColor: "{colors.brand-dark}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    height: 44px
    border: "1px solid {colors.hairline-strong}"
  text-input-focused:
    border: "2px solid {colors.primary}"
  text-input-error:
    border: "2px solid {colors.semantic-error}"
  search-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.steel}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 44px
    border: "1px solid {colors.hairline-strong}"
  segmented-tab:
    textColor: "{colors.steel}"
    typography: "{typography.body-sm-medium}"
    padding: "{spacing.sm} {spacing.md}"
  segmented-tab-active:
    textColor: "{colors.brand-green-dark}"
    border: "0 0 2px {colors.primary} solid"
  pill-tab:
    textColor: "{colors.steel}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.md}"
    border: "1px solid {colors.hairline}"
  pill-tab-active:
    backgroundColor: "{colors.brand-dark}"
    textColor: "{colors.on-dark}"
  badge-success:
    backgroundColor: "{colors.brand-green-soft}"
    textColor: "{colors.brand-green-dark}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-neutral:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.slate}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-warning:
    backgroundColor: "{colors.semantic-warning-bg}"
    textColor: "{colors.semantic-warning-text}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-error:
    backgroundColor: "{colors.semantic-error-bg}"
    textColor: "{colors.semantic-error-text}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-dark:
    backgroundColor: "{colors.brand-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  table:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline}"
  table-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.steel}"
    typography: "{typography.micro-uppercase}"
  table-row:
    padding: "{spacing.sm} {spacing.md}"
    border: "0 0 1px {colors.hairline-soft} solid"
  table-row-selected:
    backgroundColor: "{colors.brand-green-soft}"
  sidebar:
    backgroundColor: "{colors.brand-dark}"
    textColor: "{colors.on-dark-muted}"
    typography: "{typography.body-sm-medium}"
    width: 264px
  sidebar-item-hover:
    backgroundColor: "{colors.brand-dark-hover}"
    textColor: "{colors.on-dark}"
  sidebar-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  top-bar:
    backgroundColor: "{colors.canvas}"
    height: 64px
    border: "0 0 1px {colors.hairline} solid"
  modal:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
    border: "1px solid {colors.hairline}"
  modal-overlay:
    backgroundColor: "{colors.overlay}"
  side-sheet:
    backgroundColor: "{colors.canvas}"
    border: "0 0 0 1px {colors.hairline} solid"
  toast:
    backgroundColor: "{colors.brand-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-sm-medium}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
  tooltip:
    backgroundColor: "{colors.brand-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xxs} {spacing.xs}"
  callout-error:
    backgroundColor: "{colors.semantic-error-bg}"
    textColor: "{colors.semantic-error-text}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid {colors.semantic-error}"
  callout-warning:
    backgroundColor: "{colors.semantic-warning-bg}"
    textColor: "{colors.semantic-warning-text}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid {colors.semantic-warning}"
  code-block:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.code-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
---

## Overview

MINMEG is a supply-chain traceability, trade and certification platform used by MINMEG staff (admin portal) and by mining companies, buyers, suppliers and inspectors (merchant portal) — often on a phone or tablet at a mine, a weighbridge or a warehouse gate. The design is a calm, flat, **light-mode-only** working tool: white pages, thin hairline borders, the MINMEG logo green for every action, and the dark brand green for text, the sidebar and overlays.

**Key characteristics**
- White working surfaces; `{colors.brand-dark}` (#0a1f1a) for the sidebar, toasts, tooltips and dark highlight cards
- One action colour: `{colors.primary}` (#1e8742, the "Minmeg" wordmark) with **white text**
- Flat: **no shadows anywhere** — depth comes from borders, surface tints and the overlay
- Euclid Circular A on every surface
- Pill buttons (`{rounded.full}`), 12px cards (`{rounded.lg}`), 8px inputs (`{rounded.md}`)
- Mobile- and tablet-first for field work: 44px touch targets, tables that turn into cards

## Colors

### Brand (from the MINMEG logo)
- **Primary / Brand Green** ({colors.primary}, #1e8742): buttons, active items, focus rings, progress. White text on it reads 4.6:1.
- **Primary Deep** ({colors.primary-deep}, #196f37): hover.
- **Primary Pressed / Green Dark** ({colors.primary-pressed}, #145a2c): pressed; green text and links on white (7:1).
- **Green Mid** ({colors.brand-green-mid}, #5cb948) and **Green Light** ({colors.brand-green-light}, #96e12e): the logo gradient (#96e12e → #1e8742) and small accents only (a chart line, an illustration). **Never put text on them.**
- **Green Soft** ({colors.brand-green-soft}, #e6f4ea): success badges, selected rows.
- **Surface Feature** ({colors.surface-feature}, #f1f9f3): light green panels.

### Green scale
`primary-50` … `primary-950` (#f1f9f3 → #1e8742 at 500 → #0a1f1a at 950) for tints, charts and legacy classes. 500 = `primary`, 600 = `primary-deep`, 700 = `primary-pressed`, 950 = `brand-dark`. White text only on 500 and darker.

### Brand dark (from the MINMEG website)
- **Brand Dark** ({colors.brand-dark}, #0a1f1a): main text (`ink`), the admin sidebar, toasts, tooltips, dark highlight cards, the login panel.
- **Brand Dark Hover** ({colors.brand-dark-hover}, #132f28): a hovered sidebar item.
- **Overlay** ({colors.overlay}, #0a1f1a at 70%): behind modals, side sheets, drawers and the mobile menu; the dark frame around the camera / QR scanner; captions over photos.

### Status (errors and warnings only)
- **Error** ({colors.semantic-error}) with its background and text: failed, rejected, quarantined, revoked, expired; destructive buttons; field errors.
- **Warning** ({colors.semantic-warning}) with its background and text: pending review, expiring soon, low battery, offline.
- Success uses the brand greens. There is no blue, purple, orange or pink — **no multicolour**.

### Surfaces and text
- **Canvas** ({colors.canvas}): page and card background. **Surface** / **Surface Soft**: table headers, quiet sections, read-only fields.
- **Hairline** (soft / default / strong): dividers, card borders, input borders. **Hairline Dark**: borders on brand-dark surfaces.
- **Ink** ({colors.ink}) headings and body; **Slate** secondary; **Steel** captions and table headers; **Stone** labels; **Muted** placeholders and disabled. On dark: **On Dark** / **On Dark Muted**.

## Typography

### Font Family
**Euclid Circular A** (all text) — loaded from the `euclid-circular-a/` folder in each app (Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700, with italics). Fallbacks: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif.
**Source Code Pro** (or the system monospace): hashes, transaction ids, JSON — never prose. UUIDs are shown in full, never shortened.

### Hierarchy (product use)

| Token | Size | Weight | Use |
|---|---|---|---|
| `{typography.heading-2}` | 36px | 500 | Rare: empty-state and login headlines |
| `{typography.heading-3}` | 28px | 500 | Page titles (desktop) |
| `{typography.heading-4}` | 22px | 500 | Page titles (mobile), section titles |
| `{typography.heading-5}` | 18px | 600 | Card and modal titles |
| `{typography.body-md}` | 16px | 400 | Form inputs and body (16px keeps phones from zooming) |
| `{typography.body-sm}` | 14px | 400 | Table cells, secondary text |
| `{typography.body-sm-medium}` | 14px | 500 | Sidebar items, labels |
| `{typography.caption}` | 13px | 400 | Helper text, timestamps |
| `{typography.caption-bold}` | 13px | 600 | Badges |
| `{typography.micro-uppercase}` | 11px | 600 | Table headers, section eyebrows |
| `{typography.button-md}` | 14px | 600 | Button labels |
| `{typography.code-md}` | 14px | 400 | Hashes, ids, JSON |

The display sizes (`hero-display`, `display-lg`, `heading-1`) are for the marketing website only.

## Layout

### Spacing
- 4px base unit (8px main step): `{spacing.xxs}` 4px … `{spacing.section}` 64px.
- Page padding: 16px mobile, 24px tablet, 32px desktop. Gaps between cards: 16px mobile, 24px desktop.

### Shell
- **Desktop (≥ 1024px):** dark sidebar 264px (collapsible to 72px icons), white top bar 64px, content max 1440px.
- **Tablet (768–1023px):** sidebar collapsed to icons; opens over the content with the overlay.
- **Mobile (< 768px):** top bar with menu button; the sidebar is a full-height drawer over the overlay; primary actions in a sticky bottom bar.

## Elevation & Depth

**Flat — no shadows.** Not on cards, buttons, dropdowns, modals or toasts (no `box-shadow`, no `shadow-*`).
- Separation: `{colors.hairline}` borders and `{colors.surface}` tints.
- Layers (dropdown, popover, modal, sheet): a 1px `{colors.hairline}` border on `{colors.canvas}`; modals and sheets also sit on `{colors.overlay}`.
- Focus: a 2px `{colors.primary}` ring (outline), never a glow.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Small chips |
| `{rounded.sm}` | 6px | Tooltips, code chips |
| `{rounded.md}` | 8px | Inputs, selects, toasts, callouts, sidebar items |
| `{rounded.lg}` | 12px | Cards, tables |
| `{rounded.xl}` | 16px | Modals |
| `{rounded.full}` | 9999px | Buttons, badges, pill tabs, avatars |

## Components

Defined in the `components:` block above. Every one exists **once** in each app's `src/components/ui` and is reused; no one-off copies.
- **Buttons:** primary (green, white text), secondary (outlined), danger (red, white text), ghost, link; on-dark variants for the sidebar / dark cards. Every button has default, hover, pressed, disabled and loading states.
- **Inputs:** text, select, search, textarea, date, number with unit; focused = 2px green, error = 2px red with the message under the field.
- **Badges:** success (green soft), neutral, warning, error, dark — one mapping from each backend status to a badge.
- **Tables:** hairline border, surface header, 44px+ rows; on mobile each row becomes a card.
- **Navigation:** dark sidebar (`sidebar`, `sidebar-item-active` in green with white text), white top bar, tabs (underline or pill).
- **Layers:** modal and side sheet on the overlay; toast and tooltip in brand dark.

## Do's and Don'ts

### Do
- Use `{colors.primary}` with white text for the main action on a screen — one main action per view
- Use `{colors.brand-dark}` for text, the sidebar, toasts and tooltips
- Use red / amber only for errors and warnings
- Keep everything flat: borders and tints, not shadows
- Give every touch target at least 44 × 44px
- Show full UUIDs (wrap or copy button), exact quantities (6 decimals) with their unit

### Don't
- Don't add dark mode or a theme switch — light mode only
- Don't use shadows, glows or blurs
- Don't introduce other colours (blue, purple, orange, pink) or decorative gradients (the logo gradient is the only one)
- Don't put text on `{colors.brand-green-light}` or `{colors.brand-green-mid}`
- Don't use the MongoDB colours kept in `design.reference-mongodb.md`

## Responsive Behavior

### Breakpoints
| Name | Width | Key changes |
|---|---|---|
| Mobile | < 768px | One column; drawer menu; tables → cards; sticky bottom action bar; full-screen modals |
| Tablet | 768 – 1023px | Icon sidebar; two-column forms; tables scroll sideways with the first column fixed |
| Desktop | ≥ 1024px | Full sidebar; multi-column dashboards; side sheets for details |

Test portrait and landscape on tablets; the on-screen keyboard must never hide the field being typed in.

### Touch targets
- Buttons, inputs, selects and table rows: at least 44px tall on every device.
- Icon buttons: 44 × 44px hit area even when the icon is 20px.

### Overflow
- Long codes, names and UUIDs wrap or truncate with the full value in a tooltip and a copy button — never cut silently.
- Wide tables scroll inside their card, not the page. No horizontal scroll on the page itself.

## Known Gaps

- Animation timings: use 150–200ms ease-out until defined.
- Chart colours: shades of the brand greens plus neutral greys only (to be specified with the first dashboard).
- Illustration / empty-state art: not defined yet.
