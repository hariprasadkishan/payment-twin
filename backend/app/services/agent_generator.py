"""
Agent Population Generator Service.
Generates stateful Synthetic Customer Agents statistically calibrated to empirical Behavioral DNA.
"""

from datetime import datetime, timezone
import hashlib
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from scipy import stats

from app.core.logging import logger
from app.models.agent import (
    AgentArchetype,
    AgentGenerationResponse,
    CalibrationDiagnostics,
    CustomerAgent,
    FunnelState,
    LatentParameters,
    ObservedPreferences,
    PopulationMetadata,
    RuntimeState,
)
from app.models.dna import BehavioralDNAProfile


class AgentPopulationGenerator:
    """
    Service responsible for constructing calibrated customer agent populations from Behavioral DNA.
    """

    def generate_population(
        self,
        dna: BehavioralDNAProfile,
        population_size: int = 1000,
        random_seed: int = 42,
        preview_count: int = 10,
    ) -> AgentGenerationResponse:
        """
        Generates a population of synthetic customer agents calibrated to the supplied Behavioral DNA.
        """
        # 1. Validate Population Size
        if population_size < 1 or population_size > 10000:
            raise ValueError(f"population_size must be between 1 and 10000, got {population_size}")

        now_iso = datetime.now(timezone.utc).isoformat()

        # 2. Check for Empty / Unavailable DNA
        if (
            dna.status == "empty"
            or dna.reliability.confidence_grade == "UNAVAILABLE"
            or dna.provenance.data_source_type == "NO_DATA_AVAILABLE"
            or dna.provenance.total_sample_size == 0
        ):
            logger.info("Agent generation requested on empty Behavioral DNA; returning unavailable status.")
            return AgentGenerationResponse(
                status="unavailable",
                message=(
                    "Cannot generate Customer Agents: Behavioral DNA is empty or unavailable. "
                    "Agent generation requires observed Razorpay payment data or an explicitly supplied "
                    "SYNTHETIC_BENCHMARK_DATA profile."
                ),
                population_metadata=None,
                calibration_diagnostics=None,
                total_generated_count=0,
                preview_agents=[],
            )

        # 3. Initialize Isolated Random Generator
        master_rng = np.random.default_rng(random_seed)

        # 4. Generate Population Agents
        agents: List[CustomerAgent] = []
        archetype_counts: Dict[str, int] = {arch.value: 0 for arch in AgentArchetype}

        # Check if empirical retry/switch data exists in DNA
        obs_retry_rate = dna.empirical_transitions.overall_retry_probability_on_failure
        obs_switch_rate = dna.empirical_transitions.method_switch_on_retry_probability
        is_retry_calibrated = obs_retry_rate is not None
        is_switch_calibrated = obs_switch_rate is not None

        target_retry = obs_retry_rate if is_retry_calibrated else 0.35
        target_switch = obs_switch_rate if is_switch_calibrated else 0.25

        warnings: List[str] = []
        if not is_retry_calibrated:
            warnings.append("Empirical retry probability was unobserved in DNA; using explicit MODELLED_ASSUMPTION baseline (0.35).")
        if not is_switch_calibrated:
            warnings.append("Empirical method-switching probability was unobserved in DNA; using explicit MODELLED_ASSUMPTION baseline (0.25).")
        if not dna.reliability.sample_size_adequate:
            warnings.append(f"Source DNA has limited sample size (Grade: {dna.reliability.confidence_grade}); population reflects preliminary priors.")

        for i in range(population_size):
            # Deterministic isolated sub-seed for agent
            agent_seed = int(master_rng.integers(1, 2_147_483_647))
            agent_rng = np.random.default_rng(agent_seed)

            # Generate Agent Attributes
            agent = self._create_single_agent(
                index=i,
                dna=dna,
                agent_rng=agent_rng,
                agent_seed=agent_seed,
                target_retry=target_retry,
                target_switch=target_switch,
                is_retry_calibrated=is_retry_calibrated,
                is_switch_calibrated=is_switch_calibrated,
            )
            agents.append(agent)
            archetype_counts[agent.archetype.value] += 1

        # 5. Compute Calibration Diagnostics
        diagnostics = self._compute_calibration_diagnostics(
            agents=agents,
            dna=dna,
            archetype_counts=archetype_counts,
            target_retry=target_retry,
            target_switch=target_switch,
            warnings=warnings,
        )

        # 6. Build Population Metadata
        pop_id = f"pop_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_seed{random_seed}_{population_size}"
        metadata = PopulationMetadata(
            population_id=pop_id,
            population_size=population_size,
            random_seed=random_seed,
            source_dna_version=dna.dna_version,
            dna_provenance_type=dna.provenance.data_source_type,
            is_synthetic_benchmark=dna.provenance.is_synthetic_benchmark,
            generated_at_iso=now_iso,
        )

        # 7. Safe Preview Slicing
        preview_slice = agents[: min(preview_count, len(agents))]

        return AgentGenerationResponse(
            status="ok",
            message=f"Successfully generated {population_size} customer agents calibrated to Behavioral DNA.",
            population_metadata=metadata,
            calibration_diagnostics=diagnostics,
            total_generated_count=population_size,
            preview_agents=preview_slice,
        )

    def _create_single_agent(
        self,
        index: int,
        dna: BehavioralDNAProfile,
        agent_rng: np.random.Generator,
        agent_seed: int,
        target_retry: float,
        target_switch: float,
        is_retry_calibrated: bool,
        is_switch_calibrated: bool,
    ) -> CustomerAgent:
        """
        Synthesizes a single deterministic CustomerAgent instance.
        """
        # 1. Sample Transaction Amount
        amount = self._sample_transaction_amount(dna, agent_rng)

        # 2. Determine Amount Tier
        if amount < 500.0:
            amount_tier = "tier_low_under_500"
        elif amount <= 2500.0:
            amount_tier = "tier_mid_500_to_2500"
        else:
            amount_tier = "tier_high_above_2500"

        # 3. Sample Primary Method (conditioned on tier)
        primary_method = self._sample_primary_method(dna, amount_tier, agent_rng)

        # 4. Sample Secondary Method
        secondary_method = self._sample_secondary_method(dna, primary_method, agent_rng)

        # 5. Sample Sub-instrument (VPA provider or issuing bank)
        sub_instrument = self._sample_sub_instrument(dna, primary_method, agent_rng)

        # 6. Assign Archetype
        archetype = self._assign_archetype(primary_method, amount_tier, agent_rng)

        # 7. Sample Latent Behavioral Parameters
        latent_params = self._sample_latent_parameters(
            archetype=archetype,
            agent_rng=agent_rng,
            target_retry=target_retry,
            target_switch=target_switch,
            is_retry_calibrated=is_retry_calibrated,
            is_switch_calibrated=is_switch_calibrated,
        )

        # 8. Construct CustomerAgent
        agent_id = f"agent_{index + 1:04d}_{hashlib.md5(f'{agent_seed}_{index}'.encode()).hexdigest()[:6]}"
        observed_prefs = ObservedPreferences(
            primary_method=primary_method,
            secondary_method=secondary_method,
            sub_instrument=sub_instrument,
            transaction_amount_inr=amount,
            amount_tier=amount_tier,
        )

        return CustomerAgent(
            agent_id=agent_id,
            archetype=archetype,
            random_seed=agent_seed,
            current_state=FunnelState.BROWSING,
            observed_preferences=observed_prefs,
            latent_parameters=latent_params,
            runtime_state=RuntimeState(),
            event_history=[],
        )

    def _sample_transaction_amount(
        self, dna: BehavioralDNAProfile, rng: np.random.Generator
    ) -> float:
        """
        Samples a positive transaction amount from DNA parametric fit or empirical quantiles.
        """
        ad = dna.amount_distribution

        # 1. Try Parametric Log-Normal Fit
        if ad.parametric_fit and ad.parametric_fit.is_adequate_fit:
            scale = ad.parametric_fit.parameters.get("scale_median", 1000.0)
            sigma = ad.parametric_fit.parameters.get("shape_sigma", 0.8)
            raw_sample = float(scale * np.exp(sigma * rng.standard_normal()))
            return round(max(1.0, raw_sample), 2)

        # 2. Fall back to Empirical Quantiles
        quantiles = ad.quantiles
        if quantiles and len(quantiles) >= 4:
            # Piecewise quantile interpolation from U ~ Uniform(0, 1)
            u = float(rng.uniform(0.01, 0.99))
            p_keys = [10, 25, 50, 75, 90, 95, 99]
            known_pcts = [p for p in p_keys if f"p{p}" in quantiles]
            known_vals = [quantiles[f"p{p}"] for p in known_pcts]

            if len(known_pcts) >= 2:
                sampled_val = float(np.interp(u * 100.0, known_pcts, known_vals))
                # Add small continuous noise within inter-quantile band
                jitter = float(rng.uniform(-0.02, 0.02)) * sampled_val
                return round(max(1.0, sampled_val + jitter), 2)

        # 3. Fallback to Summary Mean / Median if available
        if ad.summary:
            base = ad.summary.median or ad.summary.mean or 1000.0
            jitter = float(rng.uniform(0.8, 1.2))
            return round(max(1.0, base * jitter), 2)

        return 1000.0

    def _sample_primary_method(
        self, dna: BehavioralDNAProfile, tier: str, rng: np.random.Generator
    ) -> str:
        """
        Samples the primary payment method conditioned on the transaction amount tier.
        """
        tier_priors = dna.method_priors.amount_conditioned_priors.get(tier, {})
        if tier_priors and sum(tier_priors.values()) > 0:
            methods = sorted(tier_priors.keys())
            probs = [tier_priors[m] for m in methods]
            prob_sum = sum(probs)
            normalized_probs = [p / prob_sum for p in probs]
            return str(rng.choice(methods, p=normalized_probs))

        # Fallback to marginal method priors
        marginal_priors = dna.method_priors.probabilities
        if marginal_priors and sum(marginal_priors.values()) > 0:
            methods = sorted(marginal_priors.keys())
            probs = [marginal_priors[m] for m in methods]
            prob_sum = sum(probs)
            normalized_probs = [p / prob_sum for p in probs]
            return str(rng.choice(methods, p=normalized_probs))

        return "upi"

    def _sample_secondary_method(
        self, dna: BehavioralDNAProfile, primary_method: str, rng: np.random.Generator
    ) -> Optional[str]:
        """
        Samples an alternative secondary payment method from available methods excluding primary.
        """
        marginal_priors = dna.method_priors.probabilities
        available = {m: p for m, p in marginal_priors.items() if m != primary_method and p > 0}

        if not available:
            return None

        methods = sorted(available.keys())
        probs = [available[m] for m in methods]
        prob_sum = sum(probs)
        normalized_probs = [p / prob_sum for p in probs]
        return str(rng.choice(methods, p=normalized_probs))

    def _sample_sub_instrument(
        self, dna: BehavioralDNAProfile, primary_method: str, rng: np.random.Generator
    ) -> Optional[str]:
        """
        Samples VPA handle provider for UPI or issuing bank for Card/Netbanking.
        """
        sub_priors = dna.method_priors.sub_instrument_priors
        if primary_method == "upi" and "upi_providers" in sub_priors:
            providers_map = sub_priors["upi_providers"]
            if providers_map:
                items = sorted(providers_map.keys())
                probs = [providers_map[k] for k in items]
                norm_probs = [p / sum(probs) for p in probs]
                return str(rng.choice(items, p=norm_probs))

        if primary_method in ("card", "netbanking") and "banks" in sub_priors:
            banks_map = sub_priors["banks"]
            if banks_map:
                items = sorted(banks_map.keys())
                probs = [banks_map[k] for k in items]
                norm_probs = [p / sum(probs) for p in probs]
                return str(rng.choice(items, p=norm_probs))

        return None

    def _assign_archetype(
        self, primary_method: str, amount_tier: str, rng: np.random.Generator
    ) -> AgentArchetype:
        """
        Assigns an archetype using a flexible conditional mixture model.
        """
        # Base mixture weights: FAST_CHECKOUT (40%), PATIENT_RETRYER (30%), METHOD_SWITCHER (20%), HIGH_TICKET (10%)
        weights = [0.40, 0.30, 0.20, 0.10]
        archetypes = [
            AgentArchetype.FAST_CHECKOUT,
            AgentArchetype.PATIENT_RETRYER,
            AgentArchetype.METHOD_SWITCHER,
            AgentArchetype.HIGH_TICKET,
        ]

        # Context-aware modulation
        if primary_method == "upi" and amount_tier == "tier_low_under_500":
            weights = [0.60, 0.20, 0.15, 0.05]
        elif amount_tier == "tier_high_above_2500":
            weights = [0.10, 0.30, 0.20, 0.40]
        norm_w = [w / sum(weights) for w in weights]
        idx = int(rng.choice(len(archetypes), p=norm_w))
        return archetypes[idx]

    def _sample_latent_parameters(
        self,
        archetype: AgentArchetype,
        agent_rng: np.random.Generator,
        target_retry: float,
        target_switch: float,
        is_retry_calibrated: bool,
        is_switch_calibrated: bool,
    ) -> LatentParameters:
        """
        Samples bounded latent parameters according to the assigned archetype and calibration targets.
        """
        if archetype == AgentArchetype.FAST_CHECKOUT:
            max_retries = 1
            retry_p = float(np.clip(target_retry * 0.8 + agent_rng.uniform(-0.06, 0.06), 0.05, 0.95))
            switch_p = float(np.clip(target_switch * 0.7 + agent_rng.uniform(-0.05, 0.05), 0.05, 0.95))
            friction = float(np.clip(0.75 + agent_rng.uniform(-0.10, 0.10), 0.10, 0.99))
            patience = float(np.clip(25.0 + agent_rng.uniform(-6.0, 6.0), 10.0, 60.0))

        elif archetype == AgentArchetype.PATIENT_RETRYER:
            max_retries = int(agent_rng.choice([2, 3], p=[0.4, 0.6]))
            retry_p = float(np.clip(target_retry * 1.3 + agent_rng.uniform(-0.05, 0.05), 0.05, 0.98))
            switch_p = float(np.clip(target_switch * 0.6 + agent_rng.uniform(-0.05, 0.05), 0.05, 0.95))
            friction = float(np.clip(0.20 + agent_rng.uniform(-0.05, 0.05), 0.05, 0.80))
            patience = float(np.clip(70.0 + agent_rng.uniform(-12.0, 12.0), 30.0, 180.0))

        elif archetype == AgentArchetype.METHOD_SWITCHER:
            max_retries = 2
            retry_p = float(np.clip(target_retry * 1.1 + agent_rng.uniform(-0.05, 0.05), 0.05, 0.95))
            # Method switchers have significantly higher switch propensity
            switch_p = float(np.clip(max(0.65, target_switch * 1.6) + agent_rng.uniform(-0.05, 0.05), 0.10, 0.99))
            friction = float(np.clip(0.40 + agent_rng.uniform(-0.08, 0.08), 0.10, 0.90))
            patience = float(np.clip(45.0 + agent_rng.uniform(-8.0, 8.0), 20.0, 120.0))

        else:  # HIGH_TICKET
            max_retries = 2
            retry_p = float(np.clip(target_retry * 1.0 + agent_rng.uniform(-0.05, 0.05), 0.05, 0.95))
            switch_p = float(np.clip(target_switch * 0.9 + agent_rng.uniform(-0.05, 0.05), 0.05, 0.95))
            friction = float(np.clip(0.30 + agent_rng.uniform(-0.06, 0.06), 0.05, 0.85))
            patience = float(np.clip(90.0 + agent_rng.uniform(-15.0, 15.0), 40.0, 240.0))

        return LatentParameters(
            max_retries=max_retries,
            retry_propensity=round(retry_p, 4),
            method_switch_propensity=round(switch_p, 4),
            friction_sensitivity=round(friction, 4),
            patience_timeout_seconds=round(patience, 1),
            is_retry_calibrated=is_retry_calibrated,
            is_method_switch_calibrated=is_switch_calibrated,
        )

    def _compute_calibration_diagnostics(
        self,
        agents: List[CustomerAgent],
        dna: BehavioralDNAProfile,
        archetype_counts: Dict[str, int],
        target_retry: float,
        target_switch: float,
        warnings: List[str],
    ) -> CalibrationDiagnostics:
        """
        Calculates calibration error metrics comparing the generated population against Behavioral DNA.
        """
        n = len(agents)
        if n == 0:
            return CalibrationDiagnostics(is_calibrated=False, warnings=warnings)

        # 1. Method Distribution MAE
        method_counts: Dict[str, int] = {}
        for a in agents:
            m = a.observed_preferences.primary_method
            method_counts[m] = method_counts.get(m, 0) + 1

        dna_methods = dna.method_priors.probabilities
        all_methods = set(method_counts.keys()).union(set(dna_methods.keys()))

        mae_sum = 0.0
        for m in all_methods:
            pop_share = method_counts.get(m, 0) / n
            dna_share = dna_methods.get(m, 0.0)
            mae_sum += abs(pop_share - dna_share)

        method_mae = round(mae_sum / len(all_methods), 4) if all_methods else 0.0

        # 2. Amount Mean Absolute Error
        pop_amounts = [a.observed_preferences.transaction_amount_inr for a in agents]
        pop_mean_amount = float(np.mean(pop_amounts))
        dna_mean_amount = dna.amount_distribution.summary.mean if dna.amount_distribution.summary else pop_mean_amount
        amount_error = round(abs(pop_mean_amount - dna_mean_amount), 2)

        # 3. Retry and Switch Drift
        mean_pop_retry = float(np.mean([a.latent_parameters.retry_propensity for a in agents]))
        mean_pop_switch = float(np.mean([a.latent_parameters.method_switch_propensity for a in agents]))

        retry_drift = round(abs(mean_pop_retry - target_retry), 4)
        switch_drift = round(abs(mean_pop_switch - target_switch), 4)

        # Calibration Acceptance Check
        # For N >= 500, we expect method MAE <= 0.03
        is_calibrated = True
        if n >= 500 and method_mae > 0.05:
            is_calibrated = False
            warnings.append(f"Method MAE ({method_mae:.4f}) exceeded tolerance (0.05).")

        return CalibrationDiagnostics(
            method_distribution_mae=method_mae,
            amount_mean_error_inr=amount_error,
            retry_rate_drift=retry_drift,
            method_switch_drift=switch_drift,
            archetype_distribution=archetype_counts,
            is_calibrated=is_calibrated,
            warnings=warnings,
        )
