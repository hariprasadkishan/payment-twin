"""
Aggregated API routes module.
"""

from fastapi import APIRouter
from app.api.routes import health

api_router = APIRouter()

# Include health routes under /api/v1 as well as at top-level
api_router.include_router(health.router)
