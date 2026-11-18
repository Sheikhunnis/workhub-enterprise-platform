from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import UserRole, EmployeeStatus

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: UserRole
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ClientRegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    company_name: str
    contact_person: str
    phone: Optional[str] = None
    address: Optional[str] = None

class EmployeeCreateRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    first_name: str
    last_name: str
    employee_code: str
    department_id: int
    designation: str
    phone: Optional[str] = None
    reporting_manager_id: Optional[int] = None
    joining_date: date
    team_ids: Optional[List[int]] = []

class EmployeeUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    reporting_manager_id: Optional[int] = None
    status: Optional[EmployeeStatus] = None

class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

class ClientProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_name: str
    contact_person: str
    phone: Optional[str] = None
    address: Optional[str] = None

class EmployeeProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_code: str
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str] = None
    department_id: int
    designation: str
    reporting_manager_id: Optional[int] = None
    joining_date: date
    status: EmployeeStatus

class CurrentUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    role: UserRole
    is_active: bool
    client_profile: Optional[ClientProfileResponse] = None
    employee_profile: Optional[EmployeeProfileResponse] = None
