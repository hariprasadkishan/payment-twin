# IMPORTANT: Autonomous Execution & Verification

Whatever action you can perform yourself, please do it yourself.

This includes, but is not limited to:

- Starting required applications and development servers
- Running the frontend locally
- Running tests, linting, type checks, and builds
- Inspecting the actual rendered application
- Using available browser/visual verification tools
- Checking routes and interactions
- Investigating errors
- Verifying your implementation before reporting completion
- Fixing issues you discover during verification

Do not ask me to perform an action that you can perform yourself with the available tools.

Only ask me when:

1. An action requires explicit user approval, such as installing a plugin/package/MCP or making a destructive Git operation.
2. A required credential, permission, or external resource is unavailable.
3. A genuine design/product decision cannot reasonably be inferred from the existing instructions.

Do not claim that something works merely because the code compiles. Start the necessary apps, run the necessary checks, and verify the actual result yourself whenever the available environment allows it.

# Payment Twin — Codex Agent Instructions

## 1. Product Mission

Payment Twin is a professional fintech / merchant-intelligence product.

Core product framing:

> Razorpay shows what happened. Payment Twin simulates what could happen.

The product learns aggregate merchant payment behaviour through Behavioral DNA, generates synthetic Customer Agents, simulates payment funnels, runs What-If counterfactuals, and provides Pareto optimization.

Payment Guardian is the monitoring and statistical-drift companion.

The frontend must make Payment Twin feel like a real, shippable financial product.

Quality benchmark:
- Mercury
- Stripe
- Razorpay

The product's own simulation, intelligence, and optimization capabilities must remain its differentiator.

## 2. Design Reference Hierarchy

### Primary — Mercury
Use for information architecture, dashboard/product feel, financial workflows, navigation, tables, filters, analytics, drawers/detail views, operational actions, density, spacing, and restrained visual emphasis.

### Secondary — Stripe and Razorpay
Use for fintech dashboard conventions, payment workflows, financial data presentation, statuses/states, analytics, operational clarity, payment terminology, and interaction patterns.

### Component / interaction inspiration — ThreeUI and Skiper UI
Use selectively for useful component patterns, interaction quality, transitions, and practical UI behaviour. Do not make Payment Twin look like a component showcase.

### Design-engineering / anti-slop references
Use principles from Impeccable, Taste Skill, and Emil Kowalski's design/animation guidance for hierarchy, typography, spacing, interaction quality, motion, restraint, consistency, and avoiding generic AI-generated design.

References are benchmarks and sources of principles, NOT templates. Do not copy logos, branding, proprietary visual identity, exact layouts, exact color systems, or exact typography.

## 3. Visual Direction

Target a serious modern fintech interface.

Prefer:
- light interface
- warm off-white / neutral canvas
- charcoal text
- restrained navy / indigo as primary action/accent
- semantic green/amber/red only for actual data states
- precise typography
- strong hierarchy
- clean tables
- useful charts
- subtle borders
- disciplined spacing
- dense but readable information
- operational workflows
- meaningful empty/loading/error states

Avoid:
- cyberpunk
- neon
- glassmorphism
- excessive gradients
- glowing borders
- decorative particles
- fake live indicators
- excessive shadows
- excessive pills
- excessive rounded containers
- all-caps UI everywhere
- giant hero sections inside the dashboard
- huge decorative typography
- nested-card layouts
- card grids for everything
- generic AI SaaS aesthetics
- decorative animation
- visual noise

Cards are allowed when containment is genuinely useful. Do not put every metric or piece of information inside a card.

Use a mix of metric strips, tables, charts, sections, dividers, inline statistics, panels, expandable rows, drawers, filters, tabs, and contextual actions.

Do not compensate for weak hierarchy with decoration.

## 4. Typography

Typography should feel like a modern financial product.

Prioritize:
- clear hierarchy
- readable body text
- restrained headings
- tabular numbers for financial metrics
- consistent font weights
- readable tables
- concise labels

Avoid oversized typography used as decoration, unnecessary display fonts, excessive letter spacing, and all-caps labels everywhere.

## 5. Navigation

Use straightforward product vocabulary:

PAYMENT TWIN
Merchant Intelligence

Overview

INTELLIGENCE
  Behavioral DNA
  Customer Agents
  Payment Guardian

SIMULATION
  Payment Twin
  What-If Studio
  Pareto Optimizer

SYSTEM
  Settings

Preserve the existing routing architecture unless a genuine technical reason requires a change. Do not rename functionality casually.

## 6. Page-Level Product Direction

Every page should feel like an operational workspace rather than a collection of feature cards.

### Overview / Command Center
Do not build an oversized marketing hero. Build a real merchant command center with appropriate surfaces for:
- concise page header
- compact performance metric strip
- payment performance trend
- payment method performance
- Guardian attention/signals
- meaningful recent activity or insights
- clear next actions
- useful drill-down paths

