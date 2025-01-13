from db import collection, database
from models import Payment
from validators import validate_payment
import datetime
from fastapi import Query
from datetime import datetime, date

from typing import Optional, Dict, Any, Union
import logging
from fastapi import HTTPException
from bson.objectid import ObjectId
from pydantic import ValidationError
from fastapi import UploadFile, File, Form
import json
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a new payment
async def create_payment(payment_data: dict):
    try:
        logger.debug(f"Starting payment creation with data: {payment_data}")
        
        # Validate payment data
        payment = validate_payment(payment_data)
        logger.debug(f"Payment validation successful: {payment}")
        
        # Insert payment
        result = await collection.insert_one(payment.dict())
        if result.inserted_id:
            payment_id = str(result.inserted_id)
            logger.info(f"Successfully created payment with ID: {payment_id}")
            return payment_id
        else:
            logger.error("Failed to create payment: No inserted_id returned")
            raise HTTPException(
                status_code=500,
                detail="Failed to create payment"
            )
            
    except ValidationError as e:
        logger.error(f"Validation error during payment creation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during payment creation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Get payments with status and calculations
async def get_payments(
    filter_params: Dict[str, Any] = {},
    search: Optional[str] = None,
    page: int = Query(default=1, gt=0),
    limit: int = Query(default=10, gt=0)
):
    try:
        logger.info(f"Fetching payments - Page: {page}, Limit: {limit}, Search: {search}")
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Build query
        query = {}
        if search:
            query["$or"] = [
                {"payee_first_name": {"$regex": search, "$options": "i"}},
                {"payee_last_name": {"$regex": search, "$options": "i"}},
                {"payee_email": {"$regex": search, "$options": "i"}}
            ]
            logger.info(f"Search query: {query}")

        # Get total count
        total = await collection.count_documents(query)
        logger.info(f"Total documents found: {total}")

        # Fetch payments
        cursor = collection.find(query).skip(skip).limit(limit)
        payments = await cursor.to_list(length=limit)
        logger.info(f"Retrieved {len(payments)} payments")

        # Calculate total pages
        total_pages = (total + limit - 1) // limit

        # Process each payment
        for payment in payments:
            payment["_id"] = str(payment["_id"])
            # Calculate total_due if not present
            if "total_due" not in payment:
                due_amount = float(payment.get("due_amount", 0))
                discount = float(payment.get("discount_percent", 0))
                tax = float(payment.get("tax_percent", 0))
                
                total = due_amount * (1 - discount/100) * (1 + tax/100)
                payment["total_due"] = round(total, 2)
            
            # Update payment status based on due date
            if payment["payee_payment_status"] != "completed":
                due_date = payment["payee_due_date"]
                if isinstance(due_date, str):
                    due_date = datetime.strptime(due_date, "%Y-%m-%d").date()
                elif isinstance(due_date, datetime):
                    due_date = due_date.date()
                
                current_date = datetime.now().date()
                
                if due_date < current_date:
                    payment["payee_payment_status"] = "overdue"
                elif due_date == current_date:
                    payment["payee_payment_status"] = "due_now"

        response = {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "payments": payments
        }
        logger.info(f"Successfully prepared response with {len(payments)} payments")
        return response

    except Exception as e:
        logger.error(f"Error fetching payments: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching payments: {str(e)}")
        
# Update payment status or other details
async def update_payment(payment_id: str, update_data: dict):
    try:
        if not ObjectId.is_valid(payment_id):
            raise ValueError("Invalid payment ID")

        # Get existing payment first
        existing_payment = await collection.find_one({"_id": ObjectId(payment_id)})
        if not existing_payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        # Extract evidence_file if present and remove from update_data
        evidence_file = None
        if 'evidence_file' in update_data:
            evidence_file = update_data.pop('evidence_file')

        # Check if status is being changed to completed
        is_status_changing_to_completed = (
            existing_payment.get("payee_payment_status") != "completed" and 
            update_data.get("payee_payment_status") == "completed"
        )

        if is_status_changing_to_completed:
            if not existing_payment.get("evidence_file_id"):
                if evidence_file:
                    try:
                        evidence_file_id = await upload_evidence(payment_id, evidence_file)
                        update_data["evidence_file_id"] = evidence_file_id
                    except Exception as e:
                        logger.error(f"Error uploading evidence: {str(e)}", exc_info=True)
                        raise HTTPException(
                            status_code=400,
                            detail=f"Failed to upload evidence file: {str(e)}"
                        )
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="Evidence file is required when marking payment as completed"
                    )

        # Perform the update
        result = await collection.update_one(
            {"_id": ObjectId(payment_id)}, 
            {"$set": update_data}
        )

        if result.modified_count == 0:
            raise HTTPException(
                status_code=400,
                detail="No changes were made to the payment"
            )

        return {"message": "Payment updated successfully"}

    except Exception as e:
        logger.error(f"Database update error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Database update failed: {str(e)}"
        )

