import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.config import settings
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.collaboration import Attachment
from app.schemas.collaboration import AttachmentResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/attachments", tags=["Attachments"])

@router.post("/upload", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    file: UploadFile = File(...),
    ticket_id: Optional[int] = Form(None),
    task_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    # Extension validation
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '.{ext}' is not permitted. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    safe_filename = f"{uuid.uuid4().hex}.{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    # Read and validate size
    content = await file.read()
    file_size = len(content)
    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size ({settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB)"
        )

    with open(dest_path, "wb") as f:
        f.write(content)

    attachment = Attachment(
        ticket_id=ticket_id,
        task_id=task_id,
        uploaded_by_id=current_user.id,
        file_name=safe_filename,
        original_name=file.filename,
        file_path=f"/uploads/{safe_filename}",
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream"
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    log_audit_event(db, action="UPLOAD_ATTACHMENT", entity_type="ATTACHMENT", entity_id=str(attachment.id), user=current_user)

    uploader_name = current_user.email
    if current_user.employee_profile:
        uploader_name = current_user.employee_profile.full_name
    elif current_user.client_profile:
        uploader_name = current_user.client_profile.contact_person

    return AttachmentResponse(
        id=attachment.id,
        ticket_id=attachment.ticket_id,
        task_id=attachment.task_id,
        uploaded_by_id=attachment.uploaded_by_id,
        uploader_name=uploader_name,
        original_name=attachment.original_name,
        file_path=attachment.file_path,
        file_size=attachment.file_size,
        mime_type=attachment.mime_type,
        created_at=attachment.created_at
    )
