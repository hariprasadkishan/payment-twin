"""
Customer Agent API endpoints.
Provides synthetic customer agent population generation and calibration diagnostics.
"""

from fastapi import APIRouter, Depends, status

from app.models.agent import AgentGenerationRequest, AgentGenerationResponse
from app.services.agent_generator import AgentPopulationGenerator
from app.services.dna_profiler import BehavioralDNAProfiler

router = APIRouter(prefix="/agents", tags=["Customer Agents"])


def get_dna_profiler() -> BehavioralDNAProfiler:
    """
    Dependency provider for BehavioralDNAProfiler.
    """
    return BehavioralDNAProfiler()


def get_agent_generator() -> AgentPopulationGenerator:
    """
    Dependency provider for AgentPopulationGenerator.
    """
    return AgentPopulationGenerator()


@router.post(
    "/generate",
    response_model=AgentGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Synthetic Customer Agent Population",
    description=(
        "Synthesizes a population of stateful Customer Agents statistically calibrated to the merchant's "
        "Behavioral DNA. If the DNA profile is empty or unavailable, refuses generation rather than fabricating data."
    ),
)
def generate_agent_population(
    request: AgentGenerationRequest = AgentGenerationRequest(),
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
    generator: AgentPopulationGenerator = Depends(get_agent_generator),
) -> AgentGenerationResponse:
    """
    Generates a calibrated customer agent population with calibration diagnostics.
    """
    # 1. Obtain Behavioral DNA profile
    if request.dataset:
        records, _ = profiler.loader.load_records_from_file(request.dataset)
        dna_profile = profiler.build_profile(records=records, source_label=request.dataset)
    else:
        dna_profile = profiler.build_profile()

    # 2. Generate Agent Population
    return generator.generate_population(
        dna=dna_profile,
        population_size=request.population_size,
        random_seed=request.random_seed,
        preview_count=request.preview_count,
    )
