"""
Pareto Frontier Multi-Objective Optimization Service.
Implements non-dominated sorting, merchant constraint filtering, Common Random Numbers (CRN)
candidate evaluation, and trade-off frontier extraction.
"""

from copy import deepcopy
import itertools
import math
import time
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from app.core.logging import logger
from app.models.agent import CustomerAgent
from app.models.dna import BehavioralDNAProfile
from app.models.optimization import (
    ConstraintType,
    InfeasibleScenarioItem,
    MerchantConstraint,
    ObjectiveDefinition,
    ObjectiveDirection,
    ObjectiveType,
    OptimizationRequest,
    ParetoFrontierResult,
    ParetoScenarioItem,
    TradeoffSummary,
)
from app.models.scenario import (
    InterventionMode,
    InterventionType,
    ScenarioConfig,
    ScenarioIntervention,
)
from app.models.simulation import (
    AgentSimulationResult,
    SimulationConfig,
    SimulationKPIs,
    VirtualPaymentEnvironment,
)
from app.services.agent_generator import AgentPopulationGenerator
from app.services.payment_twin import PaymentTwinEngine
from app.services.scenario_engine import ScenarioEngine
from app.services.simulation_runner import SimulationRunner

OBJECTIVE_REGISTRY: Dict[ObjectiveType, ObjectiveDefinition] = {
    ObjectiveType.MAX_NET_REVENUE: ObjectiveDefinition(
        objective_type=ObjectiveType.MAX_NET_REVENUE,
        metric_name="net_merchant_revenue_inr",
        direction=ObjectiveDirection.MAXIMIZE,
        unit="INR",
        is_available=True,
    ),
    ObjectiveType.MAX_CONVERSION_RATE: ObjectiveDefinition(
        objective_type=ObjectiveType.MAX_CONVERSION_RATE,
        metric_name="conversion_rate_percent",
        direction=ObjectiveDirection.MAXIMIZE,
        unit="%",
        is_available=True,
    ),
    ObjectiveType.MIN_PROCESSING_FEES: ObjectiveDefinition(
        objective_type=ObjectiveType.MIN_PROCESSING_FEES,
        metric_name="total_processing_fees_inr",
        direction=ObjectiveDirection.MINIMIZE,
        unit="INR",
        is_available=True,
    ),
    ObjectiveType.MIN_FAILURE_RATE: ObjectiveDefinition(
        objective_type=ObjectiveType.MIN_FAILURE_RATE,
        metric_name="failure_rate_percent",
        direction=ObjectiveDirection.MINIMIZE,
        unit="%",
        is_available=True,
    ),
    ObjectiveType.MIN_ABANDONMENT_RATE: ObjectiveDefinition(
        objective_type=ObjectiveType.MIN_ABANDONMENT_RATE,
        metric_name="abandonment_rate_percent",
        direction=ObjectiveDirection.MINIMIZE,
        unit="%",
        is_available=True,
    ),
    ObjectiveType.MIN_AVG_ATTEMPTS: ObjectiveDefinition(
        objective_type=ObjectiveType.MIN_AVG_ATTEMPTS,
        metric_name="average_attempts_per_success",
        direction=ObjectiveDirection.MINIMIZE,
        unit="scalar",
        is_available=True,
    ),
}


