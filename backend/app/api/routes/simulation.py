"""
Payment Twin Simulation API endpoints.
Provides single-run and Monte Carlo multi-run simulation executions.
"""

from fastapi import APIRouter, Depends, status

from app.models.simulation import (
    MonteCarloRequest,
    MonteCarloSimulationResult,
    SimulationConfig,
    SimulationResult,
)
from app.services.dna_profiler import BehavioralDNAProfiler
from app.services.simulation_runner import SimulationRunner

router = APIRouter(prefix="/simulation", tags=["Payment Twin Simulation"])


def get_dna_profiler() -> BehavioralDNAProfiler:
    """
    Dependency provider for BehavioralDNAProfiler.
    """
    return BehavioralDNAProfiler()


def get_simulation_runner() -> SimulationRunner:
    """
    Dependency provider for SimulationRunner.
    """
    return SimulationRunner()


@router.post(
    "/run",
    response_model=SimulationResult,
    status_code=status.HTTP_200_OK,
    summary="Run Baseline Payment Twin Simulation",
    description=(
        "Executes a population of synthetic Customer Agents through a virtual payment environment "
        "calibrated to Behavioral DNA. If the DNA profile is empty/unavailable, refuses execution."
    ),
)
def run_simulation(
    config: SimulationConfig = SimulationConfig(),
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
    runner: SimulationRunner = Depends(get_simulation_runner),
) -> SimulationResult:
    """
    Executes a single simulation run and returns executive KPIs and preview event traces.
    """
    if config.dataset:
        records, _ = profiler.loader.load_records_from_file(config.dataset)
        dna_profile = profiler.build_profile(records=records, source_label=config.dataset)
    else:
        dna_profile = profiler.build_profile()

    return runner.run_once(dna=dna_profile, config=config)


@router.post(
    "/monte-carlo",
    response_model=MonteCarloSimulationResult,
    status_code=status.HTTP_200_OK,
    summary="Run Monte Carlo Multi-Run Simulation",
    description=(
        "Executes multiple independent stochastic simulation runs to produce statistical distributions, "
        "confidence intervals, and risk bounds for conversion rates and revenue."
    ),
)
def run_monte_carlo_simulation(
    request: MonteCarloRequest = MonteCarloRequest(),
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
    runner: SimulationRunner = Depends(get_simulation_runner),
) -> MonteCarloSimulationResult:
    """
    Executes multi-run Monte Carlo sweep and returns aggregated distributions.
    """
    if request.dataset:
        records, _ = profiler.loader.load_records_from_file(request.dataset)
        dna_profile = profiler.build_profile(records=records, source_label=request.dataset)
    else:
        dna_profile = profiler.build_profile()

    sim_config = SimulationConfig(
        population_size=request.population_size,
        random_seed=request.random_seed,
        dataset=request.dataset,
    )
    return runner.run_many(dna=dna_profile, config=sim_config, monte_carlo_runs=request.monte_carlo_runs)
