# Payment Twin

> **A virtual digital twin of a merchant's payment ecosystem for simulating high-stakes payment decisions, predicting customer behavioral dynamics, and guarding live payment health.**

---

## 1. Executive Summary & Problem Statement

In modern digital commerce, payment infrastructure is mission-critical. Merchants constantly make decisions that directly impact their top-line revenue:
- Switching or load-balancing payment gateways
- Introducing payment method surcharges or convenience fees
- Enforcing stricter 3D-Secure (3DS) authentication rules
- Modifying checkout UI/UX flows or payment method ordering
- Adjusting instant refund policies or cash-on-delivery (COD) thresholds

Today, merchants have only two inadequate options:
1. **Experiment in Production**: Roll out changes live to real customers, risking catastrophic drops in Transaction Success Rates (TSR), checkout abandonment spikes, and irreversible brand damage.
2. **Retrospective Dashboards**: Analyze historical post-mortems after revenue is already lost. Static reports cannot answer forward-looking *"what-if"* questions.

**Payment Twin** solves this by creating a faithful, statistical, agent-based **digital twin** of a merchant's checkout and payment funnel. It learns the merchant's unique **Behavioral DNA** from empirical Razorpay transaction telemetry and simulates how thousands of heterogeneous synthetic customer agents react to hypothetical interventions in a risk-free sandbox.

---

## 2. Core Concepts

### 2.1 The Payment Twin
The Payment Twin is a stochastic simulation model parameterised by empirical payment data. It does not merely replay past transactions; it models customer intent, patience thresholds, method preferences, retry fatigue, and gateway network dynamics. By perturbing model parameters (e.g., simulating a bank outage, a 1.5% card surcharge, or a friction-reducing 1-click checkout), the Twin predicts the downstream impact on **TSR, GMV, blended processing costs (MDR), and customer drop-off**.

### 2.2 Payment Guardian
While the Twin operates primarily in simulation mode (offline/pre-deployment), the **Payment Guardian** acts as a real-time sentinel in production. It continuously computes statistical drift (such as Population Stability Index and CUSUM control charts) between the **expected digital twin distribution** and the **actual live telemetry stream**. When live behavior diverges significantly from the twin’s baseline (e.g., hidden gateway degradation, unexpected dropouts), Guardian alerts merchants immediately with root-cause diagnostics.

---

## 3. High-Level Architecture & Pipeline

The system is structured as a unidirectional, highly modular analytical and simulation pipeline:

```
[ Razorpay Data ] 
       │ (API / Test Telemetry / Event Webhooks)
       ▼
[ 1. Data Ingestion & Sanitization ]
       │ (Validation, Normalization, PII Redaction)
       ▼
[ 2. Behavioral DNA Profiling ]
       │ (Markov Transition Matrices, Latency Hazard Functions, Method Priors)
       ▼
[ 3. Synthetic Customer Agents ]
       │ (Heterogeneous Archetypes: Patience, Method Preferences, Elasticity)
       ▼
[ 4. Payment Twin Simulation Engine ] ◄── [ 5. What-If Scenario Engine ]
       │ (Monte Carlo & Discrete-Event Runs)     (Policies, Fees, Outages, Routing)
       ▼
[ 6. Multi-Scenario Comparison ]
       │ (Delta Matrices, Confidence Intervals, Distribution Shifts)
       ▼
[ 7. Pareto Optimization ]
       │ (Multi-Objective Frontier: Maximize GMV/TSR vs. Minimize Cost/Friction)
       ▼
[ 8. Explainability & Attribution ]
       │ (Causal Decomposition & Sensitivity Analysis)
       ▼
[ 9. Payment Guardian ] ◄── [ Live Production Telemetry ]
       │ (Real-time Anomaly & Distributional Drift Detection)
       ▼
[ 10. FastAPI Backend ] ──► [ 11. React + TypeScript Cockpit & D3 Visualizer ]
```

---

## 4. Main Planned Features

1. **Razorpay Data Ingestion Pipeline**: Ingests payment events, orders, refunds, gateway latencies, and error codes from Razorpay APIs or test datasets.
2. **Behavioral DNA Engine**: Extracts statistical profiles (conversion transition probabilities, dropout hazard rates, method affinity matrices, retry fatigue curves).
3. **Synthetic Customer Agent Generator**: Generates realistic, heterogeneous populations of autonomous customer agents sampled from multivariate behavioral distributions.
4. **Payment Twin Simulation Engine**: Executes discrete-event Monte Carlo simulations across checkout stages with configurable seeds and sample sizes.
5. **What-If Scenario Engine**: Enables merchants to formulate complex business and infrastructure interventions without touching production code.
6. **Multi-Scenario Comparison**: Side-by-side comparative matrices visualizing TSR deltas, GMV variance, fee impacts, and dropout stages across multiple scenarios.
7. **Pareto Optimization Engine**: Computes non-dominated trade-off frontiers across competing objectives (e.g., maximizing conversion vs. minimizing gateway processing fees).
8. **Explainable Simulation Engine**: Decomposes simulation outcome deltas into transparent attribution factors (e.g., "70% of conversion drop was driven by 3DS drop-off among HDFC cardholders").
9. **Payment Guardian**: Real-time runtime monitor computing distributional divergence between twin expectations and live transactions.
10. **FastAPI Backend**: Async, high-throughput REST and WebSocket service powered by Pydantic v2 schemas and structured logging.
11. **React + TypeScript Cockpit**: Modern, responsive merchant cockpit designed with Razorpay-grade design aesthetics.
12. **Animated Customer-Agent Funnel Visualizer**: Dynamic D3.js/Canvas-driven visualization illustrating real-time agent progression, retry loops, and drop-off bottlenecks.
13. **Production-Grade Testing & Observability**: Complete unit, integration, and statistical invariant test suite with structured logging.
14. **Containerized Deployment**: Clean Dockerized setup ready for cloud deployment.

