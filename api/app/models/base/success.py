"""Success response model"""

from pydantic import BaseModel

from .response import BaseResponse


class SuccessResponse(BaseResponse):
    """Success response model"""

    success: bool = True
