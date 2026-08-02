import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models import Upload
from app.services import process_upload, process_invoice_pipeline
from app.schemas import UploadResponse, UploadDetailResponse, BaseResponse
from app.utils import generate_id, now_utc

router = APIRouter()


@router.post("/upload", status_code=201)
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload invoice file for processing"""
    file_id = generate_id()
    mime_type = file.content_type or "application/octet-stream"

    upload = Upload(
        id=file_id,
        original_filename=file.filename,
        stored_filename="",
        file_path="",
        file_size=0,
        file_type=mime_type,
        file_extension=Path(file.filename or "").suffix,
        upload_status="PENDING",
    )
    db.add(upload)
    db.commit()

    try:
        file_path, validated_mime_type = await process_upload(db, upload, file, mime_type)

        upload.stored_filename = Path(file_path).name
        upload.file_path = file_path
        upload.file_size = Path(file_path).stat().st_size
        upload.file_type = validated_mime_type
        upload.file_extension = Path(file_path).suffix
        upload.upload_status = "PROCESSING"
        db.commit()

        background_tasks.add_task(_process_background, upload.id, file_path, validated_mime_type)

        return {
            "success": True,
            "data": {
                "invoice_id": upload.id,
                "file_name": file.filename or "",
                "file_size": upload.file_size,
                "status": upload.upload_status,
                "uploaded_at": upload.uploaded_at.isoformat() if upload.uploaded_at else "",
            },
            "message": "File uploaded successfully. Processing started.",
        }
    except HTTPException:
        raise
    except Exception as e:
        upload.upload_status = "FAILED"
        upload.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


async def _process_background(upload_id: str, file_path: str, mime_type: str):
    from app.services.supabase_service import save_invoice_to_supabase
    
    db = SessionLocal()
    try:
        upload = db.query(Upload).filter(Upload.id == upload_id).first()
        if upload:
            result = await process_invoice_pipeline(db, upload, file_path, mime_type)
            upload.upload_status = "COMPLETED"
            upload.processed_at = now_utc()
            db.commit()
            
            # Save to Supabase
            try:
                invoice_id = await save_invoice_to_supabase(
                    invoice_data=result.get("extraction", {}),
                    extraction_result={
                        "invoice_data": result.get("extraction", {}),
                        "confidence_scores": result.get("confidence", {}),
                        "ocr_confidence": result.get("ocr_confidence", 0),
                    },
                    validation_result=result.get("validation", {}),
                    risk_result=result.get("risk", {}),
                    upload_id=upload_id
                )
                if invoice_id:
                    upload.invoice_id = invoice_id
                    db.commit()
                    print(f"✅ Invoice saved to Supabase: {invoice_id}")
            except Exception as e:
                print(f"⚠️  Failed to save to Supabase: {str(e)}")
    except Exception as e:
        if upload:
            upload.upload_status = "FAILED"
            upload.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.get("/upload/{upload_id}")
async def get_upload_status(upload_id: str, db: Session = Depends(get_db)):
    """Get upload status and details"""
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    return {
        "success": True,
        "data": {
            "id": upload.id,
            "original_filename": upload.original_filename,
            "file_size": upload.file_size,
            "file_type": upload.file_type,
            "upload_status": upload.upload_status,
            "extracted_data": upload.extracted_data,
            "confidence_scores": upload.confidence_scores,
            "risk_score": upload.risk_score,
            "risk_level": upload.risk_level,
            "validation_errors": upload.validation_errors,
            "error_message": upload.error_message,
            "invoice_id": upload.invoice_id,
            "uploaded_at": upload.uploaded_at.isoformat() if upload.uploaded_at else None,
            "processed_at": upload.processed_at.isoformat() if upload.processed_at else None,
        },
        "message": "Upload details retrieved",
    }


@router.get("/uploads")
async def get_uploads(page: int = 1, limit: int = 20, db: Session = Depends(get_db)):
    """Get list of uploads with pagination"""
    offset = (page - 1) * limit
    
    total = db.query(Upload).count()
    uploads = db.query(Upload).order_by(Upload.uploaded_at.desc()).offset(offset).limit(limit).all()
    
    items = []
    for upload in uploads:
        items.append({
            "id": upload.id,
            "original_filename": upload.original_filename,
            "file_size": upload.file_size,
            "file_type": upload.file_type,
            "upload_status": upload.upload_status,
            "extracted_data": upload.extracted_data,
            "confidence_scores": upload.confidence_scores,
            "risk_score": upload.risk_score,
            "risk_level": upload.risk_level,
            "validation_errors": upload.validation_errors,
            "error_message": upload.error_message,
            "invoice_id": upload.invoice_id,
            "uploaded_at": upload.uploaded_at.isoformat() if upload.uploaded_at else None,
            "processed_at": upload.processed_at.isoformat() if upload.processed_at else None,
        })
    
    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
        },
        "message": "Uploads retrieved",
    }


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    all_uploads = db.query(Upload).all()
    total = len(all_uploads)
    successful = len([u for u in all_uploads if u.upload_status == "COMPLETED"])
    failed = len([u for u in all_uploads if u.upload_status == "FAILED"])
    
    confidences = []
    for upload in all_uploads:
        if upload.confidence_scores and isinstance(upload.confidence_scores, dict):
            overall = upload.confidence_scores.get("overall", 0)
            if overall:
                confidences.append(overall)
    
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    
    return {
        "success": True,
        "data": {
            "total": total,
            "successful": successful,
            "failed": failed,
            "avgConfidence": avg_confidence,
        },
        "message": "Stats retrieved",
    }


@router.post("/upload/{upload_id}/retry")
async def retry_upload(upload_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Retry failed upload processing"""
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    if not upload.file_path:
        raise HTTPException(status_code=400, detail="File path not found")
    
    upload.upload_status = "PROCESSING"
    upload.error_message = None
    db.commit()
    
    background_tasks.add_task(_process_background, upload.id, upload.file_path, upload.file_type)
    
    return {
        "success": True,
        "data": {
            "invoice_id": upload.id,
            "file_name": upload.original_filename or "",
            "file_size": upload.file_size,
            "status": upload.upload_status,
            "uploaded_at": upload.uploaded_at.isoformat() if upload.uploaded_at else "",
        },
        "message": "Upload retry initiated",
    }


@router.delete("/upload/{upload_id}")
async def delete_upload(upload_id: str, db: Session = Depends(get_db)):
    """Delete an upload record"""
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    # Delete file if exists
    if upload.file_path and Path(upload.file_path).exists():
        Path(upload.file_path).unlink()
    
    db.delete(upload)
    db.commit()
    
    return {
        "success": True,
        "data": {"deleted": True},
        "message": "Upload deleted",
    }
