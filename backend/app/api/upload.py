import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models import Upload
from app.services import process_upload
from app.schemas import UploadResponse, UploadDetailResponse, BaseResponse
from app.utils import generate_id, now_utc

router = APIRouter()


@router.post("/upload", response_model=BaseResponse[UploadResponse], status_code=201)
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
        # Pass all 4 required positional arguments to process_upload
        file_path, validated_mime_type = await process_upload(db, upload, file, mime_type)
        
        upload.stored_filename = Path(file_path).name
        upload.file_path = file_path
        upload.file_size = Path(file_path).stat().st_size
        upload.file_type = validated_mime_type
        upload.file_extension = Path(file_path).suffix
        upload.upload_status = "PROCESSING"
        db.commit()

        # Add background extraction job
        background_tasks.add_task(_process_background, upload.id, file_path, validated_mime_type)

        return BaseResponse(
            success=True,
            data=UploadResponse(
                invoice_id=upload.invoice_id or "",
                file_name=file.filename or "",
                file_size=upload.file_size,
                status=upload.upload_status,
                uploaded_at=upload.uploaded_at,
            ),
            message="File uploaded successfully. Processing started.",
        )
    except HTTPException:
        raise
    except Exception as e:
        upload.upload_status = "FAILED"
        upload.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


async def _process_background(upload_id: str, file_path: str, mime_type: str):
    db = SessionLocal()
    try:
        upload = db.query(Upload).filter(Upload.id == upload_id).first()
        if upload:
            await process_upload(db, upload, file_path, mime_type)
            upload.upload_status = "COMPLETED"
            upload.processed_at = now_utc()
            db.commit()
    except Exception as e:
        if upload:
            upload.upload_status = "FAILED"
            upload.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.get("/upload/{upload_id}", response_model=BaseResponse[UploadDetailResponse])
async def get_upload_status(upload_id: str, db: Session = Depends(get_db)):
    """Get upload status and details"""
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    return BaseResponse(
        success=True,
        data=UploadDetailResponse.from_orm(upload),
        message="Upload details retrieved",
    )
