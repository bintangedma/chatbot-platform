from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    message: str
