"""
API routes package
"""

from fastapi import APIRouter

from .billing import router as billing_router
from .download import router as download_router
from .processing import router as processing_router
from .sessions import router as sessions_router
from .upload import router as upload_router


def create_api_router() -> APIRouter:
    """Create main API router with all sub-routes"""
    api_router = APIRouter(prefix="/api")

    api_router.include_router(sessions_router)
    api_router.include_router(upload_router)
    api_router.include_router(processing_router)
    api_router.include_router(download_router)
    api_router.include_router(billing_router)

    return api_router


__all__ = ["create_api_router"]
