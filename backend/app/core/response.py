from typing import Any, Optional
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi import status

def success_response(data: Any = None, message: str = "Request successful", status_code: int = status.HTTP_200_OK):
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "data": jsonable_encoder(data),
            "message": message
        }
    )

def error_response(message: str = "An error occurred", data: Any = None, status_code: int = status.HTTP_400_BAD_REQUEST):
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "data": jsonable_encoder(data),
            "message": message
        }
    )
