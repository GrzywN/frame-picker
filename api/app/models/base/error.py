"""Error response model"""

from typing import Optional

from pydantic import BaseModel, Field

from .response import BaseResponse


class ErrorResponse(BaseResponse):
    """Error response model"""

    error: str
    details: Optional[dict] = None
    session_id: Optional[str] = None
