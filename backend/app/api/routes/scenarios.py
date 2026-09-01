"""
What-If Scenario Engine API endpoints.
Provides single-scenario runs, Common Random Numbers (CRN) comparisons, and matrix parameter sweeps.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.scenario import (
    ScenarioCompareRequest,
    ScenarioCompareResponse,
    ScenarioMatrixRequest,
    ScenarioMatrixResponse,
    ScenarioRunRequest,
)
from app.models.simulation import SimulationResult
from app.services.dna_profiler import BehavioralDNAProfiler
from app.services.scenario_engine import ScenarioEngine

router = APIRouter(prefix="/scenarios", tags=["What-If Scenarios"])


def get_dna_profiler() -> BehavioralDNAProfiler:
    """
    Dependency provider for BehavioralDNAProfiler.
    """
    return BehavioralDNAProfiler()


def get_scenario_engine() -> ScenarioEngine:
    """
    Dependency provider for ScenarioEngine.
    """
    return ScenarioEngine()


@router.post(
    "/run",
    response_model=SimulationResult,
    status_code=status.HTTP_200_OK,
    summary="Run Single What-If Scenario",
    description="Executes a counterfactual What-If policy scenario on the Payment Twin.",
)
def run_scenario(
    request: ScenarioRunRequest,
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
    engine: ScenarioEngine = Depends(get_scenario_engine),
) -> SimulationResult:
    """
    Executes a single scenario and returns executive simulation KPIs and previews.
    """
    if request.scenario.dataset:
        records, _ = profiler.loader.load_records_from_file(request.scenario.dataset)
        dna_profile = profiler.build_profile(records=records, source_label=request.scenario.dataset)
    else:
        dna_profile = profiler.build_profile()

    try:
        return engine.run_scenario(dna=dna_profile, scenario=request.scenario)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.post(
    "/compare",
    response_model=ScenarioCompareResponse,
    status_code=status.HTTP_200_OK,
    summary="Compare Scenarios Against Baseline",
    description=(
        "Executes baseline and counterfactual scenarios under Common Random Numbers (CRN) "
        "and computes paired metric deltas, GMV conservation, and causal attribution."
    ),
)
def compare_scenarios(
    request: ScenarioCompareRequest,
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
    engine: ScenarioEngine = Depends(get_scenario_engine),
) -> ScenarioCompareResponse:
    """
    Compares 1 to 25 scenarios against the baseline simulation.
    """
    if request.dataset:
        records, _ = profiler.loader.load_records_from_file(request.dataset)
        dna_profile = profiler.build_profile(records=records, source_label=request.dataset)
    else:
        dna_profile = profiler.build_profile()

    from app.models.simulation import SimulationConfig

    base_config = SimulationConfig(
        population_size=request.population_size,
        random_seed=request.random_seed,
        dataset=request.dataset,
    )

    try:
        return engine.compare(dna=dna_profile, baseline_config=base_config, scenarios=request.scenarios)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.post(
    "/matrix",
    response_model=ScenarioMatrixResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Scenario Parameter Matrix Grid Sweep",
    description="Expands parameter dimensions into Cartesian product scenarios and produces ranked comparative results.",
)
def run_scenario_matrix(
    request: ScenarioMatrixRequest,
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
    engine: ScenarioEngine = Depends(get_scenario_engine),
) -> ScenarioMatrixResponse:
    """
    Executes a multi-parameter grid sweep and returns a ranked comparison table.
    """
    if request.dataset:
        records, _ = profiler.loader.load_records_from_file(request.dataset)
        dna_profile = profiler.build_profile(records=records, source_label=request.dataset)
    else:
        dna_profile = profiler.build_profile()

    try:
        return engine.expand_and_run_matrix(dna=dna_profile, request=request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
