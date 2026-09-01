"""
Simulation Runner Service.
Orchestrates single-run executions, aggregation layers, and Monte Carlo uncertainty sweeps.
"""

from datetime import datetime, timezone
import math
import time
from typing import Any, Dict, List, Optional
import numpy as np

from app.core.logging import logger
from app.models.agent import CustomerAgent
from app.models.dna import BehavioralDNAProfile
from app.models.simulation import (
    AgentSimulationResult,
    MethodSimulationKPI,
    MonteCarloMetricDistribution,
    MonteCarloSimulationResult,
    SimulationConfig,
    SimulationKPIs,
    SimulationResult,
    VirtualPaymentEnvironment,
)
from app.services.agent_generator import AgentPopulationGenerator
from app.services.payment_twin import PaymentTwinEngine


class SimulationRunner:
    """
    High-level coordinator for the Payment Twin simulation pipeline.
    """

    def __init__(
        self,
        agent_generator: Optional[AgentPopulationGenerator] = None,
        twin_engine: Optional[PaymentTwinEngine] = None,
    ) -> None:
        self.agent_generator = agent_generator or AgentPopulationGenerator()
        self.twin_engine = twin_engine or PaymentTwinEngine()

    def run_once(
        self,
        dna: BehavioralDNAProfile,
        config: SimulationConfig,
    ) -> SimulationResult:
        """
        Executes a single end-to-end Payment Twin simulation run.
        """
        start_time = time.perf_counter()

        # 1. Check for Empty / Unavailable DNA
        if (
            dna.status == "empty"
            or dna.reliability.confidence_grade == "UNAVAILABLE"
            or dna.provenance.data_source_type == "NO_DATA_AVAILABLE"
            or dna.provenance.total_sample_size == 0
        ):
            logger.info("Simulation execution refused: Behavioral DNA is empty or unavailable.")
            return SimulationResult(
                status="unavailable",
                message=(
                    "Cannot execute Payment Twin simulation: Behavioral DNA is empty or unavailable. "
                    "Simulation requires observed Razorpay payment data or an explicitly supplied "
                    "SYNTHETIC_BENCHMARK_DATA profile."
                ),
                simulation_id=config.simulation_id or f"sim_empty_seed{config.random_seed}",
                population_size=0,
                random_seed=config.random_seed,
                dna_provenance_type=dna.provenance.data_source_type,
                is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
                kpis=None,
                method_breakdown={},
                funnel_dropoffs={},
                preview_agent_traces=[],
            )

        sim_id = config.simulation_id or f"sim_{dna.dna_version}_seed{config.random_seed}_{config.population_size}"

        # 2. Build Virtual Payment Environment from DNA
        environment = VirtualPaymentEnvironment.from_dna(
            dna=dna, latency_config=config.latency_assumptions
        )

        # 3. Generate Synthetic Customer Agent Population
        pop_response = self.agent_generator.generate_population(
            dna=dna,
            population_size=config.population_size,
            random_seed=config.random_seed,
            preview_count=config.preview_agent_count,
        )

        if pop_response.status != "ok":
            return SimulationResult(
                status="unavailable",
                message=pop_response.message,
                simulation_id=sim_id,
                population_size=0,
                random_seed=config.random_seed,
                dna_provenance_type=dna.provenance.data_source_type,
                is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
            )

        # 4. Generate the full agent population objects internally
        # We re-generate the full agent list using the generator's internal method for complete processing
        master_rng = np.random.default_rng(config.random_seed)
        all_agents: List[CustomerAgent] = []

        obs_retry_rate = dna.empirical_transitions.overall_retry_probability_on_failure
        obs_switch_rate = dna.empirical_transitions.method_switch_on_retry_probability
        target_retry = obs_retry_rate if obs_retry_rate is not None else 0.35
        target_switch = obs_switch_rate if obs_switch_rate is not None else 0.25

        for i in range(config.population_size):
            agent_seed = int(master_rng.integers(1, 2_147_483_647))
            agent_rng = np.random.default_rng(agent_seed)
            agent = self.agent_generator._create_single_agent(
                index=i,
                dna=dna,
                agent_rng=agent_rng,
                agent_seed=agent_seed,
                target_retry=target_retry,
                target_switch=target_switch,
                is_retry_calibrated=(obs_retry_rate is not None),
                is_switch_calibrated=(obs_switch_rate is not None),
            )
            all_agents.append(agent)

        # 5. Execute Agents through Payment Twin Funnel
        preview_traces: List[AgentSimulationResult] = []
        agent_outcomes: List[AgentSimulationResult] = []

        for idx, agent in enumerate(all_agents):
            should_record_events = config.enable_event_traces and (idx < config.preview_agent_count)
            res = self.twin_engine.simulate_agent(
                agent=agent,
                environment=environment,
                simulation_id=sim_id,
                record_events=should_record_events,
                max_retries_override=config.max_retries_override,
                timeout_seconds_override=config.timeout_seconds_override,
            )
            agent_outcomes.append(res)
            if idx < config.preview_agent_count:
                preview_traces.append(res)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        # 6. Aggregate KPIs and Breakdown
        kpis, method_kpis, dropoffs = self._aggregate_simulation_kpis(
            agent_outcomes=agent_outcomes, elapsed_ms=elapsed_ms
        )

        return SimulationResult(
            status="completed",
            message=f"Successfully simulated {config.population_size} customer agents through Payment Twin.",
            simulation_id=sim_id,
            population_size=config.population_size,
            random_seed=config.random_seed,
            dna_provenance_type=dna.provenance.data_source_type,
            is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
            kpis=kpis,
            method_breakdown=method_kpis,
            funnel_dropoffs=dropoffs,
            preview_agent_traces=preview_traces,
        )

    def _aggregate_simulation_kpis(
        self, agent_outcomes: List[AgentSimulationResult], elapsed_ms: float
    ) -> Tuple[SimulationKPIs, Dict[str, MethodSimulationKPI], Dict[str, int]]:
        """
        Computes financial and conversion metrics while strictly preserving GMV accounting invariants.
        """
        n_total = len(agent_outcomes)

        n_success = sum(1 for a in agent_outcomes if a.is_successful)
        n_failed = sum(1 for a in agent_outcomes if not a.is_successful and not a.is_abandoned)
        n_abandoned = sum(1 for a in agent_outcomes if a.is_abandoned)

        total_attempts = sum(a.total_attempts for a in agent_outcomes)
        retries_count = sum(max(0, a.total_attempts - 1) for a in agent_outcomes)
        method_switches_count = sum(1 for a in agent_outcomes if a.method_switched)

        conversion_rate = round((n_success / n_total) * 100.0, 2) if n_total > 0 else 0.0
        failure_rate = round((n_failed / n_total) * 100.0, 2) if n_total > 0 else 0.0
        abandon_rate = round((n_abandoned / n_total) * 100.0, 2) if n_total > 0 else 0.0

        # Strict GMV Accounting (Unique order amount counted once!)
        gross_gmv = round(sum(a.amount_inr for a in agent_outcomes), 2)
        captured_vol = round(sum(a.amount_inr for a in agent_outcomes if a.is_successful), 2)
        lost_vol = round(gross_gmv - captured_vol, 2)

        total_fees = round(sum(a.fee_inr for a in agent_outcomes if a.is_successful), 2)
        total_taxes = round(sum(a.tax_inr for a in agent_outcomes if a.is_successful), 2)
        net_revenue = round(captured_vol - total_fees - total_taxes, 2)

        avg_aov = round(gross_gmv / n_total, 2) if n_total > 0 else 0.0
        success_attempts_sum = sum(a.total_attempts for a in agent_outcomes if a.is_successful)
        avg_attempts_per_success = round(success_attempts_sum / n_success, 2) if n_success > 0 else 1.0

        # Method KPI Breakdown
        method_agg: Dict[str, Dict[str, Any]] = {}
        for a in agent_outcomes:
            m = a.final_method
            m_entry = method_agg.setdefault(
                m,
                {"attempted_count": 0, "captured_count": 0, "failed_count": 0, "attempted_vol": 0.0, "captured_vol": 0.0, "fees": 0.0},
            )
            m_entry["attempted_count"] += a.total_attempts
            m_entry["attempted_vol"] += a.amount_inr
            if a.is_successful:
                m_entry["captured_count"] += 1
                m_entry["captured_vol"] += a.amount_inr
                m_entry["fees"] += a.fee_inr
            else:
                m_entry["failed_count"] += 1

        method_kpis: Dict[str, MethodSimulationKPI] = {}
        for m, stats in sorted(method_agg.items()):
            succ_pct = (
                round((stats["captured_count"] / (stats["captured_count"] + stats["failed_count"])) * 100.0, 2)
                if (stats["captured_count"] + stats["failed_count"]) > 0
                else 0.0
            )
            method_kpis[m] = MethodSimulationKPI(
                attempted_count=stats["attempted_count"],
                captured_count=stats["captured_count"],
                failed_count=stats["failed_count"],
                success_rate_percent=succ_pct,
                attempted_volume_inr=round(stats["attempted_vol"], 2),
                captured_volume_inr=round(stats["captured_vol"], 2),
                processing_fees_inr=round(stats["fees"], 2),
            )

        # Funnel Dropoffs Breakdown
        dropoffs: Dict[str, int] = {}
        for a in agent_outcomes:
            if not a.is_successful:
                r = a.terminal_reason or "UNKNOWN_DROP"
                dropoffs[r] = dropoffs.get(r, 0) + 1

        kpis = SimulationKPIs(
            total_agents=n_total,
            successful_transactions=n_success,
            failed_transactions=n_failed,
            abandoned_transactions=n_abandoned,
            total_payment_attempts=total_attempts,
            retry_attempts_count=retries_count,
            method_switches_count=method_switches_count,
            conversion_rate_percent=conversion_rate,
            failure_rate_percent=failure_rate,
            abandonment_rate_percent=abandon_rate,
            gross_attempted_volume_inr=gross_gmv,
            captured_volume_inr=captured_vol,
            lost_volume_inr=lost_vol,
            total_processing_fees_inr=total_fees,
            total_taxes_inr=total_taxes,
            net_merchant_revenue_inr=net_revenue,
            average_ticket_size_inr=avg_aov,
            average_attempts_per_success=avg_attempts_per_success,
            execution_duration_ms=elapsed_ms,
        )

        return kpis, method_kpis, dropoffs

    def run_many(
        self,
        dna: BehavioralDNAProfile,
        config: SimulationConfig,
        monte_carlo_runs: int = 20,
    ) -> MonteCarloSimulationResult:
        """
        Executes multiple independent seeded simulation runs and computes summary distributions.
        """
        start_time = time.perf_counter()

        # Check empty DNA
        if (
            dna.status == "empty"
            or dna.reliability.confidence_grade == "UNAVAILABLE"
            or dna.provenance.data_source_type == "NO_DATA_AVAILABLE"
            or dna.provenance.total_sample_size == 0
        ):
            return MonteCarloSimulationResult(
                status="unavailable",
                message="Cannot execute Monte Carlo simulation: Behavioral DNA is empty or unavailable.",
                simulation_id=f"mc_empty_seed{config.random_seed}",
                total_runs=0,
                population_per_run=config.population_size,
                master_random_seed=config.random_seed,
                dna_provenance_type=dna.provenance.data_source_type,
                is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
                summary_metrics={},
            )

        mc_sim_id = f"sim_mc_{dna.dna_version}_seed{config.random_seed}_runs{monte_carlo_runs}"

        # Metric accumulators
        conv_rates: List[float] = []
        captured_vols: List[float] = []
        net_revenues: List[float] = []
        retry_rates: List[float] = []
        abandon_rates: List[float] = []

        master_seed = config.random_seed

        for run_idx in range(monte_carlo_runs):
            run_seed = master_seed + run_idx * 10007
            run_cfg = config.model_copy(
                update={
                    "random_seed": run_seed,
                    "enable_event_traces": False,  # Disable event logging in MC loops for performance
                    "preview_agent_count": 0,
                }
            )
            res = self.run_once(dna=dna, config=run_cfg)
            if res.status == "completed" and res.kpis:
                conv_rates.append(res.kpis.conversion_rate_percent)
                captured_vols.append(res.kpis.captured_volume_inr)
                net_revenues.append(res.kpis.net_merchant_revenue_inr)
                r_rate = (res.kpis.retry_attempts_count / res.kpis.total_payment_attempts) * 100.0
                retry_rates.append(round(r_rate, 2))
                abandon_rates.append(res.kpis.abandonment_rate_percent)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        def compute_dist(values: List[float]) -> MonteCarloMetricDistribution:
            arr = np.array(values, dtype=float)
            m = float(np.mean(arr))
            s = float(np.std(arr, ddof=1)) if len(arr) > 1 else 0.0
            sem = s / math.sqrt(len(arr)) if len(arr) > 0 else 0.0
            ci = [round(m - 1.96 * sem, 2), round(m + 1.96 * sem, 2)]
            p5 = float(np.percentile(arr, 5))
            p50 = float(np.percentile(arr, 50))
            p95 = float(np.percentile(arr, 95))
            return MonteCarloMetricDistribution(
                mean=round(m, 2),
                std_dev=round(s, 2),
                ci_95=ci,
                p5=round(p5, 2),
                p50=round(p50, 2),
                p95=round(p95, 2),
            )

        summary_metrics = {
            "conversion_rate_percent": compute_dist(conv_rates),
            "captured_volume_inr": compute_dist(captured_vols),
            "net_merchant_revenue_inr": compute_dist(net_revenues),
            "retry_rate_percent": compute_dist(retry_rates),
            "abandonment_rate_percent": compute_dist(abandon_rates),
        }

        return MonteCarloSimulationResult(
            status="completed",
            message=f"Successfully executed {monte_carlo_runs} Monte Carlo simulation runs.",
            simulation_id=mc_sim_id,
            total_runs=monte_carlo_runs,
            population_per_run=config.population_size,
            master_random_seed=master_seed,
            dna_provenance_type=dna.provenance.data_source_type,
            is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
            summary_metrics=summary_metrics,
            execution_duration_ms=elapsed_ms,
        )
