# Payment Twin: Phased Development Plan & Roadmap

> **Document Status**: Planned Roadmap (Implementation Ready)  
> **Version**: 1.0.0  
> **Execution Strategy**: Iterative, milestone-driven development following strict architectural boundaries.

---

## 1. Roadmap Overview & Phase Index

| Phase | Title | Focus Area | Status |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Repository Setup & Architectural Foundation** | Workspace structure, docs, git config, env specs | **Completed** |
| **Phase 1** | **Data Contracts, Schemas & Ingestion Layer** | Pydantic models, Razorpay parsing, sanitization | Planned |
| **Phase 2** | **Behavioral DNA Profiling & Statistical Engine** | Transition matrices, hazard curves, priors fitting | Planned |
| **Phase 3** | **Synthetic Customer Agent Generator** | Heterogeneous agent population sampling | Planned |
| **Phase 4** | **Payment Twin Discrete-Event Simulation Core** | Funnel state machine, Monte Carlo runner | Planned |
| **Phase 5** | **What-If Scenario Engine & Multi-Scenario Comparison** | Policy overlays, delta calculations, paired stats | Planned |
| **Phase 6** | **Pareto Optimization & Trade-off Explorer** | Multi-objective optimization (TSR vs MDR vs Friction) | Planned |
| **Phase 7** | **Explainability & Root-Cause Attribution** | Feature decomposition & sensitivity analysis | Planned |
| **Phase 8** | **Payment Guardian (Real-Time Drift Sentinel)** | PSI, KS-test, CUSUM drift detection algorithms | Planned |
| **Phase 9** | **FastAPI Backend Services & WebSocket Streaming** | REST endpoints, WebSocket frame broadcaster, logging | Planned |
| **Phase 10** | **React + TypeScript Frontend Cockpit & Design System** | Custom Razorpay-inspired UI components, layout | Planned |
| **Phase 11** | **Animated Funnel & Agent Flow Visualizer** | D3.js / Canvas particle funnel visualization | Planned |
| **Phase 12** | **End-to-End Testing, Benchmarks & Hardening** | Statistical invariant tests, load tests, Docker | Planned |

---

## 2. Detailed Milestone Specifications

### Phase 0: Repository Setup & Architectural Foundation
- **Objective**: Establish clean, standardized project repository, configuration templates, and comprehensive architectural documentation.
- **Deliverables**:
  - Root directory layout (`backend/`, `frontend/`, `data/`, `tests/`, `docs/`)
  - Project configuration files: `.gitignore`, `.env.example`
  - Core documentation: `README.md`, `docs/architecture.md`, `docs/development-plan.md`
- **Acceptance Criteria**:
  - All directory paths verified and tracked via Git.
  - Zero placeholder application code or unvetted dependencies.

---

### Phase 1: Data Contracts, Schemas & Ingestion Layer
- **Objective**: Build the foundational data layer with robust Pydantic v2 schemas and an ingestion pipeline capable of validating, parsing, and sanitizing Razorpay telemetry and CSV logs.
- **Key Tasks**:
  - Define domain models: `PaymentEvent`, `TransactionRecord`, `GatewayResponse`, `RefundEvent`, `ClientMetadata`.
  - Build `RazorpayIngestionService` supporting both batch CSV/JSONL parsing and simulated API webhook streams.
  - Implement strict PII sanitization (masking pan, cardholder names, email, phone).
  - Write test fixtures with realistic edge cases (malformed records, missing fields, international currencies).
- **Verification Criteria**:
  - 100% schema validation on standard Razorpay test exports.
  - PII sanitization verified through automated regex security tests.

---

### Phase 2: Behavioral DNA Profiling & Statistical Engine
- **Objective**: Create statistical models that extract the merchant’s unique Behavioral DNA from raw ingested transaction logs.
- **Key Tasks**:
  - Implement `BehavioralDNAProfiler` using Pandas and NumPy.
  - Calculate empirical Markov state transition matrices across all funnel steps (Cart $\to$ Method $\to$ Auth $\to$ Capture/Decline/Retry).
  - Fit non-parametric Kernel Density Estimation (KDE) and Weibull hazard distributions for checkout latency and abandonment.
  - Compute conditional method selection probabilities based on cart amount tiers, device type, and time of day.
  - Build gateway reliability matrices segmented by acquirer, card network, and issuing bank.