It should answer:
1. What is happening with my payment business?
2. What should I investigate or do next?

### Behavioral DNA
Professionally present:
- payment method mix
- success/capture rates
- amount distribution
- retry behaviour
- failure diagnostics
- temporal behaviour
- fee economics
- meaningful comparisons
- provenance/sample information

Do not turn every metric into a decorative card.

### Customer Agents
Make the synthetic population visually interesting without becoming gimmicky. Show population overview, archetype distribution, filters, behavioural attributes, calibration information, agent details, and a useful inspector/detail drawer.

Agent movement is allowed when it represents actual simulation entities. Do not use decorative particles just because they look futuristic.

### Payment Guardian
Treat Guardian as a serious monitoring/operations interface. Show, where supported:
- alert state
- signal
- baseline
- observed value
- evidence
- practical/business impact
- lifecycle state
- recommended investigation/action
- Payment Twin handoff

Never fake real-time monitoring. Never use artificial pulsing/live indicators to imply live monitoring. Never imply causality where the backend only establishes statistical deviation.

### Payment Twin
This is the flagship product experience. It should feel like a professional simulation workspace inside the fintech dashboard.

Clearly expose:
- population
- seed
- simulation mode
- funnel
- payment attempts
- captures
- failures
- abandonment
- conversion
- revenue
- uncertainty

Simulation animation is encouraged when it communicates actual simulation behaviour. Do not turn the page into a sci-fi laboratory.

### What-If Studio
Treat this as a serious scenario-analysis workspace. Show, where supported:
- baseline
- scenario controls
- changed assumptions
- projected outcomes
- comparison
- attribution
- uncertainty
- clear handoff to optimization

Make the causal/attribution story understandable and avoid unsupported causal claims.

### Pareto Optimizer
Treat this as a decision/optimization workspace. Show:
- objectives
- constraints
- candidate solutions
- Pareto frontier
- recommended operating point
- rationale
- uncertainty
- useful comparison/detail views

Do not make the visualization the entire page. The merchant should understand: "What operating point should I choose, and why?"

### Settings
Keep Settings professional and functional. Do not spend visual effort on decorative settings cards.

## 7. Motion and Landing-Page Direction

Payment Twin has two visual modes.

### Marketing / landing surfaces
Landing pages may use more expressive, cinematic motion to explain the product.

Motion should tell the Payment Twin story:
- payment events happen
- Behavioral DNA learns patterns
- synthetic customers enter the funnel
- scenarios change assumptions
- outcomes shift
- the merchant discovers a better operating point

Use scroll storytelling, staged reveals, purposeful transitions, diagram choreography, simulation storytelling, and subtle parallax where useful.

The motion should explain the product rather than merely decorate it.

### Application surfaces
Use restrained fintech-product motion for:
- simulation progression
- Customer Agent movement
- chart transitions
- number interpolation
- filtering
- drawers
- scenario changes
- table state changes
- meaningful state transitions

### Never use
- infinite decorative motion
- floating blobs
- bouncing cards
- pulsing everything
- animated borders
- fake "live" effects
- random particles
- meaningless parallax
- excessive spring/bounce
- motion that slows normal workflows

Respect `prefers-reduced-motion`.

Before adding a new animation dependency, inspect the existing stack and reuse existing capabilities where appropriate.

## 8. Technical Preservation

The backend is complete and MUST remain frozen during the frontend rebuild.

Do not modify backend logic.

Preserve:
- React
- TypeScript
- Vite
- existing routing
- hooks
- services
- store
- types
- API integration
- provenance rules
- existing application state patterns

Important directories:
- `frontend/src/hooks/`
- `frontend/src/services/`
- `frontend/src/store/`
- `frontend/src/types/`
- `frontend/src/lib/`

Do not rewrite these merely for visual reasons. Reuse existing APIs and hooks. Do not invent backend endpoints. Do not replace working functionality with mock data.

If a design requirement conflicts with an existing API/type, stop and explain the conflict.

## 9. Existing Uncommitted Work

There may be uncommitted frontend work from previous experiments.

Do NOT blindly reset, delete files, overwrite the entire frontend, or discard existing changes.

Before changing a file, inspect its current state. Preserve useful technical functionality and replace visual decisions that conflict with this brief.

## 10. Design System Strategy

Establish a coherent shared design system before rebuilding individual pages.

Standardize:
- typography
- spacing
- colors
- borders
- radii
- buttons
- inputs
- tabs
- tables
- badges
- drawers
- tooltips
- charts
- focus states
- hover states
- disabled states
- loading states
- empty states
- error states

Do not create one-off styling for every page. Do not abstract components merely for abstraction's sake.

## 11. Responsiveness

The product must work well across desktop, laptop, tablet, and smaller screens where practical.

