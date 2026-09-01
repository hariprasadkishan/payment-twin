"""
Payment Twin Simulation Engine.
Executes individual Customer Agents through a stochastic virtual payment funnel.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from app.models.agent import AgentArchetype, CustomerAgent, FunnelState
from app.models.simulation import (
    AgentSimulationResult,
    SimulationEvent,
    VirtualPaymentEnvironment,
)


class PaymentTwinEngine:
    """
    Core discrete-event simulation engine for executing synthetic customer agents
    through a virtual payment checkout environment.
    """

    def simulate_agent(
        self,
        agent: CustomerAgent,
        environment: VirtualPaymentEnvironment,
        simulation_id: str,
        record_events: bool = True,
        max_retries_override: Optional[int] = None,
        timeout_seconds_override: Optional[float] = None,
    ) -> AgentSimulationResult:
        """
        Executes a single CustomerAgent through the complete virtual checkout and payment funnel.
        """
        # 1. State & PRNG Initialization
        agent_seed = agent.random_seed
        agent_rng = np.random.default_rng(agent_seed)

        current_time_ms = 0
        event_counter = 0
        attempt = 1

        active_method = agent.observed_preferences.primary_method
        sub_instrument = agent.observed_preferences.sub_instrument
        order_amount = agent.observed_preferences.transaction_amount_inr  # Preserved across retries!

        max_retries = (
            max_retries_override
            if max_retries_override is not None
            else agent.latent_parameters.max_retries
        )
        patience_timeout_sec = (
            timeout_seconds_override
            if timeout_seconds_override is not None
            else agent.latent_parameters.patience_timeout_seconds
        )
        patience_timeout_ms = int(patience_timeout_sec * 1000)

        method_switched = False
        event_trace: List[SimulationEvent] = []

        def emit_event(
            from_s: FunnelState,
            to_s: FunnelState,
            action: str,
            details: Optional[Dict[str, Any]] = None,
        ) -> None:
            nonlocal current_time_ms, event_counter
            event_counter += 1
            evt_id = f"evt_{simulation_id}_{agent.agent_id}_{event_counter}"

            # Validate and apply state transition on agent
            agent.transition_to(to_s, action, details)

            if record_events:
                event_trace.append(
                    SimulationEvent(
                        event_id=evt_id,
                        simulation_id=simulation_id,
                        agent_id=agent.agent_id,
                        timestamp_ms=current_time_ms,
                        state_from=from_s,
                        state_to=to_s,
                        action=action,
                        method=active_method,
                        amount_inr=order_amount,
                        attempt_number=attempt,
                        details=details or {},
                    )
                )

        # 2. Stage: BROWSING
        emit_event(FunnelState.BROWSING, FunnelState.BROWSING, "SESSION_START")

        browsing_delay_ms = int(agent_rng.uniform(200, 800))
        current_time_ms += browsing_delay_ms

        # Pre-checkout dropout check (friction sensitivity based)
        pre_checkout_drop_p = agent.latent_parameters.friction_sensitivity * 0.03
        if agent_rng.random() < pre_checkout_drop_p:
            emit_event(
                FunnelState.BROWSING,
                FunnelState.ABANDONED,
                "PRE_CHECKOUT_DROP",
                {"reason": "FRICTION_DROPOUT"},
            )
            emit_event(
                FunnelState.ABANDONED,
                FunnelState.TERMINATED_ABANDONED,
                "SESSION_CLOSED",
                {"terminal_reason": "PRE_CHECKOUT_DROP"},
            )
            return AgentSimulationResult(
                agent_id=agent.agent_id,
                archetype=agent.archetype,
                is_successful=False,
                is_abandoned=True,
                final_state=FunnelState.TERMINATED_ABANDONED,
                total_attempts=0,
                final_method=active_method,
                method_switched=False,
                amount_inr=order_amount,
                fee_inr=0.0,
                tax_inr=0.0,
                terminal_reason="PRE_CHECKOUT_DROP",
                total_duration_ms=current_time_ms,
                event_trace=event_trace,
            )

        # 3. Stage: CHECKOUT_OPENED
        emit_event(FunnelState.BROWSING, FunnelState.CHECKOUT_OPENED, "OPEN_CHECKOUT")

        method_selection_delay_ms = int(agent_rng.uniform(300, 900))
        current_time_ms += method_selection_delay_ms

        # 4. Stage: METHOD_SELECTED
        emit_event(
            FunnelState.CHECKOUT_OPENED,
            FunnelState.METHOD_SELECTED,
            "SELECT_METHOD",
            {"method": active_method, "sub_instrument": sub_instrument},
        )

        # 5. Funnel Execution Loop (Handles attempts & retries)
        while True:
            # Stage A: AUTHENTICATING (2FA / OTP verification)
            emit_event(
                FunnelState.METHOD_SELECTED,
                FunnelState.AUTHENTICATING,
                "INITIATE_AUTH",
                {"attempt": attempt, "method": active_method},
            )

            # Sample Auth Latency from Environment
            auth_latency_sec = self._sample_auth_latency(
                active_method, environment.latency_assumptions, agent_rng
            )
            auth_latency_ms = max(500, int(auth_latency_sec * 1000))
            current_time_ms += auth_latency_ms

            # Check Patience Timeout during Auth
            if current_time_ms > patience_timeout_ms:
                emit_event(
                    FunnelState.AUTHENTICATING,
                    FunnelState.ABANDONED,
                    "AUTH_TIMEOUT",
                    {"elapsed_ms": current_time_ms, "patience_ms": patience_timeout_ms},
                )
                emit_event(
                    FunnelState.ABANDONED,
                    FunnelState.TERMINATED_ABANDONED,
                    "SESSION_CLOSED",
                    {"terminal_reason": "AUTH_TIMEOUT"},
                )
                return AgentSimulationResult(
                    agent_id=agent.agent_id,
                    archetype=agent.archetype,
                    is_successful=False,
                    is_abandoned=True,
                    final_state=FunnelState.TERMINATED_ABANDONED,
                    total_attempts=attempt,
                    final_method=active_method,
                    method_switched=method_switched,
                    amount_inr=order_amount,
                    fee_inr=0.0,
                    tax_inr=0.0,
                    terminal_reason="AUTH_TIMEOUT",
                    total_duration_ms=current_time_ms,
                    event_trace=event_trace,
                )

            # Check 2FA Authentication Failure (e.g. OTP mistyped)
            auth_failed = agent_rng.random() < environment.auth_failure_rate
            if auth_failed:
                emit_event(
                    FunnelState.AUTHENTICATING,
                    FunnelState.FAILED,
                    "AUTH_FAILED",
                    {"reason": "incorrect_otp", "step": "payment_authentication"},
                )
                # Transition to Retry Evaluation
                retry_result = self._handle_retry_evaluation(
                    agent=agent,
                    environment=environment,
                    attempt=attempt,
                    max_retries=max_retries,
                    active_method=active_method,
                    order_amount=order_amount,
                    method_switched=method_switched,
                    current_time_ms=current_time_ms,
                    agent_rng=agent_rng,
                    emit_event=emit_event,
                    event_trace=event_trace,
                )
                if isinstance(retry_result, AgentSimulationResult):
                    return retry_result
                # Unpack continued retry state: (next_attempt, next_method, switched_flag)
                attempt, active_method, method_switched = retry_result
                continue

            # Auth Succeeded -> Transition to PROCESSING
            emit_event(FunnelState.AUTHENTICATING, FunnelState.PROCESSING, "OTP_VERIFIED")

            # Stage B: PROCESSING (Acquirer / Gateway Network Authorization)
            proc_mean, proc_std = environment.latency_assumptions.gateway_proc_latency_sec
            gw_latency_ms = max(300, int(agent_rng.normal(proc_mean, proc_std) * 1000))
            current_time_ms += gw_latency_ms

            capture_prob = environment.get_success_probability(active_method, sub_instrument)
            is_captured = agent_rng.random() < capture_prob

            if is_captured:
                # Capture Succeeded!
                fee_inr, tax_inr = environment.get_fees_and_taxes(active_method, order_amount)
                emit_event(
                    FunnelState.PROCESSING,
                    FunnelState.SUCCESS,
                    "GATEWAY_CAPTURED",
                    {"fee_inr": fee_inr, "tax_inr": tax_inr, "attempt": attempt},
                )
                emit_event(
                    FunnelState.SUCCESS,
                    FunnelState.TERMINATED_SUCCESS,
                    "SESSION_COMPLETE",
                    {"terminal_reason": "CAPTURED"},
                )
                return AgentSimulationResult(
                    agent_id=agent.agent_id,
                    archetype=agent.archetype,
                    is_successful=True,
                    is_abandoned=False,
                    final_state=FunnelState.TERMINATED_SUCCESS,
                    total_attempts=attempt,
                    final_method=active_method,
                    method_switched=method_switched,
                    amount_inr=order_amount,
                    fee_inr=fee_inr,
                    tax_inr=tax_inr,
                    terminal_reason="CAPTURED",
                    total_duration_ms=current_time_ms,
                    event_trace=event_trace,
                )

            # Gateway Declined!
            decline_reason = self._sample_decline_reason(environment, agent_rng)
            emit_event(
                FunnelState.PROCESSING,
                FunnelState.FAILED,
                "GATEWAY_DECLINED",
                {"reason": decline_reason, "step": "payment_authorization"},
            )

            # Transition to Retry Evaluation
            retry_result = self._handle_retry_evaluation(
                agent=agent,
                environment=environment,
                attempt=attempt,
                max_retries=max_retries,
                active_method=active_method,
                order_amount=order_amount,
                method_switched=method_switched,
                current_time_ms=current_time_ms,
                agent_rng=agent_rng,
                emit_event=emit_event,
                event_trace=event_trace,
            )
            if isinstance(retry_result, AgentSimulationResult):
                return retry_result
            # Unpack continued retry state: (next_attempt, next_method, switched_flag)
            attempt, active_method, method_switched = retry_result

    def _handle_retry_evaluation(
        self,
        agent: CustomerAgent,
        environment: VirtualPaymentEnvironment,
        attempt: int,
        max_retries: int,
        active_method: str,
        order_amount: float,
        method_switched: bool,
        current_time_ms: int,
        agent_rng: np.random.Generator,
        emit_event: Any,
        event_trace: List[SimulationEvent],
    ) -> Tuple[int, str, bool] | AgentSimulationResult:
        """
        Evaluates retry decision, enforces retry limits, and executes method switching.
        Returns (next_attempt, next_method, method_switched) if retrying, or terminal AgentSimulationResult if abandoned.
        """
        emit_event(
            FunnelState.FAILED,
            FunnelState.RETRY_EVALUATION,
            "EVALUATE_RETRY",
            {"current_attempt": attempt, "max_retries": max_retries},
        )

        # Check if agent can and wants to retry
        can_retry = attempt <= max_retries
        wants_to_retry = agent_rng.random() < agent.latent_parameters.retry_propensity

        if can_retry and wants_to_retry:
            next_attempt = attempt + 1
            sec_method = agent.observed_preferences.secondary_method

            # Check method switch
            wants_to_switch = (
                sec_method is not None
                and sec_method != active_method
                and (agent_rng.random() < agent.latent_parameters.method_switch_propensity)
            )

            if wants_to_switch and sec_method is not None:
                old_m = active_method
                next_method = sec_method
                switched_flag = True
                emit_event(
                    FunnelState.RETRY_EVALUATION,
                    FunnelState.METHOD_SELECTED,
                    "METHOD_SWITCHED",
                    {"old_method": old_m, "new_method": next_method, "attempt": next_attempt},
                )
            else:
                next_method = active_method
                switched_flag = method_switched
                emit_event(
                    FunnelState.RETRY_EVALUATION,
                    FunnelState.METHOD_SELECTED,
                    "RETRY_SAME_METHOD",
                    {"method": next_method, "attempt": next_attempt},
                )

            return next_attempt, next_method, switched_flag

        # Retries Exhausted or Agent Gave Up
        terminal_cause = "MAX_RETRIES_EXCEEDED" if attempt > max_retries else "GAVE_UP_AFTER_DECLINE"
        action_name = "RETRIES_EXHAUSTED" if attempt > max_retries else "ABANDON_AFTER_FAIL"

        emit_event(
            FunnelState.RETRY_EVALUATION,
            FunnelState.ABANDONED,
            action_name,
            {"terminal_reason": terminal_cause, "attempt": attempt},
        )
        emit_event(
            FunnelState.ABANDONED,
            FunnelState.TERMINATED_ABANDONED,
            "SESSION_CLOSED",
            {"terminal_reason": terminal_cause},
        )

        return AgentSimulationResult(
            agent_id=agent.agent_id,
            archetype=agent.archetype,
            is_successful=False,
            is_abandoned=True,
            final_state=FunnelState.TERMINATED_ABANDONED,
            total_attempts=attempt,
            final_method=active_method,
            method_switched=method_switched,
            amount_inr=order_amount,
            fee_inr=0.0,
            tax_inr=0.0,
            terminal_reason=terminal_cause,
            total_duration_ms=current_time_ms,
            event_trace=event_trace,
        )

    def _sample_auth_latency(
        self, method: str, lat_config: Any, rng: np.random.Generator
    ) -> float:
        """
        Samples authentication duration in seconds from configured latency distributions.
        """
        if method == "upi":
            mean, std = lat_config.upi_auth_latency_sec
        elif method == "card":
            mean, std = lat_config.card_auth_latency_sec
        elif method == "netbanking":
            mean, std = lat_config.netbanking_auth_latency_sec
        elif method == "wallet":
            mean, std = lat_config.wallet_auth_latency_sec
        else:
            mean, std = (5.0, 1.5)

        sample = float(rng.normal(mean, std))
        return max(0.5, sample)

    def _sample_decline_reason(
        self, environment: VirtualPaymentEnvironment, rng: np.random.Generator
    ) -> str:
        """
        Samples an empirical decline reason from DNA error diagnostics.
        """
        reasons_dist = environment.top_error_reasons
        if reasons_dist and sum(reasons_dist.values()) > 0:
            reasons = sorted(reasons_dist.keys())
            probs = [reasons_dist[r] for r in reasons]
            norm_p = [p / sum(probs) for p in probs]
            return str(rng.choice(reasons, p=norm_p))

        return "insufficient_funds"
