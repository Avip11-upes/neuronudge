from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.reports import router as reports_router
from app.api.sessions import router as sessions_router
from app.api.stages import router as stages_router
from app.api.ws_stream import router as ws_stream_router
from app.config import get_settings
from app.db.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(stages_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(ws_stream_router)
