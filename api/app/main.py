"""
Frame Picker API - FastAPI backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database.connection import engine
from .database.models import Base
from .routes import create_api_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Frame Picker API",
    description="AI-powered video frame selection API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(create_api_router())


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Frame Picker API", "version": "0.1.0", "status": "healthy"}


def run_server():
    """Entry point for poetry script"""
    import uvicorn

    from api.app.config import settings

    uvicorn.run(
        "api.app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
    )


if __name__ == "__main__":
    run_server()