Do not merely shrink the desktop layout. Navigation, tables, charts, filters, drawers and dense data surfaces should degrade intelligently.

## 12. Accessibility

Maintain:
- semantic HTML
- keyboard accessibility
- visible focus states
- readable contrast
- usable controls
- sensible interaction states
- reduced-motion support

Do not sacrifice usability for visual polish.

## 13. Data and State Honesty

Never fake:
- real-time signals
- transactions
- monitoring events
- alerts
- performance numbers
- backend capabilities

Use actual application data.

When data is unavailable, provide a polished and informative empty state. When loading, provide a professional loading state. When an API fails, provide a useful error state.

Provenance must remain truthful and visible where appropriate.

Never imply a simulation result is a merchant observation. Never imply statistical deviation proves causality.

## 14. Browser / Visual QA

Code quality alone is insufficient.

When browser tooling is available:
1. Start/use the local frontend.
2. Open the relevant route.
3. Inspect the actual rendered UI.
4. Test important interactions.
5. Check layout issues.
6. Check responsive behaviour.
7. Check loading/empty/error states where applicable.
8. Fix obvious visual problems.
9. Re-check the rendered result.

Do not declare a checkpoint complete merely because TypeScript and build checks pass. Visual quality is a first-class acceptance criterion.

## 15. Dependencies, Plugins, MCPs and Skills

Inspect the existing project and Codex environment before adding anything.

Do NOT install packages, plugins, MCP servers, skills, UI libraries, or animation libraries without explicit user approval.

If something is genuinely required, STOP and report:
1. What capability is missing.
2. Why it is needed.
3. What package/plugin/MCP/skill you recommend.
4. What alternatives exist.
5. Whether the existing stack can solve the problem without it.

Wait for explicit approval before installing anything.

Prefer the existing stack. Do not add dependencies simply because they make a visual effect easier.

## 16. Git Rules

Do not commit automatically. Do not push automatically.

The user controls Git commits and pushes.

Never run destructive Git commands unless explicitly instructed.

Never use:
- `git reset --hard`
- `git clean -fd`

or equivalent destructive operations without explicit approval.

At the end of each checkpoint, report:
- `git status --short`
- `git diff --stat`

One logical checkpoint should normally correspond to one logical user-created commit. Do not create meaningless micro-commits.

## 17. Checkpoint Workflow

Work one checkpoint at a time.

After completing a checkpoint:
STOP.

Do not automatically continue.

Provide:
1. Checkpoint completed.
2. Files changed.
3. What was implemented.
4. Existing functionality preserved.
5. Design decisions made.
6. Technical risks/issues.
7. Validation performed.
8. Manual browser verification steps.
9. What the user should inspect visually.
10. Remaining work for the checkpoint.

Then wait for explicit user approval.

### Checkpoint sequence

1. Shared app shell + global design system
2. Overview / Command Center
3. Behavioral DNA
4. Customer Agents
5. Payment Guardian
6. Payment Twin
7. What-If Studio
8. Pareto Optimizer
9. Settings + responsive polish + global QA

Do not work on future checkpoints early unless a shared dependency genuinely requires it.

## 18. Anti-Slop Quality Gate

Before declaring a checkpoint complete, evaluate the actual rendered result.

Ask:
- Does this look like a serious fintech product?
- Does it feel closer to Mercury/Stripe/Razorpay quality than to an AI-generated dashboard?
- Is the hierarchy immediately understandable?
- Are there too many cards?
- Are there unnecessary rounded containers?
- Is there unnecessary decoration?
- Are gradients/glows/neon effects creeping back in?
- Are headings or labels unnecessarily all-caps?
- Is anything visually shouting without a reason?
- Is the page dense enough to be useful but still easy to scan?
- Does every major visual element serve a product purpose?
- Does the interface feel designed rather than generated?
- Does motion communicate something?
- Does the visual identity remain consistent?

If the answer is no, revise before stopping.

## 19. Implementation Philosophy

Do not optimize for impressive screenshots alone.

Optimize for:
- product credibility
- usability
- information hierarchy
- technical honesty
- financial clarity
- interaction quality
- visual consistency
- professional polish
- performance
- accessibility

The sophistication should come from the PRODUCT and DATA, not visual noise.

The visual design should make complex intelligence understandable.

Payment Twin should feel like a product that could actually ship.

## 20. Current Start Instruction

Begin with:

CHECKPOINT 1 — SHARED APP SHELL + GLOBAL DESIGN SYSTEM

Do not implement the Overview or other feature pages yet unless strictly required to validate the shell.

Do not modify the backend.

Do not install plugins, MCPs, skills, packages or UI libraries.

Do not commit.

Do not push.

Inspect the current repository state first.

Implement Checkpoint 1.

Validate it.

Report the checkpoint.

STOP and wait for explicit approval before Checkpoint 2.
