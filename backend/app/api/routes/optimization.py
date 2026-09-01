"""
Pareto Multi-Objective Optimization API endpoints.
Explores the trade-off frontier across conversion rates, revenue, and processing costs.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.optimization import OptimizationRequest, ParetoFrontierResult
from app.services.dna_profiler import BehavioralDNAProfiler
from app.services.pareto_optimizer import ParetoOptimizer

router = APIRouter(prefix="/optimization", tags=["Pareto Optimization"])


def get_dna_profiler() -> BehavioralDNAProfiler:
    """
    Dependency provider for BehavioralDNAProfiler.
    """
    return BehavioralDNAProfiler()


def get_pareto_optimizer() -> ParetoOptimizer:
    """
    Dependency provider for ParetoOptimizer.
    """
    return ParetoOptimizer()


@router.post(
    "/pareto",
    response_model=ParetoFrontierResult,
    status_code=status.HTTP_200_OK,
    summary="Execute Multi-Objective Pareto Frontier Optimization",
    description=(
        "Simulates a grid of candidate policy scenarios against Behavioral DNA using Common Random Numbers (CRN), "
        "filters hard operational constraints, and extracts the non-dominated Pareto trade-off curve."
    ),
)
def run_pareto_optimization(
    request: OptimizationRequest,
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
    optimizer: ParetoOptimizer = Depends(get_pareto_optimizer),
) -> ParetoFrontierResult:
    """
    Executes multi-objective Pareto optimization across candidate scenario configurations.
    """
    if request.dataset:
        records, _ = profiler.loader.load_records_from_file(request.dataset)
        dna_profile = profiler.build_profile(records=records, source_label=request.dataset)
    else:
        dna_profile = profiler.build_profile()

    try:
        return optimizer.optimize(dna=dna_profile, request=request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
