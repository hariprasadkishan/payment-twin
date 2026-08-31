"""
Health check route for service liveness and readiness verification.
"""

from fastapi import APIRouter, status
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """
    Health check response model.
    """

    status: str = Field(default="ok", description="Current operational status of the service")


router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
    description="Returns the operational status of the Payment Twin backend.",
    tags=["Health"],
)
def get_health() -> HealthResponse:
    """
    Returns HTTP 200 with status: 'ok'.
    """
    return HealthResponse(status="ok")
