from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class GRIPdfBase(BaseModel):
    BRnumber: str
    title: str
    publication_year: str
    organization_name: str
    organization_type: str
    organization_sector: str
    country: str
    region: str
    pdf_url: str
    pdf_backup_url: str

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, regex="^[A-Za-z0-9_]+$")
    email: EmailStr
    password: str
    is_admin: Optional[bool] = False

    class Config:
        orm_mode = True

class UserInDB(UserBase):
    id: int
    username: str
    email: EmailStr
    is_admin: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True