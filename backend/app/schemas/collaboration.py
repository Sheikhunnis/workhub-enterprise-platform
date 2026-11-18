from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None

class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_id: int
    client_id: int
    client_name: Optional[str] = None
    rating: int
    comments: Optional[str] = None
    submitted_at: datetime

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    message: str
    type: str
    link_url: Optional[str] = None
    is_read: bool
    created_at: datetime

class AttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_id: Optional[int] = None
    task_id: Optional[int] = None
    uploaded_by_id: int
    uploader_name: Optional[str] = None
    original_name: str
    file_path: str
    file_size: int
    mime_type: str
    created_at: datetime
