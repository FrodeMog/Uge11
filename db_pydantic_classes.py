from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from typing import List

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class RunningTask(BaseModel):
    task_id: str
    name: str
    status: str
    running_file: str

    start_time: datetime
    end_time: datetime

    processed_rows: int
    start_row: int
    num_rows: int

    results: str

    class Config:
        orm_mode = True

class GRIPdfBase(BaseModel):
    brnumber: str
    title: Optional[str] = None
    file_name: Optional[str] = None
    publication_year: Optional[str] = None
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    organization_sector: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None

    download_status: str
    download_message: Optional[str] = None
    download_attempt_date: datetime

    pdf_url: Optional[str] = None
    pdf_backup_url: Optional[str] = None

    class Config:
        orm_mode = True

class PdfResponse(BaseModel):
    pdfs: List[GRIPdfBase]
    total_pdfs: int

class Filter(BaseModel):
    field: str
    value: str

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, regex="^[A-Za-z0-9_]+$")
    email: EmailStr
    password: str

    class Config:
        orm_mode = True

class UserAdmin(UserBase):
    username: str = Field(..., min_length=3, regex="^[A-Za-z0-9_]+$")
    email: EmailStr
    password: str
    is_admin: Optional[str] = True

    class Config:
        orm_mode = True

class UserInDB(UserBase):
    id: int
    username: str
    email: EmailStr
    is_admin: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class UserResposne(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class UserAdminResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_admin: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True