class ParetoOptimizer:
    """
    Core optimizer executing multi-objective exploration across counterfactual scenario candidates.
    """

    def __init__(
        self,
        scenario_engine: Optional[ScenarioEngine] = None,
        simulation_runner: Optional[SimulationRunner] = None,
        twin_engine: Optional[PaymentTwinEngine] = None,
        agent_generator: Optional[AgentPopulationGenerator] = None,
    ) -> None:
        self.scenario_engine = scenario_engine or ScenarioEngine()
        self.simulation_runner = simulation_runner or SimulationRunner()
        self.twin_engine = twin_engine or PaymentTwinEngine()
        self.agent_generator = agent_generator or AgentPopulationGenerator()

    def generate_candidate_scenarios(
        self,
        parameter_ranges: Dict[str, List[float]],
        population_size: int,
        random_seed: int,
        max_candidates: int = 150,
    ) -> Tuple[List[ScenarioConfig], List[Dict[str, float]]]:
        """
        Generates Cartesian combinations of search space parameters.
        Raises ValueError if candidate count exceeds max_candidates or is invalid.
        """
        if not parameter_ranges:
            raise ValueError("Parameter ranges dictionary cannot be empty.")

        for k, v in parameter_ranges.items():
            if not v:
                raise ValueError(f"Parameter '{k}' must contain at least one candidate value.")

        grid_keys = sorted(parameter_ranges.keys())
        grid_values = [parameter_ranges[k] for k in grid_keys]
        combinations = list(itertools.product(*grid_values))

        if len(combinations) > max_candidates or len(combinations) > 150:
            raise ValueError(
                f"Candidate space expansion produced {len(combinations)} scenarios, "
                f"exceeding the maximum allowed limit of {max_candidates}."
            )

        candidates: List[ScenarioConfig] = []
        param_maps: List[Dict[str, float]] = []

        for idx, combo in enumerate(combinations):
            param_map = dict(zip(grid_keys, combo))
            interventions = self._build_interventions_from_params(param_map)

            cfg = ScenarioConfig(
                scenario_id=f"candidate_{idx + 1}",
                scenario_name=f"Candidate #{idx + 1} ({param_map})",
                interventions=interventions,
                population_size=population_size,
                random_seed=random_seed,
            )
            candidates.append(cfg)
            param_maps.append(param_map)

        return candidates, param_maps

    def evaluate_feasibility(
        self, kpis: SimulationKPIs, constraints: List[MerchantConstraint]
    ) -> Tuple[bool, List[str]]:
        """
        Evaluates candidate KPIs against hard merchant operational constraints.
        Returns (is_feasible, violated_constraint_descriptions).
        """
        violations: List[str] = []

        for c in constraints:
            if c.constraint_type == ConstraintType.MIN_CONVERSION_RATE:
                if kpis.conversion_rate_percent < c.threshold_value:
                    violations.append(
                        f"Conversion rate {kpis.conversion_rate_percent:.2f}% < required minimum {c.threshold_value:.2f}%"
                    )
            elif c.constraint_type == ConstraintType.MAX_PROCESSING_FEES:
                if kpis.total_processing_fees_inr > c.threshold_value:
                    violations.append(
                        f"Processing fees ₹{kpis.total_processing_fees_inr:,.2f} > allowed maximum ₹{c.threshold_value:,.2f}"
                    )
            elif c.constraint_type == ConstraintType.MAX_FAILURE_RATE:
                if kpis.failure_rate_percent > c.threshold_value:
                    violations.append(
                        f"Failure rate {kpis.failure_rate_percent:.2f}% > allowed maximum {c.threshold_value:.2f}%"
                    )
            elif c.constraint_type == ConstraintType.MIN_NET_REVENUE:
                if kpis.net_merchant_revenue_inr < c.threshold_value:
                    violations.append(
                        f"Net revenue ₹{kpis.net_merchant_revenue_inr:,.2f} < required minimum ₹{c.threshold_value:,.2f}"
                    )

        is_feasible = len(violations) == 0
        return is_feasible, violations

    def compute_pareto_dominance(
        self,
        candidate_items: List[ParetoScenarioItem],
        objectives: List[ObjectiveDefinition],
    ) -> Tuple[List[ParetoScenarioItem], List[ParetoScenarioItem]]:
        """
        Applies mathematical Pareto dominance sorting over feasible candidate items.
        Returns (frontier_scenarios, dominated_scenarios).
        """
        if not candidate_items:
            return [], []

        n = len(candidate_items)

        # 1. Standardize objective values (higher is strictly better)
        std_vectors: List[List[float]] = []
        for item in candidate_items:
            vec: List[float] = []
            for obj in objectives:
                val = item.objective_values.get(obj.metric_name, 0.0)
                # If MINIMIZE, invert sign so maximizing -val is equivalent
                std_val = val if obj.direction == ObjectiveDirection.MAXIMIZE else -val
                vec.append(std_val)
            std_vectors.append(vec)

        # 2. Pairwise Dominance Comparisons
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                v_i = std_vectors[i]
                v_j = std_vectors[j]

                # Check if i dominates j
                at_least_as_good = all(v_i[k] >= v_j[k] for k in range(len(objectives)))
                strictly_better = any(v_i[k] > v_j[k] for k in range(len(objectives)))

                if at_least_as_good and strictly_better:
                    candidate_items[j].dominated_by.append(candidate_items[i].scenario_id)
                    candidate_items[i].dominates_count += 1

        # 3. Partition into Frontier vs Dominated
        frontier: List[ParetoScenarioItem] = []
        dominated: List[ParetoScenarioItem] = []

        for item in candidate_items:
            if len(item.dominated_by) == 0:
                item.is_pareto_optimal = True
                frontier.append(item)
            else:
                item.is_pareto_optimal = False
                dominated.append(item)

        return frontier, dominated

    def optimize(
        self,
        dna: BehavioralDNAProfile,
        request: OptimizationRequest,
    ) -> ParetoFrontierResult:
        """
        Executes end-to-end Pareto multi-objective optimization using Common Random Numbers (CRN).
        """
        start_time = time.perf_counter()

        # 1. Reject if DNA is empty or unavailable
        if (
            dna.status == "empty"
            or dna.reliability.confidence_grade == "UNAVAILABLE"
            or dna.provenance.data_source_type == "NO_DATA_AVAILABLE"
            or dna.provenance.total_sample_size == 0
        ):
            return ParetoFrontierResult(
                status="unavailable",
                message="Cannot execute Pareto optimization: Behavioral DNA is empty or unavailable.",
                optimization_id=f"opt_empty_seed{request.random_seed}",
                total_candidates_evaluated=0,
                feasible_candidates_count=0,
                infeasible_candidates_count=0,
                frontier_size=0,
                objectives=[],
                constraints=request.constraints,
                frontier_scenarios=[],
                dominated_scenarios=[],
                infeasible_scenarios=[],
                tradeoff_summary=TradeoffSummary(),
                baseline_summary={},
                dna_provenance_type=dna.provenance.data_source_type,
                is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
            )

        opt_id = f"opt_{dna.dna_version}_seed{request.random_seed}_{int(time.time())}"

        # 2. Resolve Objective Definitions
        resolved_objectives: List[ObjectiveDefinition] = []
        for obj_type in request.objectives:
            if obj_type in OBJECTIVE_REGISTRY:
                resolved_objectives.append(OBJECTIVE_REGISTRY[obj_type])
            else:
                raise ValueError(f"Unsupported objective type: {obj_type}")

        # 3. Generate Candidate Scenarios
        candidates, param_maps = self.generate_candidate_scenarios(
            parameter_ranges=request.parameter_ranges,
            population_size=request.population_size,
            random_seed=request.random_seed,
            max_candidates=request.max_candidates,
        )

        # 4. Generate Pre-Evaluated Common Random Numbers (CRN) Population ONCE
        base_env = VirtualPaymentEnvironment.from_dna(dna)
        crn_seed = request.random_seed
        base_agents = self.scenario_engine._generate_base_agent_population(
            dna=dna, population_size=request.population_size, random_seed=crn_seed
        )

        # 5. Execute Baseline Simulation ONCE
        base_sim_id = f"base_opt_{crn_seed}"
        base_outcomes: List[AgentSimulationResult] = []
        for agent in deepcopy(base_agents):
            res = self.twin_engine.simulate_agent(
                agent=agent,
                environment=base_env,
                simulation_id=base_sim_id,
                record_events=False,
            )
            base_outcomes.append(res)

        base_kpis, _, _ = self.simulation_runner._aggregate_simulation_kpis(base_outcomes, elapsed_ms=0.0)

        baseline_summary = {
            "net_merchant_revenue_inr": base_kpis.net_merchant_revenue_inr,
            "conversion_rate_percent": base_kpis.conversion_rate_percent,
            "total_processing_fees_inr": base_kpis.total_processing_fees_inr,
            "failure_rate_percent": base_kpis.failure_rate_percent,
            "captured_volume_inr": base_kpis.captured_volume_inr,
        }

        # 6. Evaluate All Candidates on Shared CRN Agents
        feasible_items: List[ParetoScenarioItem] = []
        infeasible_items: List[InfeasibleScenarioItem] = []

        for idx, (cand_cfg, p_map) in enumerate(zip(candidates, param_maps)):
            cand_env = self.scenario_engine.apply_interventions_to_environment(
                base_env, cand_cfg.interventions
            )
            cand_agents = self.scenario_engine.apply_interventions_to_agents(
                base_agents, cand_cfg.interventions, crn_seed
            )

            cand_outcomes: List[AgentSimulationResult] = []
            for agent in cand_agents:
                res = self.twin_engine.simulate_agent(
                    agent=agent,
                    environment=cand_env,
                    simulation_id=cand_cfg.scenario_id,
                    record_events=False,
                )
                cand_outcomes.append(res)

            cand_kpis, _, _ = self.simulation_runner._aggregate_simulation_kpis(
                cand_outcomes, elapsed_ms=0.0
            )

            # Evaluate Constraints
            is_feasible, violations = self.evaluate_feasibility(cand_kpis, request.constraints)

            # Extract Objective Metric Values
            obj_vals: Dict[str, float] = {}
            for obj in resolved_objectives:
                obj_vals[obj.metric_name] = getattr(cand_kpis, obj.metric_name, 0.0)

            if is_feasible:
                # Analytical uncertainty calculation for key objectives
                uncertainty = self._compute_uncertainty_bounds(cand_kpis, cand_outcomes)
                item = ParetoScenarioItem(
                    scenario_id=cand_cfg.scenario_id,
                    scenario_name=cand_cfg.scenario_name,
                    parameter_values=p_map,
                    objective_values=obj_vals,
                    is_pareto_optimal=False,
                    uncertainty_bounds=uncertainty,
                )
                feasible_items.append(item)
            else:
                infeasible_item = InfeasibleScenarioItem(
                    scenario_id=cand_cfg.scenario_id,
                    scenario_name=cand_cfg.scenario_name,
                    parameter_values=p_map,
                    violated_constraints=violations,
                    metric_values=obj_vals,
                )
                infeasible_items.append(infeasible_item)

        # 7. Non-Dominated Sorting on Feasible Items
        frontier_scenarios, dominated_scenarios = self.compute_pareto_dominance(
            feasible_items, resolved_objectives
        )

        # 8. Compute Frontier Trade-off Summary
        tradeoff_summary = self._compute_tradeoff_summary(frontier_scenarios)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return ParetoFrontierResult(
            status="completed",
            message=(
                f"Pareto optimization completed in {elapsed_ms:.1f}ms: "
                f"Evaluated {len(candidates)} candidates, found {len(frontier_scenarios)} non-dominated Pareto-optimal trade-offs."
            ),
            optimization_id=opt_id,
            total_candidates_evaluated=len(candidates),
            feasible_candidates_count=len(feasible_items),
            infeasible_candidates_count=len(infeasible_items),
            frontier_size=len(frontier_scenarios),
            objectives=resolved_objectives,
            constraints=request.constraints,
            frontier_scenarios=frontier_scenarios,
            dominated_scenarios=dominated_scenarios,
            infeasible_scenarios=infeasible_items,
            tradeoff_summary=tradeoff_summary,
            baseline_summary=baseline_summary,
            dna_provenance_type=dna.provenance.data_source_type,
            is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
        )

    def _build_interventions_from_params(
        self, param_map: Dict[str, float]
    ) -> List[ScenarioIntervention]:
        """
        Maps dictionary parameter keys into typed ScenarioIntervention models.
        """
        interventions: List[ScenarioIntervention] = []

        for k, val in param_map.items():
            key_lower = k.lower()
            if "upi_success" in key_lower:
                interventions.append(
                    ScenarioIntervention(
                        intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                        target="upi",
                        mode=InterventionMode.ABSOLUTE,
                        value=val,
                    )
                )
            elif "card_success" in key_lower:
                interventions.append(
                    ScenarioIntervention(
                        intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                        target="card",
                        mode=InterventionMode.ABSOLUTE,
                        value=val,
                    )
                )
            elif "netbanking_success" in key_lower:
                interventions.append(
                    ScenarioIntervention(
                        intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                        target="netbanking",
                        mode=InterventionMode.ABSOLUTE,
                        value=val,
                    )
                )
            elif "card_mdr" in key_lower:
                interventions.append(
                    ScenarioIntervention(
                        intervention_type=InterventionType.FEE_MDR_RATE,
                        target="card",
                        value=val,
                    )
                )
            elif "max_retries" in key_lower:
                interventions.append(
                    ScenarioIntervention(
                        intervention_type=InterventionType.RETRY_POLICY,
                        max_retries_override=int(val),
                    )
                )
            elif "switch_propensity" in key_lower:
                interventions.append(
                    ScenarioIntervention(
                        intervention_type=InterventionType.METHOD_SWITCH_POLICY,
                        switch_propensity_override=val,
                    )
                )
            elif "routing_shift_upi" in key_lower or "upi_shift" in key_lower:
                interventions.append(
                    ScenarioIntervention(
                        intervention_type=InterventionType.METHOD_ROUTING_PREFERENCE,
                        target="upi",
                        shift_percentage=val,
                    )
                )
            elif "auth_latency" in key_lower:
                interventions.append(
                    ScenarioIntervention(
                        intervention_type=InterventionType.LATENCY_FRICTION,
                        auth_latency_multiplier=val,
                    )
                )

        if not interventions:
            # Fallback neutral intervention if no pattern matched
            interventions.append(
                ScenarioIntervention(
                    intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                    target="upi",
                    mode=InterventionMode.DELTA,
                    value=0.0,
                )
            )

        return interventions

    def _compute_uncertainty_bounds(
        self, kpis: SimulationKPIs, outcomes: List[AgentSimulationResult]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Computes analytical sample statistics and 95% Confidence Intervals for key objectives.
        
        Statistical Assumptions:
        1. Conversion Rate: Uses binomial proportion standard error SEM = sqrt(p*(1-p)/N) under the
           Wald/CLT normal approximation, assuming N >= 30 and N*p >= 5.
        2. Net Revenue: Uses sample standard deviation across independent order realizations scaled
           by sqrt(N), assuming finite variance under the Central Limit Theorem.
        When sample size N < 2 or captures are 0, uncertainty bounds return without fabricating variance.
        """
        n = len(outcomes)
        if n < 2:
            return {
                "conversion_rate_percent": {
                    "mean": kpis.conversion_rate_percent,
                    "ci_95": [kpis.conversion_rate_percent, kpis.conversion_rate_percent],
                    "sample_size": n,
                    "method": "insufficient_sample_for_ci",
                },
                "net_merchant_revenue_inr": {
                    "mean": kpis.net_merchant_revenue_inr,
                    "ci_95": [kpis.net_merchant_revenue_inr, kpis.net_merchant_revenue_inr],
                    "sample_size": n,
                    "method": "insufficient_sample_for_ci",
                },
            }

        # 1. Conversion Rate SEM & CI
        p_hat = kpis.conversion_rate_percent / 100.0
        sem_p = math.sqrt((p_hat * (1.0 - p_hat)) / n)
        conv_ci = [
            round(max(0.0, (p_hat - 1.96 * sem_p) * 100.0), 2),
            round(min(100.0, (p_hat + 1.96 * sem_p) * 100.0), 2),
        ]

        # 2. Net Revenue SEM & CI
        amounts = [a.amount_inr - a.fee_inr - a.tax_inr for a in outcomes if a.is_successful]
        if len(amounts) >= 2:
            s_rev = float(np.std(amounts, ddof=1))
            sem_rev = (s_rev / math.sqrt(n)) * n  # scale for total revenue sum
            mean_rev = kpis.net_merchant_revenue_inr
            rev_ci = [
                round(max(0.0, mean_rev - 1.96 * sem_rev), 2),
                round(mean_rev + 1.96 * sem_rev, 2),
            ]
        else:
            mean_rev = kpis.net_merchant_revenue_inr
            rev_ci = [mean_rev, mean_rev]

        return {
            "conversion_rate_percent": {
                "mean": kpis.conversion_rate_percent,
                "ci_95": conv_ci,
                "sem": round(sem_p * 100.0, 3),
                "sample_size": n,
                "method": "binomial_normal_approximation_95",
            },
            "net_merchant_revenue_inr": {
                "mean": kpis.net_merchant_revenue_inr,
                "ci_95": rev_ci,
                "sample_size": n,
                "method": "clt_sample_variance_95",
            },
        }

    def _compute_tradeoff_summary(
        self, frontier_items: List[ParetoScenarioItem]
    ) -> TradeoffSummary:
        """
        Extracts min/max ranges for primary objectives across the non-dominated Pareto frontier.
        """
        if not frontier_items:
            return TradeoffSummary()

        conv_rates = [
            item.objective_values.get("conversion_rate_percent", 0.0) for item in frontier_items
        ]
        revenues = [
            item.objective_values.get("net_merchant_revenue_inr", 0.0) for item in frontier_items
        ]
        fees = [
            item.objective_values.get("total_processing_fees_inr", 0.0) for item in frontier_items
        ]

        return TradeoffSummary(
            conversion_rate_range_percent=[min(conv_rates), max(conv_rates)],
            net_revenue_range_inr=[min(revenues), max(revenues)],
            processing_fees_range_inr=[min(fees), max(fees)],
        )