- **Verification Criteria**:
  - Transition matrices must satisfy row stochasticity (probabilities sum to 1.0 $\pm 10^{-6}$).
  - Fitted hazard curves validated against empirical cumulative incidence curves.

---

### Phase 3: Synthetic Customer Agent Generator
- **Objective**: Construct a multivariate population generator that samples autonomous, heterogeneous synthetic customer agents from the merchant’s Behavioral DNA.
- **Key Tasks**:
  - Define `SyntheticCustomerAgent` state dataclass (archetype, method preference vector, patience threshold $\tau$, max retries $K$, fee elasticity $\epsilon$, 3DS friction tolerance $\gamma$).
  - Implement stratified and copula-based sampling to preserve empirical cross-correlations (e.g., higher AOV correlated with credit cards and higher patience).
  - Implement agent decision policies (e.g., choice heuristics, method fallback rules upon failure, retry fatigue decay).
- **Verification Criteria**:
  - Synthetic population marginal distributions match the source Behavioral DNA within a 5% Kolmogorov-Smirnov tolerance.

---

### Phase 4: Payment Twin Discrete-Event Simulation Core
- **Objective**: Build the core stochastic discrete-event simulation engine that evaluates agent populations across the checkout funnel under baseline conditions.
- **Key Tasks**:
  - Implement the `CheckoutFunnelStateMachine` managing agent lifecycle states.
  - Implement deterministic Monte Carlo execution with seed control for perfect reproducibility.
  - Build vectorized batch execution loops for high-throughput execution (10,000 agents in $<3$ seconds).
  - Calculate simulation summary statistics: Simulated TSR, Net GMV, Blended MDR, Drop-off distributions, and 95% Bootstrap Confidence Intervals.
- **Verification Criteria**:
  - Baseline simulation results match empirical observed KPIs within statistical confidence bounds.
  - Absolute determinism verified: identical seeds yield bit-for-bit identical outputs.

---

### Phase 5: What-If Scenario Engine & Multi-Scenario Comparison
- **Objective**: Enable merchants to formulate policy and infrastructure interventions, execute parallel scenario runs, and compute side-by-side comparative matrices.
- **Key Tasks**:
  - Define declarative scenario schema: `ScenarioConfig` (routing overrides, surcharge rules, latency multipliers, bank outage schedules, friction shifts).
  - Build `ScenarioCompiler` to overlay scenario modifications onto baseline Behavioral DNA.
  - Build `MultiScenarioComparator` computing absolute and percentage deltas ($\Delta\text{TSR}, \Delta\text{GMV}, \Delta\text{MDR}, \Delta\text{Dropouts}$) with Wilcoxon signed-rank significance tests.
- **Verification Criteria**:
  - Modifying a single parameter (e.g., +2% card surcharge) correctly triggers downward demand elasticity in cardholder agents while preserving non-card behaviors.

---

### Phase 6: Pareto Optimization & Trade-off Explorer
- **Objective**: Formulate and solve multi-objective trade-off optimizations across competing business goals.
- **Key Tasks**:
  - Formulate objective functions: $\max(\text{TSR}), \max(\text{GMV}), \min(\text{MDR Fee}), \min(\text{Customer Friction})$.
  - Implement non-dominated sorting algorithms (via SciPy / vectorized ranking) to identify the optimal Pareto frontier across simulated policy variations.
  - Generate recommended operating setpoints for merchants (e.g., "Max Conversion", "Balanced Profitability", "Min Processing Fee").
- **Verification Criteria**:
  - All points in the reported Pareto set are strictly non-dominated by any other tested configuration.

---

