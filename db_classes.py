from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum, desc, delete, update, inspect
from sqlalchemy.orm import declarative_base, validates
from sqlalchemy.exc import SQLAlchemyError, NoResultFound, IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import re
from sqlalchemy.future import select
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from functools import wraps

def error_handler(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        session = kwargs.get('session')
        try:
            return await func(*args, **kwargs)
        except HTTPException as e:
            raise e
        except IntegrityError as e:
            if session:
                await session.rollback()
            raise HTTPException(status_code=400, detail="A row with the same unique field value already exists.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return wrapper

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            if value is None and not self.__table__.c[key].nullable:
                raise ValueError(f"{key} cannot be null")
            if isinstance(self.__table__.c[key].type, String) and self.__table__.c[key].type.length is not None and len(value) > self.__table__.c[key].type.length:
                raise SQLAlchemyError(f"{key} must be less than {self.__table__.c[key].type.length} characters")
            setattr(self, key, value)

    def __repr__(self):
        return str({column.name: getattr(self, column.name) for column in self.__table__.columns if hasattr(self, column.name)})
    
    @classmethod
    @error_handler
    async def get(cls, session, id):
        row = (await session.execute(select(cls).where(cls.id == id))).scalar_one_or_none()
        if row is None:
            raise HTTPException(status_code=404, detail=f"No {cls.__name__} found with id {id}")
        return row

    @classmethod
    @error_handler
    async def add(cls, session, **kwargs):
        # Create new row
        row = cls(**kwargs)
        session.add(row)
        await session.commit()
        return row

    @classmethod
    @error_handler
    async def update(cls, session, id, **kwargs):
        # Check if a row with the given id exists
        existing_row = (await session.execute(select(cls).where(cls.id == id))).scalar_one_or_none()
        if not existing_row:
            raise HTTPException(status_code=404, detail=f"No {cls.__name__} found with id {id}")

        # Update existing row
        stmt = update(cls).where(cls.id == id).values(**kwargs)
        await session.execute(stmt)
        await session.commit()

        # Refresh the row to get the updated instance
        row = (await session.execute(select(cls).where(cls.id == id))).scalar_one_or_none()
        return row

    @classmethod
    @error_handler
    async def delete(cls, session, id):
        row = (await session.execute(select(cls).where(cls.id == id))).scalar_one_or_none()
        if row is None:
            raise HTTPException(status_code=404, detail=f"No {cls.__name__} found with id {id}")
        await session.delete(row)
        await session.commit()

    @classmethod
    @error_handler
    async def upsert(cls, session, id=None, **kwargs):
        if id:
            return await cls.update(session, id, **kwargs)
        else:
            return await cls.add(session, **kwargs)
        
class GRIPdf(BaseModel):
    __tablename__ = 'GRIPdfs'

    id = Column(Integer, primary_key=True)
    BRnumber = Column(String(50), nullable=False)
    title = Column(Text, nullable=False)
    publication_year = Column(Text, nullable=False)
    organization_name = Column(Text, nullable=False)
    organization_type = Column(Text, nullable=False)
    organization_sector = Column(Text, nullable=False)
    country = Column(Text, nullable=False)
    region = Column(Text, nullable=False)

    download_status = Column(Text, nullable=False)
    date_downloaded = Column(DateTime, default=datetime.now)

    pdf_url = Column(Text, nullable=False)
    pdf_backup_url = Column(Text, nullable=False)

        
class User(BaseModel):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    @validates('username')
    def validate_username(self, key, username):
        if len(username) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if not re.match("^[A-Za-z0-9_]+$", username):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return username.lower()

    @validates('email')
    def validate_email(self, key, email):
        pattern = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
        if not re.match(pattern, email):
            raise ValueError("Invalid email address")
        return email
    
    @classmethod
    def create_user(cls, username, password, email, is_admin=False):
        user = cls(username=username, password=generate_password_hash(password), email=email, is_admin=is_admin)
        return user
    
    @classmethod
    async def authenticate(cls, username: str, password: str, session: AsyncSession):
        user = await session.execute(select(cls).where(cls.username == username))
        user = user.scalars().first()
        if user and user.check_password(password):
            return user
        return None
    
    def check_password(self, password):
        if not isinstance(self.password, str):
            raise ValueError("Invalid password")
        return check_password_hash(self.password, password)