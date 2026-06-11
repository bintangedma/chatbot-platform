import logging
import traceback
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException, RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTPException and format into standard error response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": getattr(exc, "error_code", "UNAUTHORIZED" if exc.status_code == 401 else "HTTP_ERROR"),
            "message": exc.detail,
            "status_code": exc.status_code,
        },
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Format Pydantic field validation errors into a human-readable string list."""
    errors = []
    for err in exc.errors():
        # Get field path location list
        loc = ".".join(str(l) for l in err.get("loc", [])[1:])
        msg = err.get("msg", "Validation error")
        errors.append(f"'{loc}': {msg}" if loc else msg)
    
    message = "Validation failed: " + ", ".join(errors)
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "VALIDATION_ERROR",
            "message": message,
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
        },
    )

async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Log actual database stack trace and return a generic error message to client."""
    logger.error(f"Database Exception occurred: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "DATABASE_ERROR",
            "message": "A database error occurred. Please try again later.",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
    )

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback catch-all handler for unhandled exceptions."""
    logger.error(f"Unhandled Exception in application: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected server error occurred.",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
    )
