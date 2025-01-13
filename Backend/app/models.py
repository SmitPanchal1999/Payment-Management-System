from pydantic import BaseModel, Field, model_validator, validator
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
import re


class Payment(BaseModel):
    """
    Model representing a Payment object in the system.
    This model ensures validation of the payment fields and transformation
    of incoming data for correct database storage.
    """

    # Payment details
    payee_first_name: str
    payee_last_name: str
    payee_payment_status: str  # Valid values: completed, due_now, overdue, pending
    payee_added_date_utc: datetime  # UTC timestamp as ISO 8601 string
    payee_due_date: datetime  # Date format YYYY-MM-DD
    payee_address_line_1: str
    payee_address_line_2: Optional[str] = None
    payee_city: str
    payee_country: str  # ISO 3166-1 alpha-2 country code
    payee_province_or_state: Optional[str] = None
    payee_postal_code: str
    payee_phone_number: str
    payee_email: str
    currency: str  # ISO 4217 currency code

    discount_percent: Optional[float] = None
    tax_percent: Optional[float] = None
    due_amount: float  # 2 decimal points
    total_due: Optional[float] = None
    evidence_file_id: Optional[str] = None

    @validator('payee_phone_number')
    def validate_phone_number(cls, value: str) -> str:
        """
        Validate that the phone number is in the E.164 format.
        E.164 format example: +1234567890
        """
        pattern = r'^\+?[1-9]\d{1,14}$'
        if not re.match(pattern, value):
            raise ValueError(f"Invalid phone number: {value}")
        return value

    @validator('payee_email')
    def validate_email(cls, value: str) -> str:
        """
        Validate that the email follows the correct format.
        """
        email_pattern = r'^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            raise ValueError(f"Invalid email format: {value}")
        return value

    @validator('payee_added_date_utc')
    def validate_payee_added_date_utc(cls, value: datetime) -> datetime:
        """
        Ensure the payee added date is in valid ISO 8601 format.
        """
        try:
            # Validate the UTC timestamp format
            datetime.fromisoformat(value.isoformat())
        except ValueError:
            raise ValueError(f"Invalid UTC timestamp: {value}")
        return value

    @validator('payee_due_date')
    def validate_payee_due_date(cls, value: date) -> datetime:
        """
        Convert `datetime.date` to `datetime.datetime` for MongoDB compatibility.
        """
        if isinstance(value, date):
            # Convert date to datetime
            value = datetime(value.year, value.month, value.day)
        return value


    @model_validator(mode='before')
    def validate_percentages(cls, values):
        """
        Ensure that discount_percent and tax_percent are between 0 and 100.
        """
        discount_percent = values.get('discount_percent')
        tax_percent = values.get('tax_percent')

        if discount_percent is not None:
            values['discount_percent']=round(float(values['discount_percent']), 2)
            discount_percent=values['discount_percent']
            

            if (discount_percent < 0 or discount_percent > 100):
                raise ValueError(f"discount_percent must be between 0 and 100.")
            
        if tax_percent is not None :
            values['tax_percent']=round(float(values['tax_percent']), 2)
            tax_percent=values['tax_percent']

            if (tax_percent < 0 or tax_percent > 100):
                
                raise ValueError(f"tax_percent must be between 0 and 100.")

        return values
    @model_validator(mode='before')
    def convert_date(cls, values):
        # Convert payee_due_date from datetime.date to datetime.datetime or string
        due_date = values.get('payee_due_date')
        if isinstance(due_date, date):
           values['payee_due_date'] = due_date.isoformat()  # Convert to string
        return values
    
    @model_validator(mode='before')
    def calculate_total_due(cls, values):
        """
        Calculate total_due if not already provided.
        """
        due_amount = values.get('due_amount')
        discount_percent = values.get('discount_percent', 0)
        tax_percent = values.get('tax_percent', 0)

        if due_amount is not None:

            total_due = float(due_amount) * (1 + float(tax_percent) / 100) * (1 - float(discount_percent) / 100)
            values['due_amount']=round(float(values['due_amount']), 2)
            values['total_due'] = round(total_due, 2)

        return values

    class Config:
        from_attributes = True  # Use this instead of orm_mode
        schema_extra = {
            "example": {
                "payee_first_name": "John",
                "payee_last_name": "Doe",
                "payee_payment_status": "pending",
                "payee_added_date_utc": "2024-01-01T12:00:00Z",
                "payee_due_date": "2024-01-15",
                "payee_address_line_1": "123 Main St",
                "payee_address_line_2": "Apt 4B",
                "payee_city": "Waterloo",
                "payee_country": "CA",
                "payee_province_or_state": "ON",
                "payee_postal_code": "N2L 5W6",
                "payee_phone_number": "+1234567890",
                "payee_email": "john.doe@example.com",
                "currency": "CAD",
                "discount_percent": 5.00,
                "tax_percent": 13.00,
                "due_amount": 1000.00,
                "total_due": 1057.50,
                "evidence_file_id":""
            }
        }