from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
from app.payment_services import (
    create_payment, 
    get_payments, 
    get_payment_by_id,
    update_payment, 
    delete_payment, 
    upload_evidence, 
    download_evidence,
    import_payments_from_csv
)
from models import Payment
from io import StringIO
import csv
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://payment-management-system-frontend.onrender.com",  # Replace with your frontend URL
        "http://localhost:4200"  # Keep this for local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/payments/")
async def create_payment_route(payment: Payment):
    try:
        payment_id = await create_payment(payment.dict())
        return {"payment_id": payment_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/payments/")
async def get_payments_route( 
    search: Optional[str] = None,
    page: int = Query(default=1, gt=0),
    limit: int = Query(default=10, gt=0),
    status: Optional[str] = None,
    country: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None):
    # Build filter parameters
    filter_params = {}
    
    if status:
        filter_params["payee_payment_status"] = status
        
    if country:
        filter_params["payee_country"] = country
        
    if min_amount is not None:
        filter_params["due_amount"] = {"$gte": min_amount}
        
    if max_amount is not None:
        if "due_amount" in filter_params:
            filter_params["due_amount"]["$lte"] = max_amount
        else:
            filter_params["due_amount"] = {"$lte": max_amount}
    
    return await get_payments(
        filter_params=filter_params,
        search=search,
        page=page,
        limit=limit
    )

@app.put("/payments/{payment_id}")
async def update_payment_endpoint(
    payment_id: str,
    data: str = Form(...),  # Expect JSON string
    evidence_file: Optional[UploadFile] = File(None)
):
    try:
        # Parse the JSON string data
        update_data = json.loads(data)
        
        # Add file if present
        if evidence_file:
            update_data['evidence_file'] = evidence_file
            
        result = await update_payment(payment_id, update_data)
        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON data provided")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/payments/{payment_id}")
async def delete_payment_route(payment_id: str):
    try:
        await delete_payment(payment_id)
        return {"message": "Payment deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# New API to upload evidence
@app.post("/payments/{payment_id}/upload_evidence/")
async def upload_evidence_route(payment_id: str, file: UploadFile = File(...)):
    try:
        result = await upload_evidence(payment_id, file)
        return {"message": "Evidence uploaded successfully", "evidence_file_id": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/payments/import-csv")
async def import_csv(file: UploadFile = File(...)):
    return await import_payments_from_csv(file)

@app.get("/payments/{payment_id}")
async def get_payment_by_id_route(payment_id: str):
    try:
        payment = await get_payment_by_id(payment_id)
        if payment is None:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/payments/{payment_id}/evidence/download")
async def download_evidence_endpoint(payment_id: str):
    try:
        return await download_evidence(payment_id)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))