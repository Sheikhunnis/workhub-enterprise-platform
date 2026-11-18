from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, EmailStr
from app.database.connection import get_db
from app.models.user import User, Client
from app.models.enums import UserRole
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# ==========================================
# 1. LOGIN
# ==========================================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    token = create_access_token(subject=user.email, role=user.role.value)
    return {"access_token": token, "token_type": "bearer"}

# ==========================================
# 2. GET CURRENT USER PROFILE
# ==========================================
@router.get("/me")
def get_me(
    db: Session = Depends(get_db), 
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    email = payload.get("sub")
    # 👇 We must load the profiles so the frontend Navbar doesn't crash!
    user = db.query(User).options(
        joinedload(User.employee_profile),
        joinedload(User.client_profile)
    ).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_active": user.is_active,
        "employee_profile": {
            "full_name": f"{user.employee_profile.first_name} {user.employee_profile.last_name}"
        } if user.employee_profile else None,
        "client_profile": {
            "company_name": user.client_profile.company_name,
            "contact_person": user.client_profile.contact_person
        } if user.client_profile else None
    }

# ==========================================
# 3. REGISTER CLIENT
# ==========================================
class ClientRegister(BaseModel):
    email: EmailStr
    password: str
    company_name: str
    contact_person: str
    phone: str = ""
    address: str = ""

@router.post("/register")
def register_client(data: ClientRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=UserRole.CLIENT,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    new_client = Client(
        user_id=new_user.id,
        company_name=data.company_name,
        contact_person=data.contact_person,
        phone=data.phone,
        address=data.address
    )
    db.add(new_client)
    db.commit()

    return {"message": "Client registered successfully!"}