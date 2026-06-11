from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from sqlalchemy.exc import SQLAlchemyError
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.api.v1.router import api_router
from app import models
from app.middleware.error_handler import (
    global_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    sqlalchemy_exception_handler,
)
from app.middleware.rate_limiter import limiter, rate_limit_exceeded_handler

# Instantiate FastAPI application
app = FastAPI(title="Chatbot Platform API", version="1.0.0")

# Assign rate limiter state and register its handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Setup CORS - restricted to configured FRONTEND_URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register database, validation, HTTP, and general exception handlers
app.add_exception_handler(FastAPIHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Basic service health check
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

# Mount aggregate API v1 router
app.include_router(api_router, prefix="/api/v1")
