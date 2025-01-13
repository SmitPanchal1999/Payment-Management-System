from fastapi import HTTPException
from pydantic import ValidationError
from app.models import Payment
from typing import List
from decimal import Decimal

def validate_payment(data: dict) -> Payment:
    try:
        
        return Payment(**data)  # Validate using Pydantic model
    except ValidationError as e:
        raise ValueError(f"Validation Error: {e}")

def validate_file_type(file):
    allowed_extensions = {"pdf", "png", "jpg", "jpeg"}
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed types: PDF, PNG, JPG.")
