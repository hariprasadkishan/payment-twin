"""
Payment Guardian API routes.
Exposes endpoints for surveillance status, telemetry drift analysis, and alert lifecycle management.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.guardian import (
    AlertStatus,
    GuardianAlert,
    GuardianAnalysisResult,
    GuardianConfig,
    GuardianStatusResponse,
)
from app.services.dataset_reader import DatasetLoaderService
from app.services.dna_profiler import BehavioralDNAProfiler
from app.services.guardian_service import GuardianSentinelService

router = APIRouter(prefix="/guardian", tags=["Payment Guardian Sentinel"])

# Global singleton Guardian sentinel instance for stateful alert persistence
_guardian_service_instance = GuardianSentinelService()


def get_dna_profiler() -> BehavioralDNAProfiler:
    return BehavioralDNAProfiler()


def get_dataset_loader() -> DatasetLoaderService:
    return DatasetLoaderService()


def get_guardian_service() -> GuardianSentinelService:
    return _guardian_service_instance


@router.get(
    "/status",
    response_model=GuardianStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Payment Guardian Sentinel Status",
    description="Returns Guardian system readiness, Behavioral DNA baseline health, and active open alerts.",
)
def get_guardian_status(
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
    guardian: GuardianSentinelService = Depends(get_guardian_service),
) -> GuardianStatusResponse:
    dna_profile = profiler.build_profile()
    return guardian.get_status(dna=dna_profile)


@router.post(
    "/analyze",
    response_model=GuardianAnalysisResult,
    status_code=status.HTTP_200_OK,
    summary="Execute Statistical Telemetry Drift Analysis",
    description=(
        "Compares recent payment records against the Behavioral DNA baseline using PSI, "
        "Two-Proportion Z-Tests, Fisher's Exact, Two-Sample KS, and CUSUM, controlled by Benjamini-Hochberg FDR."
    ),
)
def analyze_payment_telemetry(
    config: Optional[GuardianConfig] = None,
    profiler: BehavioralDNAProfiler = Depends(get_dna_profiler),
    loader: DatasetLoaderService = Depends(get_dataset_loader),
    guardian: GuardianSentinelService = Depends(get_guardian_service),
) -> GuardianAnalysisResult:
    cfg = config or GuardianConfig()

    # Load baseline DNA
    dna_profile = profiler.build_profile()

    # Load recent telemetry records
    if cfg.dataset:
        recent_records, _ = loader.load_records_from_file(cfg.dataset)
    else:
        recent_records, _ = loader.load_all_records()

    return guardian.analyze_records(dna=dna_profile, recent_records=recent_records, config=cfg)


@router.get(
    "/alerts",
    response_model=List[GuardianAlert],
    status_code=status.HTTP_200_OK,
    summary="List Payment Guardian Alerts",
    description="Returns all tracked historical and active alerts, with optional status filtering.",
)
def list_guardian_alerts(
    status_filter: Optional[AlertStatus] = Query(default=None, description="Filter alerts by status (OPEN, ACKNOWLEDGED, RESOLVED, RECOVERED)"),
    guardian: GuardianSentinelService = Depends(get_guardian_service),
) -> List[GuardianAlert]:
    return guardian.get_all_alerts(status_filter=status_filter)


@router.post(
    "/alerts/{alert_id}/acknowledge",
    response_model=GuardianAlert,
    status_code=status.HTTP_200_OK,
    summary="Acknowledge an Open Alert",
    description="Transitions an alert from OPEN to ACKNOWLEDGED.",
)
def acknowledge_guardian_alert(
    alert_id: str,
    guardian: GuardianSentinelService = Depends(get_guardian_service),
) -> GuardianAlert:
    alert = guardian.acknowledge_alert(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found.",
        )
    return alert


@router.post(
    "/alerts/{alert_id}/resolve",
    response_model=GuardianAlert,
    status_code=status.HTTP_200_OK,
    summary="Resolve an Alert",
    description="Transitions an alert to RESOLVED.",
)
def resolve_guardian_alert(
    alert_id: str,
    guardian: GuardianSentinelService = Depends(get_guardian_service),
) -> GuardianAlert:
    alert = guardian.resolve_alert(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found.",
        )
    return alert
