"""
Behavioral DNA API endpoints.
Provides merchant payment DNA status and empirical statistical profiles.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.models.dna import BehavioralDNAProfile, DNAStatusResponse
from app.services.dataset_reader import DatasetLoaderService
from app.services.dna_profiler import BehavioralDNAProfiler

router = APIRouter(prefix="/dna", tags=["Behavioral DNA"])


def get_dna_profiler() -> BehavioralDNAProfiler:
    """
    Dependency provider for BehavioralDNAProfiler.
    """
    return BehavioralDNAProfiler()


@router.get(
    "/status",
    response_model=DNAStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Check Behavioral DNA Profiling Status",
    description="Evaluates available raw transaction datasets and reports profiling readiness and sample size grade.",
)
def get_dna_status(
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
) -> DNAStatusResponse:
    """
    Returns data readiness, confidence grade, and provenance.
    """
    return profiler.get_status()


@router.get(
    "/profile",
    response_model=BehavioralDNAProfile,
    status_code=status.HTTP_200_OK,
    summary="Get Merchant Behavioral DNA Profile",
    description="Calculates and returns the complete empirical Behavioral DNA Profile across available datasets.",
)
def get_dna_profile(
    dataset: Optional[str] = Query(default=None, description="Optional specific JSONL dataset filename to profile"),
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
) -> BehavioralDNAProfile:
    """
    Computes method priors, success rates with Wilson CIs, failure diagnostics, amount distributions, and retries.
    """
    if dataset:
        records, _ = profiler.loader.load_records_from_file(dataset)
        return profiler.build_profile(records=records, source_label=dataset)
    return profiler.build_profile()
