# Design System Reference: Stripe-Inspired Visual Language
> Source: [VoltAgent/awesome-design-md](https://github.com/voltagent/awesome-design-md) (`design-md/stripe/DESIGN.md`)  
> Note: For visual language reference and inspiration only. Do NOT use proprietary Stripe branding, logos, or assets.

```yaml
version: alpha
name: Stripe-Inspired-design-analysis
description: An inspired interpretation of financial-infrastructure design language — built on deep navy ink, electric indigo/cyan accents, and structured atmospheric contrast. Displays crisp typography with negative letter-spacing for editorial clarity and tabular-figure body type for currency and numerical metrics.
```

---

## Visual Design Reference Principles

1. **Elevation & Surface Polarity**:
   - Deep foundational canvas background.
   - Clean, crisp card surfaces with hairline subtle borders (1px).
   - High-contrast typography with clear hierarchy.

2. **Typography Structure**:
   - Primary display metrics: Clean sans-serif with slight negative tracking (`-0.02em` to `-0.04em`).
   - Tabular numerals (`font-variant-numeric: tabular-nums` / `font-mono`) for all financial amounts, percentages, and timestamps.
   - Restrained, legible body copy with generous line height (`1.4` - `1.5`).

3. **Color & Contrast Roles**:
   - Foundation: Deep Slate Canvas (`#080B11`), Card Surface (`#0F1422`), Hairline Border (`#1C2538`).
   - Accents: Electric Cyan (`#06B6D4`) and Electric Indigo (`#6366F1`).
   - Status Semantics: Emerald (`#10B981`) for capture/success, Amber (`#F59E0B`) for warnings, Crimson (`#EF4444`) for failures/outages.

4. **Component Geometry**:
   - Rounded corners: `12px` (`rounded-xl`) for analytics cards, `8px` (`rounded-lg`) for buttons and interactive controls.
   - Micro-interactions: Subtle hover state borders and soft glow focus rings rather than loud animations.
