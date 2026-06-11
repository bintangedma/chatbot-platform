from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, responses

# Configure slowapi limiter using remote host address
limiter = Limiter(key_func=get_remote_address)

async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> responses.JSONResponse:
    """Format rate limit validation failures to standard JSON error format."""
    return responses.JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": "RATE_LIMIT_EXCEEDED",
            "message": "Too many requests. Please try again later.",
            "status_code": 429,
        },
    )
