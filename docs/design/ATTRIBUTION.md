# Design System & Component Attribution

This document records third-party design references and open-source component attributions utilized in the **Payment Twin** user interface foundation.

---

## 1. Design Language Reference
* **Repository**: [VoltAgent/awesome-design-md](https://github.com/voltagent/awesome-design-md)
* **License**: MIT License / Open Source
* **Usage**: Used strictly as an analytical reference for typography ratios, surface contrast, and token hierarchy. Zero proprietary logos, trademarks, or branding assets are incorporated into Payment Twin.

---

## 2. Skiper UI (Free Component Catalog)
* **Website**: [Skiper UI](https://skiper-ui.com)
* **License / Terms**: Free open-source component distribution.
* **Component Verification**:
  * **Skiper 39 — Canvas Crowd**: Verified Free tier. Uses Canvas 2D and requestAnimationFrame/GSAP ticker for high-density particle/agent crowd flows.
  * **Skiper 58 — Text Roll**: Verified Free tier. Micro-interaction text rolling effect for navigation badges and status transitions.
  * **Skiper 62 — Loop Animation**: Verified Free tier. Continuous pulse/loop indicator for active simulation and live Sentinel monitoring.
  * **Skiper 89 — Scroll Progress**: Verified Free tier. Responsive progress line for deep analytical views.
  * **Skiper 37 — Animated Number**: Verified Free tier. Smooth spring-based counter for numerical KPI statistics.
* **Constraint Compliance**: Zero paid/pro/premium Skiper components are used.

---

## 3. Customer Agent Visualization Strategy (Skiper 39 Adaptation)
* **Underlying Architecture**: Skiper 39 demonstrates high-throughput 2D Canvas rendering for crowd motion without DOM thrashing.
* **Payment Twin Adaptation**:
  * In Step 10D, this technique is adapted for the **Payment Twin Funnel Simulator** (`Landing -> Cart -> Checkout -> Method -> Auth -> Gateway -> Captured/Failed/Retried`).
  * Customer Agents will be rendered as stylized vector particles colored by payment method (`UPI: Cyan #06B6D4`, `Card: Indigo #6366F1`, `Netbanking: Amber #F59E0B`) with velocity vectors driven by transaction latency.
  * **Asset Requirements**: Uses purely generative procedural Canvas drawing (`ctx.arc`, `ctx.beginPath`, `ctx.fillStyle`) — eliminating external sprite sheet dependencies and avoiding proprietary asset licensing.
