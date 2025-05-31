"""
Frame Picker API - FastAPI backend
"""

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .routes import create_api_router

app = FastAPI(
    title="Frame Picker API",
    description="AI-powered video frame selection API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
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