---

## 5. Planned Technology Stack

| Layer | Technology | Rationale & Responsibility |
| :--- | :--- | :--- |
| **Backend Framework** | **Python 3.11+ / FastAPI** | High performance, native async support, automated OpenAPI specs, robust ecosystem. |
| **Data Contracts** | **Pydantic v2** | Strict validation of observed data, scenario configurations, and simulation outputs. |
| **Data Processing** | **Pandas / NumPy** | Vectorized aggregation, data transformation, transition probability calculations. |
| **Simulation Core** | **Custom Engine / Python** *(evaluating Mesa)* | Discrete-event agent lifecycle execution with deterministic Monte Carlo seeding. |
| **ML & Statistics** | **scikit-learn / SciPy** | Kernel Density Estimation (KDE), Markov chains, statistical hypothesis testing (KS-test, PSI). |
| **Optimization** | **SciPy** | Multi-objective optimization, linear/non-linear programming, Pareto frontier generation. |
| **Frontend Cockpit** | **React 18+ / TypeScript / Vite** | Type-safe, component-driven UI with instant HMR and high developer velocity. |
| **Styling & Design** | **Tailwind CSS + Custom Tokens** | Bespoke design system inspired by Razorpay’s enterprise fintech aesthetic. |
| **Funnel Visualizations** | **D3.js / HTML5 Canvas** | High-performance particle/agent rendering and dynamic funnel flow diagrams. |
| **Storage / Database** | **SQLite (initial) / PostgreSQL** | Lightweight relational storage for scenarios, simulation runs, and baseline DNA profiles. |
| **Testing** | **pytest / pytest-asyncio / HTTPX** | Automated unit, regression, and statistical invariant testing. |
| **Version Control** | **Git + GitHub** | Versioned repository tracking and collaborative CI/CD workflows. |

---

## 6. Development Philosophy & Guardrails

- **Statistical Rigor over Smoke & Mirrors**: No fake AI, no hardcoded demo scripts pretending to be intelligent, and no black-box placeholders. Every simulation output must be mathematically grounded in probability distributions, empirical transition matrices, or explicit agent utility functions.
- **Strict Separation of Concerns**: Observed data (facts), Behavioral DNA (statistical models), Synthetic Agents (actors), Scenarios (interventions), and Simulation Results (outcomes) are isolated data structures with clear schema boundaries.
- **Explainability as a First-Class Citizen**: A prediction without an explanation is useless to a merchant. Every scenario result must provide causal decomposition and sensitivity analysis.
- **Modular & Extensible**: Clean interfaces between ingestion, modeling, simulation, API, and UI layers to support progressive enhancement and long-term maintainability.

---

## 7. How the System Will Eventually Work

1. **Baseline Ingestion**: The merchant imports historical or test transaction logs via Razorpay API or CSV upload.
2. **DNA Synthesis**: The backend processes the telemetry into a **Behavioral DNA Profile** representing historical customer and gateway characteristics.
3. **Scenario Definition**: In the React Cockpit, the merchant builds a scenario (e.g., *"Add 2% surcharge on Credit Cards and route UPI to Gateway X with simulated 5% latency increase"*).
4. **Simulation Execution**: The FastAPI engine spawns a population of synthetic customer agents matching the merchant's DNA profile and runs a Monte Carlo discrete-event simulation.
5. **Insights & Optimization**: The frontend displays animated funnel transitions, delta comparison tables, Pareto trade-off curves, and explainability breakdowns.
6. **Live Guardian Monitoring**: Once a policy is deployed live, Payment Guardian monitors the live event stream against the Twin's baseline to detect drift or unintended consequences immediately.

---

## 8. Directory Structure

```
payment-twin/
├── README.md                  # Project overview and specifications (this file)
├── .gitignore                 # Comprehensive Git ignore rules
├── .env.example               # Environment configuration template
├── docs/                      # Technical documentation
│   ├── architecture.md        # Detailed system architecture & data taxonomy
│   └── development-plan.md    # Phased roadmap and milestone breakdown
├── backend/                   # FastAPI backend application (Phase 1+)
├── frontend/                  # React + TypeScript frontend (Phase 10+)
├── data/                      # Dataset directories
│   ├── raw/                   # Raw ingested transaction dumps (.gitkeep)
│   └── processed/             # Cleaned and processed DNA datasets (.gitkeep)
└── tests/                     # Automated test suite (.gitkeep)
```