### Phase 7: Explainability & Root-Cause Attribution
- **Objective**: Provide granular, mathematical explanations of why a scenario produced its observed outcome deltas.
- **Key Tasks**:
  - Implement causal decomposition of $\Delta\text{TSR}$ and $\Delta\text{GMV}$ into constituent drivers:
    - Gateway reliability contribution
    - Latency friction contribution
    - Surcharge abandonment contribution
    - Retry exhaustion contribution
  - Generate structured natural-language summaries and feature attribution vectors.
- **Verification Criteria**:
  - Sum of constituent attribution factors equals the total observed metric delta within numerical precision tolerance.

---

### Phase 8: Payment Guardian (Real-Time Drift Sentinel)
- **Objective**: Build a production sentinel that monitors live transaction streams and flags statistical divergence from the Twin’s baseline.
- **Key Tasks**:
  - Implement Population Stability Index (PSI) calculator for categorical payment method distributions.
  - Implement Two-Sample Kolmogorov-Smirnov (KS) test for latency and drop-off time drift.
  - Implement Cumulative Sum (CUSUM) control charts for real-time failure rate anomaly detection.
  - Define structured alert dispatching with severity levels (`INFO`, `WARNING`, `CRITICAL`) and automated diagnostic hints.
- **Verification Criteria**:
  - Synthetic drift injection test: Guardian detects a simulated 15% drop in HDFC success rate within a 50-transaction sliding window.

---

### Phase 9: FastAPI Backend Service & WebSocket Streaming
- **Objective**: Wrap analytical and simulation engines in a high-performance asynchronous API service.
- **Key Tasks**:
  - Build REST routes: `/api/v1/data`, `/api/v1/dna`, `/api/v1/simulations`, `/api/v1/scenarios`, `/api/v1/pareto`, `/api/v1/guardian`.
  - Implement WebSocket endpoint `/ws/simulation-stream` for live agent event frame broadcasting.
  - Integrate structured JSON logging, exception handlers, and CORS middleware.
- **Verification Criteria**:
  - Interactive Swagger UI (`/docs`) operational with complete request/response schemas.
  - Clean async concurrency handling under concurrent simulation load.

---

### Phase 10: React + TypeScript Frontend Cockpit & Design System
- **Objective**: Build a responsive, state-of-the-art merchant cockpit with custom design tokens inspired by Razorpay's product ecosystem.
- **Key Tasks**:
  - Scaffold React + TypeScript application with Vite and Tailwind CSS.
  - Build custom design system: dark/light theme tokens, typography, glassmorphism cards, stat widgets, segmented controls, and metric pills.
  - Implement Scenario Builder with interactive policy controls (surcharge sliders, routing rules, bank downtime toggles).
  - Implement Scenario Comparison Matrix and Pareto Trade-off Explorer.
- **Verification Criteria**:
  - Zero TypeScript compilation errors.
  - Responsive design across desktop and mobile viewports.

---

### Phase 11: Animated Funnel & Agent Flow Visualizer
- **Objective**: Create a dynamic, interactive visualization of synthetic customer agents progressing through the checkout funnel.
- **Key Tasks**:
  - Implement D3.js / HTML5 Canvas particle rendering engine.
  - Animate agent flows between funnel nodes (Cart $\to$ Method $\to$ Auth $\to$ Gateways $\to$ Success / Drop / Retry).
  - Display interactive tooltips showing agent state (archetype, cart value, chosen method, retry count).
- **Verification Criteria**:
  - Smooth 60 FPS animation rendering under 1,000+ simultaneous agent particles.

---

### Phase 12: End-to-End Testing, Benchmarks & Hardening
- **Objective**: Validate the full system integration, execute statistical property tests, and prepare containerized deployment.
- **Key Tasks**:
  - Write end-to-end integration tests connecting FastAPI backend with mock simulation workloads.
  - Execute statistical property-based testing (Hypothesis/pytest) for distribution invariants.
  - Create `Dockerfile` and `docker-compose.yml` for unified backend and frontend orchestration.
- **Verification Criteria**:
  - Full test suite passing with $>90\%$ code coverage on core simulation and analytical modules.
