from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.database import init_db
from app.api.routes import tasks, actions, audit, demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise the database on startup."""
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AgentGuard — a security layer for autonomous AI coding agents.\n\n"
        "Every agent action is evaluated through a deterministic pipeline:\n"
        "Rule Engine → Intent Engine → Risk Engine → Policy Engine → Decision"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(actions.router)
app.include_router(audit.router)
app.include_router(demo.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": settings.APP_NAME, "version": "1.0.0"}