# Delete payment by ID
async def delete_payment(payment_id: str):
    try:
        # Convert string ID to ObjectId
        payment_obj_id = ObjectId(payment_id)
        
        # First, find the payment to check for evidence file
        payment = await collection.find_one({"_id": payment_obj_id})
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # If payment has evidence file, delete it first
        if "evidence_file_id" in payment:
            try:
                # Create GridFS bucket
                fs = AsyncIOMotorGridFSBucket(database)
                
                # Delete the file from GridFS
                await fs.delete(ObjectId(payment["evidence_file_id"]))
                logger.info(f"Evidence file {payment['evidence_file_id']} deleted successfully")
                
            except Exception as e:
                logger.error(f"Error deleting evidence file: {str(e)}")
                # You might want to log this error but continue with payment deletion
        
        # Now delete the payment
        result = await collection.delete_one({"_id": payment_obj_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Payment not found")
            
        return {"message": "Payment and associated evidence file deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting payment: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error deleting payment: {str(e)}"
        )

# Helper to calculate total_due from discounts and tax
def calculate_total_due(payment_data:dict):
    total = payment_data.due_amount
    if payment_data.discount_percent:
        total -= (total * (payment_data.discount_percent / 100))
    if payment_data.tax_percent:
        total += (total * (payment_data.tax_percent / 100))
    return round(total, 2)

import os
from fastapi import HTTPException
from bson.objectid import ObjectId
import shutil
from gridfs import GridFSBucket
import io
from fastapi.responses import StreamingResponse
import csv
from io import StringIO
from fastapi import UploadFile, File

# Upload evidence for a payment
async def upload_evidence(payment_id: str, file):
    # Check if the payment exists and is eligible for evidence upload
    payment = await collection.find_one({"_id": ObjectId(payment_id)})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Validate file type
    allowed_types = ["application/pdf", "image/png", "image/jpeg"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "File type not allowed. Use PDF, PNG, or JPG")
    
    try:
        # Read file content
        contents = await file.read()
        
        # Create GridFS bucket with motor database
        fs = AsyncIOMotorGridFSBucket(database)

        # Upload file to GridFS
        file_id = await fs.upload_from_stream(
            filename=f"{payment_id}_{file.filename}",
            source=io.BytesIO(contents),
            metadata={
                "content_type": file.content_type,
                "payment_id": payment_id
            }
        )
        
        # Update payment with file ID
        await collection.update_one(
            {"_id": ObjectId(payment_id)},
            {
                "$set": {
                    "payee_payment_status": "completed",
                    "evidence_file_id": str(file_id)
                }
            }
        )

        return str(file_id)
        
    except Exception as e:
        logger.error(f"Error uploading evidence: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to upload evidence file: {str(e)}"
        )


# Download evidence for a payment
async def download_evidence(payment_id: str):
    try:
        logger.info(f"Attempting to download evidence for payment ID: {payment_id}")
        
        # Check if payment exists
        payment = await collection.find_one({"_id": ObjectId(payment_id)})
        if not payment:
            logger.error(f"Payment not found for ID: {payment_id}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        logger.info(f"Payment found: {payment}")
        
        if "evidence_file_id" not in payment:
            logger.error(f"No evidence_file_id found in payment: {payment}")
            raise HTTPException(status_code=404, detail="No evidence file found for this payment")
        
        logger.info(f"Evidence file ID found: {payment['evidence_file_id']}")
        
        # Create GridFS bucket with motor
        fs = AsyncIOMotorGridFSBucket(database)
        
        try:
            file_id = ObjectId(payment["evidence_file_id"])
            logger.info(f"Attempting to retrieve file with ID: {file_id}")
            
            # Get file using stored file_id
            grid_out = await fs.open_download_stream(file_id)
            contents = await grid_out.read()
            
            # Get file metadata
            filename = grid_out.filename
            content_type = grid_out.metadata.get("content_type", "application/octet-stream")
            
            logger.info(f"File retrieved successfully. Filename: {filename}, Content-Type: {content_type}")
            
            return StreamingResponse(
                io.BytesIO(contents),
                media_type=content_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
            
        except Exception as e:
            logger.error(f"Error retrieving file from GridFS: {str(e)}")
            raise HTTPException(
                status_code=404, 
                detail=f"Error retrieving evidence file: {str(e)}"
            )
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in download_evidence: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing download request: {str(e)}"
        )



async def import_payments_from_csv(file: UploadFile = File(...)):
    try:
        logger.info(f"Starting CSV import for file: {file.filename}")
        
        # Check if file is CSV
        if not file.filename.endswith('.csv'):
            logger.error(f"Invalid file type: {file.filename}")
            raise HTTPException(
                status_code=400,
                detail="Only CSV files are allowed"
            )
        
        # Read the file content
        content = await file.read()
        csv_string = content.decode('utf-8')
        csv_file = StringIO(csv_string)
        csv_reader = csv.DictReader(csv_file)
        
        logger.debug(f"CSV headers: {csv_reader.fieldnames}")
        
        # Track results
        results = {
            "total": 0,
            "imported": 0,
            "failed": 0,
            "errors": []
        }
        
        for row in csv_reader:
            results["total"] += 1
            logger.debug(f"Processing row {results['total']}: {row}")
            
            try:
                # Convert numeric fields
                if "due_amount" in row:
                    row["due_amount"] = float(row["due_amount"])
                if "discount_percent" in row:
                    row["discount_percent"] = float(row.get("discount_percent", 0))
                if "tax_percent" in row:
                    row["tax_percent"] = float(row.get("tax_percent", 0))
                
                logger.debug(f"Converted numeric fields: {row}")
                
                # Process date fields
                if "payee_due_date" in row:
                    try:
                        datetime.strptime(row["payee_due_date"], "%Y-%m-%d")  # Validate date format
                        logger.debug(f"Valid date format: {row['payee_due_date']}")
                    except ValueError:
                        error_msg = f"Invalid date format for row {results['total']}"
                        logger.error(error_msg)
                        results["failed"] += 1
                        results["errors"].append(error_msg)
                        continue

                # Use create_payment function
                logger.debug(f"Attempting to create payment for row {results['total']}")
                payment_id = await create_payment(row)
                
                if payment_id:
                    results["imported"] += 1
                    logger.info(f"Successfully imported row {results['total']}, payment ID: {payment_id}")
                else:
                    error_msg = f"Failed to import row {results['total']}"
                    logger.error(error_msg)
                    results["failed"] += 1
                    results["errors"].append(error_msg)
                
            except HTTPException as he:
                error_msg = f"Error in row {results['total']}: {he.detail}"
                logger.error(error_msg)
                results["failed"] += 1
                results["errors"].append(error_msg)
            except Exception as e:
                error_msg = f"Error in row {results['total']}: {str(e)}"
                logger.error(error_msg, exc_info=True)
                results["failed"] += 1
                results["errors"].append(error_msg)
        
        logger.info(f"CSV import completed. Total: {results['total']}, "
                   f"Imported: {results['imported']}, Failed: {results['failed']}")
        
        return {
            "message": "CSV import completed",
            "total_rows": results["total"],
            "imported": results["imported"],
            "failed": results["failed"],
            "errors": results["errors"]
        }
        
    except Exception as e:
        logger.error(f"Fatal error during CSV import: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing CSV file: {str(e)}"
        )

# Add this new function
async def get_payment_by_id(payment_id: str):
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(payment_id):
            raise ValueError("Invalid payment ID format")

        # Find payment in database
        payment = await collection.find_one({"_id": ObjectId(payment_id)})
        
        if payment:
            # Convert ObjectId to string for JSON serialization
            payment["_id"] = str(payment["_id"])
            
            # Calculate total_due if not present
            if "total_due" not in payment:
                due_amount = float(payment.get("due_amount", 0))
                discount = float(payment.get("discount_percent", 0))
                tax = float(payment.get("tax_percent", 0))
                total = due_amount * (1 - discount/100) * (1 + tax/100)
                payment["total_due"] = round(total, 2)

            # Update payment status based on due date
            if payment["payee_payment_status"] != "completed":
                due_date = payment["payee_due_date"]
                if isinstance(due_date, str):
                    due_date = datetime.strptime(due_date, "%Y-%m-%d").date()
                elif isinstance(due_date, datetime):
                    due_date = due_date.date()
                
                current_date = datetime.now().date()
                if due_date < current_date:
                    payment["payee_payment_status"] = "overdue"
                elif due_date == current_date:
                    payment["payee_payment_status"] = "due_now"

            return payment
        return None

    except Exception as e:
        logging.error(f"Error in get_payment_by_id: {str(e)}")
        raise Exception(f"Error fetching payment: {str(e)}")