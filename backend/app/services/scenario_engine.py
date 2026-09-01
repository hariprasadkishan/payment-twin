"""
What-If Scenario Engine.
Executes counterfactual policy interventions, common random numbers (CRN) comparisons,
transparent causal attribution, and parameter grid matrix sweeps.
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
from app.models.scenario import (
    AttributionStep,
    InterventionMode,
    InterventionType,
    MatrixScenarioRankItem,
    MetricComparison,
    ScenarioCompareResponse,
    ScenarioComparison,
    ScenarioConfig,
    ScenarioIntervention,
    ScenarioMatrixRequest,
    ScenarioMatrixResponse,
)
from app.models.simulation import (
    AgentSimulationResult,
    SimulationConfig,
    SimulationKPIs,
    SimulationResult,
    VirtualPaymentEnvironment,
)
from app.services.agent_generator import AgentPopulationGenerator
from app.services.payment_twin import PaymentTwinEngine
from app.services.simulation_runner import SimulationRunner

SUPPORTED_PAYMENT_METHODS = {"upi", "card", "netbanking", "wallet", "emi"}


class ScenarioEngine:
    """
    Service responsible for applying What-If interventions, maintaining scenario isolation,
    executing Common Random Numbers comparisons, and generating attribution trails.
    """

    def __init__(
        self,
        simulation_runner: Optional[SimulationRunner] = None,
        twin_engine: Optional[PaymentTwinEngine] = None,
        agent_generator: Optional[AgentPopulationGenerator] = None,
    ) -> None:
        self.simulation_runner = simulation_runner or SimulationRunner()
        self.twin_engine = twin_engine or PaymentTwinEngine()
        self.agent_generator = agent_generator or AgentPopulationGenerator()

    def validate_interventions(
        self, interventions: List[ScenarioIntervention], environment: VirtualPaymentEnvironment
    ) -> None:
        """
        Validates that intervention parameters, targets, and bounds are valid and non-conflicting.
        Raises ValueError if invalid.
        """
        if not interventions:
            raise ValueError("Scenario must contain at least one intervention.")

        seen_success_targets = set()
        seen_mdr_targets = set()

        for idx, inv in enumerate(interventions):
            # 1. METHOD_SUCCESS_RATE
            if inv.intervention_type == InterventionType.METHOD_SUCCESS_RATE:
                if not inv.target or inv.target not in SUPPORTED_PAYMENT_METHODS:
                    raise ValueError(
                        f"Intervention #{idx + 1}: Invalid target method '{inv.target}'. "
                        f"Supported methods: {sorted(SUPPORTED_PAYMENT_METHODS)}"
                    )
                if inv.value is None:
                    raise ValueError(f"Intervention #{idx + 1}: 'value' is required for METHOD_SUCCESS_RATE.")

                if inv.mode == InterventionMode.ABSOLUTE:
                    if inv.target in seen_success_targets:
                        raise ValueError(
                            f"Intervention #{idx + 1}: Conflicting duplicate override for method '{inv.target}'."
                        )
                    seen_success_targets.add(inv.target)
                    if not (0.0 <= inv.value <= 1.0):
                        raise ValueError(
                            f"Intervention #{idx + 1}: Absolute success rate {inv.value} out of bounds [0.0, 1.0]."
                        )
                elif inv.mode == InterventionMode.DELTA:
                    current_rate = environment.method_success_rates.get(inv.target, 0.85)
                    new_rate = current_rate + inv.value
                    if not (0.0 <= new_rate <= 1.0):
                        raise ValueError(
                            f"Intervention #{idx + 1}: Delta {inv.value} yields invalid success rate {new_rate} out of bounds [0.0, 1.0]."
                        )

            # 2. METHOD_ROUTING_PREFERENCE
            elif inv.intervention_type == InterventionType.METHOD_ROUTING_PREFERENCE:
                if not inv.target or inv.target not in SUPPORTED_PAYMENT_METHODS:
                    raise ValueError(
                        f"Intervention #{idx + 1}: Invalid target method '{inv.target}'. "
                        f"Supported methods: {sorted(SUPPORTED_PAYMENT_METHODS)}"
                    )
                if inv.shift_percentage is None or not (-100.0 <= inv.shift_percentage <= 100.0):
                    raise ValueError(
                        f"Intervention #{idx + 1}: 'shift_percentage' must be between -100.0 and 100.0."
                    )

            # 3. RETRY_POLICY
            elif inv.intervention_type == InterventionType.RETRY_POLICY:
                if inv.max_retries_override is not None and not (0 <= inv.max_retries_override <= 5):
                    raise ValueError(
                        f"Intervention #{idx + 1}: 'max_retries_override' must be between 0 and 5."
                    )
                if inv.retry_propensity_multiplier is not None and not (
                    0.0 <= inv.retry_propensity_multiplier <= 3.0
                ):
                    raise ValueError(
                        f"Intervention #{idx + 1}: 'retry_propensity_multiplier' must be between 0.0 and 3.0."
                    )

            # 4. METHOD_SWITCH_POLICY
            elif inv.intervention_type == InterventionType.METHOD_SWITCH_POLICY:
                if inv.switch_propensity_override is not None and not (
                    0.0 <= inv.switch_propensity_override <= 1.0
                ):
                    raise ValueError(
                        f"Intervention #{idx + 1}: 'switch_propensity_override' must be between 0.0 and 1.0."
                    )
                if (
                    inv.preferred_fallback_method is not None
                    and inv.preferred_fallback_method.lower() not in SUPPORTED_PAYMENT_METHODS
                ):
                    raise ValueError(
                        f"Intervention #{idx + 1}: Invalid fallback method '{inv.preferred_fallback_method}'."
                    )

            # 5. LATENCY_FRICTION
            elif inv.intervention_type == InterventionType.LATENCY_FRICTION:
                if inv.auth_latency_multiplier is not None and not (0.1 <= inv.auth_latency_multiplier <= 5.0):
                    raise ValueError(
                        f"Intervention #{idx + 1}: 'auth_latency_multiplier' must be between 0.1 and 5.0."
                    )
                if inv.gateway_proc_latency_multiplier is not None and not (
                    0.1 <= inv.gateway_proc_latency_multiplier <= 5.0
                ):
                    raise ValueError(
                        f"Intervention #{idx + 1}: 'gateway_proc_latency_multiplier' must be between 0.1 and 5.0."
                    )

            # 6. FEE_MDR_RATE
            elif inv.intervention_type == InterventionType.FEE_MDR_RATE:
                if not inv.target or inv.target not in SUPPORTED_PAYMENT_METHODS:
                    raise ValueError(
                        f"Intervention #{idx + 1}: Invalid target method '{inv.target}' for fee intervention."
                    )
                if inv.target in seen_mdr_targets:
                    raise ValueError(
                        f"Intervention #{idx + 1}: Conflicting duplicate MDR override for '{inv.target}'."
                    )
                seen_mdr_targets.add(inv.target)
                if inv.value is None or not (0.0 <= inv.value <= 10.0):
                    raise ValueError(
                        f"Intervention #{idx + 1}: MDR percentage value must be between 0.0% and 10.0%."
                    )

            # 7. BANK_HEALTH_MODIFIER
            elif inv.intervention_type == InterventionType.BANK_HEALTH_MODIFIER:
                if not inv.target:
                    raise ValueError(f"Intervention #{idx + 1}: 'target' bank code is required.")
                if inv.health_multiplier is None or not (0.0 <= inv.health_multiplier <= 1.0):
                    raise ValueError(
                        f"Intervention #{idx + 1}: 'health_multiplier' must be between 0.0 and 1.0."
                    )
                target_bank = inv.target.upper()
                if target_bank not in environment.bank_success_rates:
                    raise ValueError(
                        f"Intervention #{idx + 1}: Target bank '{target_bank}' not found in empirical environment bank rates."
                    )

    def apply_interventions_to_environment(
        self, base_env: VirtualPaymentEnvironment, interventions: List[ScenarioIntervention]
    ) -> VirtualPaymentEnvironment:
        """
        Deep-clones base_env, validates interventions, and applies environment modifications.
        Guarantees base_env is completely unmutated.
        """
        self.validate_interventions(interventions, base_env)

        scenario_env = deepcopy(base_env)

        for inv in interventions:
            if inv.intervention_type == InterventionType.METHOD_SUCCESS_RATE and inv.target:
                if inv.mode == InterventionMode.ABSOLUTE and inv.value is not None:
                    scenario_env.method_success_rates[inv.target] = round(inv.value, 4)
                elif inv.mode == InterventionMode.DELTA and inv.value is not None:
                    curr = scenario_env.method_success_rates.get(inv.target, 0.85)
                    scenario_env.method_success_rates[inv.target] = round(max(0.0, min(1.0, curr + inv.value)), 4)

            elif inv.intervention_type == InterventionType.FEE_MDR_RATE and inv.target and inv.value is not None:
                scenario_env.mdr_rates_percent[inv.target] = round(inv.value, 2)

            elif inv.intervention_type == InterventionType.LATENCY_FRICTION:
                lat = scenario_env.latency_assumptions
                if inv.auth_latency_multiplier is not None:
                    m = inv.auth_latency_multiplier
                    lat.upi_auth_latency_sec = (round(lat.upi_auth_latency_sec[0] * m, 2), round(lat.upi_auth_latency_sec[1] * m, 2))
                    lat.card_auth_latency_sec = (round(lat.card_auth_latency_sec[0] * m, 2), round(lat.card_auth_latency_sec[1] * m, 2))
                    lat.netbanking_auth_latency_sec = (round(lat.netbanking_auth_latency_sec[0] * m, 2), round(lat.netbanking_auth_latency_sec[1] * m, 2))
                if inv.gateway_proc_latency_multiplier is not None:
                    gm = inv.gateway_proc_latency_multiplier
                    lat.gateway_proc_latency_sec = (round(lat.gateway_proc_latency_sec[0] * gm, 2), round(lat.gateway_proc_latency_sec[1] * gm, 2))

            elif inv.intervention_type == InterventionType.BANK_HEALTH_MODIFIER and inv.target and inv.health_multiplier is not None:
                b_code = inv.target.upper()
                if b_code in scenario_env.bank_success_rates:
                    scenario_env.bank_success_rates[b_code] = round(
                        scenario_env.bank_success_rates[b_code] * inv.health_multiplier, 4
                    )

        return scenario_env

    def apply_interventions_to_agents(
        self, agents: List[CustomerAgent], interventions: List[ScenarioIntervention], random_seed: int
    ) -> List[CustomerAgent]:
        """
        Deep-clones and applies agent-level policy interventions (routing shifts, retries, switch preferences).
        Preserves original agent amounts and attributes.
        """
        scen_agents = deepcopy(agents)
        rng = np.random.default_rng(random_seed)

        for inv in interventions:
            # 1. RETRY_POLICY
            if inv.intervention_type == InterventionType.RETRY_POLICY:
                for a in scen_agents:
                    if inv.max_retries_override is not None:
                        a.latent_parameters.max_retries = inv.max_retries_override
                    if inv.retry_propensity_multiplier is not None:
                        mult = inv.retry_propensity_multiplier
                        a.latent_parameters.retry_propensity = max(
                            0.0, min(1.0, round(a.latent_parameters.retry_propensity * mult, 4))
                        )

            # 2. METHOD_SWITCH_POLICY
            elif inv.intervention_type == InterventionType.METHOD_SWITCH_POLICY:
                for a in scen_agents:
                    if inv.switch_propensity_override is not None:
                        a.latent_parameters.method_switch_propensity = round(inv.switch_propensity_override, 4)
                    if inv.preferred_fallback_method is not None:
                        target_fallback = inv.preferred_fallback_method.lower()
                        if a.observed_preferences.primary_method != target_fallback:
                            a.observed_preferences.secondary_method = target_fallback

            # 3. METHOD_ROUTING_PREFERENCE (Normalized routing shift)
            elif inv.intervention_type == InterventionType.METHOD_ROUTING_PREFERENCE and inv.target and inv.shift_percentage is not None:
                boost_method = inv.target.lower()
                shift_frac = inv.shift_percentage / 100.0  # e.g. +0.15

                for a in scen_agents:
                    if shift_frac > 0:
                        # Shift non-boosted agents to boost_method with probability = shift_frac
                        if a.observed_preferences.primary_method != boost_method:
                            if rng.random() < shift_frac:
                                a.observed_preferences.secondary_method = a.observed_preferences.primary_method
                                a.observed_preferences.primary_method = boost_method
                    elif shift_frac < 0:
                        # Shift boosted agents away with probability = |shift_frac|
                        if a.observed_preferences.primary_method == boost_method:
                            if rng.random() < abs(shift_frac):
                                a.observed_preferences.primary_method = a.observed_preferences.secondary_method or "card"

        return scen_agents

    def run_scenario(
        self,
        dna: BehavioralDNAProfile,
        scenario: ScenarioConfig,
    ) -> SimulationResult:
        """
        Executes a single counterfactual What-If scenario against Behavioral DNA.
        """
        start_time = time.perf_counter()

        if (
            dna.status == "empty"
            or dna.reliability.confidence_grade == "UNAVAILABLE"
            or dna.provenance.data_source_type == "NO_DATA_AVAILABLE"
            or dna.provenance.total_sample_size == 0
        ):
            return SimulationResult(
                status="unavailable",
                message="Cannot execute What-If scenario: Behavioral DNA is empty or unavailable.",
                simulation_id=f"scen_{scenario.scenario_id}_unavailable",
                population_size=0,
                random_seed=scenario.random_seed,
                dna_provenance_type=dna.provenance.data_source_type,
                is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
            )

        # 1. Base Environment & Interventions
        base_env = VirtualPaymentEnvironment.from_dna(dna)
        scenario_env = self.apply_interventions_to_environment(base_env, scenario.interventions)

        # 2. Generate Base Agents
        base_agents = self._generate_base_agent_population(dna, scenario.population_size, scenario.random_seed)

        # 3. Apply Agent-Level Interventions
        scen_agents = self.apply_interventions_to_agents(
            base_agents, scenario.interventions, scenario.random_seed
        )

        # 4. Execute Simulation
        agent_outcomes: List[AgentSimulationResult] = []
        preview_traces: List[AgentSimulationResult] = []

        for idx, agent in enumerate(scen_agents):
            should_record = idx < scenario.preview_agent_count
            res = self.twin_engine.simulate_agent(
                agent=agent,
                environment=scenario_env,
                simulation_id=scenario.scenario_id,
                record_events=should_record,
            )
            agent_outcomes.append(res)
            if should_record:
                preview_traces.append(res)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        kpis, method_kpis, dropoffs = self.simulation_runner._aggregate_simulation_kpis(
            agent_outcomes, elapsed_ms
        )

        return SimulationResult(
            status="completed",
            message=f"Successfully executed What-If scenario '{scenario.scenario_name}'.",
            simulation_id=scenario.scenario_id,
            population_size=scenario.population_size,
            random_seed=scenario.random_seed,
            dna_provenance_type=dna.provenance.data_source_type,
            is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
            kpis=kpis,
            method_breakdown=method_kpis,
            funnel_dropoffs=dropoffs,
            preview_agent_traces=preview_traces,
        )

    def compare(
        self,
        dna: BehavioralDNAProfile,
        baseline_config: SimulationConfig,
        scenarios: List[ScenarioConfig],
    ) -> ScenarioCompareResponse:
        """
        Executes baseline and counterfactual scenarios under Common Random Numbers (CRN)
        and computes paired metric deltas, financial conservation, and attribution chains.
        """
        if (
            dna.status == "empty"
            or dna.reliability.confidence_grade == "UNAVAILABLE"
            or dna.provenance.data_source_type == "NO_DATA_AVAILABLE"
            or dna.provenance.total_sample_size == 0
        ):
            return ScenarioCompareResponse(
                status="unavailable",
                message="Cannot execute scenario comparison: Behavioral DNA is empty or unavailable.",
                baseline_simulation_id=None,
                baseline_kpis=None,
                comparisons=[],
            )

        if len(scenarios) > 25:
            raise ValueError(f"Maximum 25 scenarios allowed per comparison request (received {len(scenarios)}).")

        # 1. Base Environment (Immutable)
        base_env = VirtualPaymentEnvironment.from_dna(dna)

        # 2. Shared CRN Agent Population
        crn_seed = baseline_config.random_seed
        base_agents = self._generate_base_agent_population(dna, baseline_config.population_size, crn_seed)

        # 3. Execute Baseline Simulation
        base_sim_id = baseline_config.simulation_id or f"sim_base_seed{crn_seed}"
        base_outcomes: List[AgentSimulationResult] = []
        for agent in deepcopy(base_agents):
            res = self.twin_engine.simulate_agent(
                agent=agent,
                environment=base_env,
                simulation_id=base_sim_id,
                record_events=False,
            )
            base_outcomes.append(res)

        base_kpis, base_method_kpis, _ = self.simulation_runner._aggregate_simulation_kpis(
            base_outcomes, elapsed_ms=0.0
        )

        comparisons: List[ScenarioComparison] = []

        # 4. Execute Each Scenario on Shared CRN Agents
        for scen in scenarios:
            scen_env = self.apply_interventions_to_environment(base_env, scen.interventions)
            scen_agents = self.apply_interventions_to_agents(base_agents, scen.interventions, crn_seed)

            scen_outcomes: List[AgentSimulationResult] = []
            for agent in scen_agents:
                res = self.twin_engine.simulate_agent(
                    agent=agent,
                    environment=scen_env,
                    simulation_id=scen.scenario_id,
                    record_events=False,
                )
                scen_outcomes.append(res)

            scen_kpis, scen_method_kpis, _ = self.simulation_runner._aggregate_simulation_kpis(
                scen_outcomes, elapsed_ms=0.0
            )

            # 5. Compute Paired Metric Comparisons
            metric_comparisons = self._compute_paired_metrics(base_kpis, scen_kpis)
            method_deltas = self._compute_method_deltas(base_method_kpis, scen_method_kpis)

            # 6. Generate Transparent Attribution Trail
            attribution_trail = self._generate_attribution_trail(
                interventions=scen.interventions,
                base_kpis=base_kpis,
                scen_kpis=scen_kpis,
                metric_comparisons=metric_comparisons,
            )

            cmp_obj = ScenarioComparison(
                comparison_id=f"cmp_{scen.scenario_id}_vs_baseline",
                scenario_id=scen.scenario_id,
                scenario_name=scen.scenario_name,
                dna_provenance_type=dna.provenance.data_source_type,
                is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
                metric_comparisons=metric_comparisons,
                method_deltas=method_deltas,
                attribution_trail=attribution_trail,
                baseline_kpis=base_kpis,
                scenario_kpis=scen_kpis,
            )
            comparisons.append(cmp_obj)

        return ScenarioCompareResponse(
            status="completed",
            message=f"Successfully evaluated {len(comparisons)} scenario(s) against baseline.",
            baseline_simulation_id=base_sim_id,
            baseline_kpis=base_kpis,
            comparisons=comparisons,
        )

    def expand_and_run_matrix(
        self, dna: BehavioralDNAProfile, request: ScenarioMatrixRequest
    ) -> ScenarioMatrixResponse:
        """
        Expands parameter grid into Cartesian product scenarios and ranks outcomes.
        """
        if (
            dna.status == "empty"
            or dna.reliability.confidence_grade == "UNAVAILABLE"
            or dna.provenance.data_source_type == "NO_DATA_AVAILABLE"
            or dna.provenance.total_sample_size == 0
        ):
            return ScenarioMatrixResponse(
                status="unavailable",
                message="Cannot execute matrix sweep: Behavioral DNA is empty or unavailable.",
                matrix_name=request.matrix_name,
                total_scenarios_evaluated=0,
                ranking_criterion=request.ranking_criterion,
                baseline_summary={},
                ranked_scenarios=[],
            )

        # 1. Cartesian Product Expansion
        grid_keys = sorted(request.interventions_grid.keys())
        grid_values = [request.interventions_grid[k] for k in grid_keys]
        combinations = list(itertools.product(*grid_values))

        if len(combinations) > 25:
            raise ValueError(
                f"Grid expansion produced {len(combinations)} scenarios, exceeding the maximum limit of 25."
            )

        # 2. Build ScenarioConfigs
        scenario_configs: List[ScenarioConfig] = []
        for idx, combo in enumerate(combinations):
            param_map = dict(zip(grid_keys, combo))
            interventions: List[ScenarioIntervention] = []

            for k, val in param_map.items():
                if "upi_success" in k or k == "upi_success_rate":
                    interventions.append(
                        ScenarioIntervention(
                            intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                            target="upi",
                            mode=InterventionMode.ABSOLUTE,
                            value=val,
                        )
                    )
                elif "card_success" in k or k == "card_success_rate":
                    interventions.append(
                        ScenarioIntervention(
                            intervention_type=InterventionType.METHOD_SUCCESS_RATE,
                            target="card",
                            mode=InterventionMode.ABSOLUTE,
                            value=val,
                        )
                    )
                elif "card_mdr" in k or k == "card_mdr_percent":
                    interventions.append(
                        ScenarioIntervention(
                            intervention_type=InterventionType.FEE_MDR_RATE,
                            target="card",
                            value=val,
                        )
                    )
                elif "max_retries" in k:
                    interventions.append(
                        ScenarioIntervention(
                            intervention_type=InterventionType.RETRY_POLICY,
                            max_retries_override=int(val),
                        )
                    )
                elif "switch_propensity" in k:
                    interventions.append(
                        ScenarioIntervention(
                            intervention_type=InterventionType.METHOD_SWITCH_POLICY,
                            switch_propensity_override=val,
                        )
                    )

            scenario_configs.append(
                ScenarioConfig(
                    scenario_id=f"grid_scen_{idx + 1}",
                    scenario_name=f"Grid #{idx + 1} ({param_map})",
                    interventions=interventions,
                    population_size=request.population_size,
                    random_seed=request.random_seed,
                )
            )

        # 3. Execute Compare
        base_cfg = SimulationConfig(
            population_size=request.population_size, random_seed=request.random_seed
        )
        compare_resp = self.compare(dna=dna, baseline_config=base_cfg, scenarios=scenario_configs)

        # 4. Rank Scenarios
        ranked_items: List[MatrixScenarioRankItem] = []
        base_kpis = compare_resp.baseline_kpis
        base_rev = base_kpis.net_merchant_revenue_inr if base_kpis else 0.0
        base_conv = base_kpis.conversion_rate_percent if base_kpis else 0.0

        for idx, cmp in enumerate(compare_resp.comparisons):
            sk = cmp.scenario_kpis
            if sk:
                param_map = dict(zip(grid_keys, combinations[idx]))
                rev_delta_pct = (
                    round(((sk.net_merchant_revenue_inr - base_rev) / base_rev) * 100.0, 2)
                    if base_rev > 0
                    else None
                )
                conv_delta_pct = (
                    round(((sk.conversion_rate_percent - base_conv) / base_conv) * 100.0, 2)
                    if base_conv > 0
                    else None
                )

                ranked_items.append(
                    MatrixScenarioRankItem(
                        rank=1,
                        scenario_id=cmp.scenario_id,
                        parameter_values=param_map,
                        conversion_rate_percent=sk.conversion_rate_percent,
                        captured_volume_inr=sk.captured_volume_inr,
                        net_merchant_revenue_inr=sk.net_merchant_revenue_inr,
                        processing_fees_inr=sk.total_processing_fees_inr,
                        revenue_delta_percent=rev_delta_pct,
                        conversion_delta_percent=conv_delta_pct,
                    )
                )

        # Sort according to ranking_criterion
        crit = request.ranking_criterion
        if crit == "conversion_rate_percent":
            ranked_items.sort(key=lambda x: x.conversion_rate_percent, reverse=True)
        elif crit == "processing_fees_inr":
            ranked_items.sort(key=lambda x: x.processing_fees_inr, reverse=False)  # Lower fees first
        else:
            ranked_items.sort(key=lambda x: x.net_merchant_revenue_inr, reverse=True)  # Higher net revenue first

        for r_idx, item in enumerate(ranked_items):
            item.rank = r_idx + 1

        baseline_summary = {
            "conversion_rate_percent": base_conv,
            "captured_volume_inr": base_kpis.captured_volume_inr if base_kpis else 0.0,
            "net_merchant_revenue_inr": base_rev,
            "total_processing_fees_inr": base_kpis.total_processing_fees_inr if base_kpis else 0.0,
        }

        return ScenarioMatrixResponse(
            status="completed",
            message=f"Successfully evaluated and ranked {len(ranked_items)} matrix scenarios.",
            matrix_name=request.matrix_name,
            total_scenarios_evaluated=len(ranked_items),
            ranking_criterion=request.ranking_criterion,
            baseline_summary=baseline_summary,
            ranked_scenarios=ranked_items,
        )

    def _generate_base_agent_population(
        self, dna: BehavioralDNAProfile, population_size: int, random_seed: int
    ) -> List[CustomerAgent]:
        """
        Generates deterministic CustomerAgent instances.
        """
        master_rng = np.random.default_rng(random_seed)
        agents: List[CustomerAgent] = []

        obs_retry = dna.empirical_transitions.overall_retry_probability_on_failure
        obs_switch = dna.empirical_transitions.method_switch_on_retry_probability
        target_retry = obs_retry if obs_retry is not None else 0.35
        target_switch = obs_switch if obs_switch is not None else 0.25

        for i in range(population_size):
            agent_seed = int(master_rng.integers(1, 2_147_483_647))
            agent_rng = np.random.default_rng(agent_seed)
            agent = self.agent_generator._create_single_agent(
                index=i,
                dna=dna,
                agent_rng=agent_rng,
                agent_seed=agent_seed,
                target_retry=target_retry,
                target_switch=target_switch,
                is_retry_calibrated=(obs_retry is not None),
                is_switch_calibrated=(obs_switch is not None),
            )
            agents.append(agent)

        return agents

    def _compute_paired_metrics(
        self, base_kpis: SimulationKPIs, scen_kpis: SimulationKPIs
    ) -> Dict[str, MetricComparison]:
        """
        Computes absolute and percentage deltas between baseline and scenario KPIs.
        """
        metrics_to_compare = [
            ("conversion_rate_percent", base_kpis.conversion_rate_percent, scen_kpis.conversion_rate_percent),
            ("failure_rate_percent", base_kpis.failure_rate_percent, scen_kpis.failure_rate_percent),
            ("abandonment_rate_percent", base_kpis.abandonment_rate_percent, scen_kpis.abandonment_rate_percent),
            ("gross_attempted_volume_inr", base_kpis.gross_attempted_volume_inr, scen_kpis.gross_attempted_volume_inr),
            ("captured_volume_inr", base_kpis.captured_volume_inr, scen_kpis.captured_volume_inr),
            ("lost_volume_inr", base_kpis.lost_volume_inr, scen_kpis.lost_volume_inr),
            ("total_payment_attempts", float(base_kpis.total_payment_attempts), float(scen_kpis.total_payment_attempts)),
            ("retry_attempts_count", float(base_kpis.retry_attempts_count), float(scen_kpis.retry_attempts_count)),
            ("method_switches_count", float(base_kpis.method_switches_count), float(scen_kpis.method_switches_count)),
            ("total_processing_fees_inr", base_kpis.total_processing_fees_inr, scen_kpis.total_processing_fees_inr),
            ("total_taxes_inr", base_kpis.total_taxes_inr, scen_kpis.total_taxes_inr),
            ("net_merchant_revenue_inr", base_kpis.net_merchant_revenue_inr, scen_kpis.net_merchant_revenue_inr),
            ("average_ticket_size_inr", base_kpis.average_ticket_size_inr, scen_kpis.average_ticket_size_inr),
            ("average_attempts_per_success", base_kpis.average_attempts_per_success, scen_kpis.average_attempts_per_success),
        ]

        result: Dict[str, MetricComparison] = {}

        for name, b_val, s_val in metrics_to_compare:
            abs_delta = round(s_val - b_val, 4)
            pct_delta = round((abs_delta / abs(b_val)) * 100.0, 2) if b_val != 0.0 else None
            result[name] = MetricComparison(
                metric_name=name,
                baseline_value=round(b_val, 4),
                scenario_value=round(s_val, 4),
                absolute_delta=abs_delta,
                percentage_delta=pct_delta,
            )

        return result

    def _compute_method_deltas(
        self, base_kpis: Dict[str, Any], scen_kpis: Dict[str, Any]
    ) -> Dict[str, Dict[str, float]]:
        """
        Computes method-level metric deltas.
        """
        all_methods = set(base_kpis.keys()).union(set(scen_kpis.keys()))
        deltas: Dict[str, Dict[str, float]] = {}

        for m in sorted(all_methods):
            b_m = base_kpis.get(m)
            s_m = scen_kpis.get(m)
            b_captured = b_m.captured_count if b_m else 0
            s_captured = s_m.captured_count if s_m else 0
            b_rate = b_m.success_rate_percent if b_m else 0.0
            s_rate = s_m.success_rate_percent if s_m else 0.0
            b_vol = b_m.captured_volume_inr if b_m else 0.0
            s_vol = s_m.captured_volume_inr if s_m else 0.0

            deltas[m] = {
                "captured_count_delta": s_captured - b_captured,
                "success_rate_percent_delta": round(s_rate - b_rate, 2),
                "captured_volume_inr_delta": round(s_vol - b_vol, 2),
            }

        return deltas

    def _generate_attribution_trail(
        self,
        interventions: List[ScenarioIntervention],
        base_kpis: SimulationKPIs,
        scen_kpis: SimulationKPIs,
        metric_comparisons: Dict[str, MetricComparison],
    ) -> List[AttributionStep]:
        """
        Builds a structured, transparent attribution chain explaining the mechanisms of observed changes.
        """
        trail: List[AttributionStep] = []
        step_idx = 1

        # Step 1: Direct Lever Applied
        inv_desc = ", ".join(
            f"{i.intervention_type.value} on {i.target or 'global'}" for i in interventions
        )
        trail.append(
            AttributionStep(
                step_order=step_idx,
                category="DIRECT_LEVER",
                description=f"Applied {len(interventions)} What-If policy intervention(s): {inv_desc}.",
                quantitative_impact={"interventions_count": len(interventions)},
            )
        )
        step_idx += 1

        # Step 2: Funnel Reaction (Retries / Attempts)
        attempts_delta = metric_comparisons["total_payment_attempts"].absolute_delta
        retries_delta = metric_comparisons["retry_attempts_count"].absolute_delta
        trail.append(
            AttributionStep(
                step_order=step_idx,
                category="FUNNEL_REACTION",
                description=(
                    f"Funnel dynamic response resulted in {attempts_delta:+.0f} total attempts "
                    f"and {retries_delta:+.0f} retry attempts."
                ),
                quantitative_impact={
                    "attempts_delta": attempts_delta,
                    "retries_delta": retries_delta,
                },
            )
        )
        step_idx += 1

        # Step 3: Conversion Impact
        conv_delta = metric_comparisons["conversion_rate_percent"].absolute_delta
        orders_delta = scen_kpis.successful_transactions - base_kpis.successful_transactions
        trail.append(
            AttributionStep(
                step_order=step_idx,
                category="CONVERSION_IMPACT",
                description=(
                    f"Overall conversion rate shifted by {conv_delta:+.2f} percentage points, "
                    f"capturing {orders_delta:+d} additional orders."
                ),
                quantitative_impact={
                    "conversion_rate_delta_points": conv_delta,
                    "orders_captured_delta": orders_delta,
                },
            )
        )
        step_idx += 1

        # Step 4: Financial Bottom Line
        vol_delta = metric_comparisons["captured_volume_inr"].absolute_delta
        fees_delta = metric_comparisons["total_processing_fees_inr"].absolute_delta
        net_rev_delta = metric_comparisons["net_merchant_revenue_inr"].absolute_delta
        pct_rev_delta = metric_comparisons["net_merchant_revenue_inr"].percentage_delta

        trail.append(
            AttributionStep(
                step_order=step_idx,
                category="FINANCIAL_BOTTOM_LINE",
                description=(
                    f"Net merchant revenue changed by ₹{net_rev_delta:+,.2f} ({pct_rev_delta:+.2f}%) "
                    f"from ₹{vol_delta:+,.2f} captured volume delta and ₹{fees_delta:+,.2f} processing fee delta."
                ),
                quantitative_impact={
                    "captured_volume_delta_inr": vol_delta,
                    "processing_fees_delta_inr": fees_delta,
                    "net_merchant_revenue_delta_inr": net_rev_delta,
                    "net_revenue_percentage_change": pct_rev_delta,
                },
            )
        )

        return trail
