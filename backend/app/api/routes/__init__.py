"""
Aggregated API routes module.
"""

from fastapi import APIRouter
from app.api.routes import data, health

api_router = APIRouter()

# Include sub-routers under /api/v1
api_router.include_router(health.router)
api_router.include_router(data.router)
