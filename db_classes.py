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

def error_handler_sync(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
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
    async def get_by_field_value(cls, session, field, value, comparison: str = 'eq', order: str = 'asc'):
        field = field.lower()
        if not hasattr(cls, field):
            raise HTTPException(status_code=400, detail=f"Invalid field: {field}")
        
        comparison_mapping = {
            'eq': getattr(cls, field) == value,
            'gt': getattr(cls, field) > value,
            'lt': getattr(cls, field) < value,
            'gte': getattr(cls, field) >= value,
            'lte': getattr(cls, field) <= value,
            'ne': getattr(cls, field) != value,
        }
        comparison_descriptions = {
            'eq': 'equal',
            'gt': 'greater than',
            'lt': 'less than',
            'gte': 'greater than or equal to',
            'lte': 'less than or equal to',
            'ne': 'not equal',
        }
        
        order_mapping = {
            'asc': getattr(cls, field).asc(),
            'desc': getattr(cls, field).desc()
        }
        order_descriptions = {
            'asc': 'ascending',
            'desc': 'descending',
        }
        
        if comparison not in comparison_mapping:
            raise HTTPException(status_code=400, detail=f"Invalid comparison operator: {comparison}, Valid values are: {', '.join(f'{k}={v}' for k, v in comparison_descriptions.items())}")
        if order not in order_mapping:
            raise HTTPException(status_code=400, detail=f"Invalid order: {order}, Valid values are: {', '.join(f'{k}={v}' for k, v in order_descriptions.items())}")
        
        query = select(cls).where(comparison_mapping[comparison])
        if order == 'asc':
            query = query.order_by(getattr(cls, field))
        elif order == 'desc':
            query = query.order_by(desc(getattr(cls, field)))
        
        result = await session.execute(query)
        results = result.scalars().all()

        if not results:
            raise HTTPException(status_code=404, detail=f"No {cls.__name__} found with field {field} {comparison_descriptions[comparison]} {value}")
        return results

    @classmethod
    # Dont user error_handler decorator here
    async def check_if_exists(cls, session, field, value):
        query = select(cls).where(getattr(cls, field) == value)
        result = await session.execute(query)
        return result.scalars().first()

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
    
    @classmethod
    @error_handler
    async def get_by_id(cls, session, id):
        result = (await session.execute(select(cls).where(cls.id == id))).scalar_one_or_none()
        if result is None:
            raise HTTPException(status_code=404, detail=f"No {cls.__name__} found with id {id}")
        return result

    @classmethod
    @error_handler
    async def get_all(cls, session):
        result = (await session.execute(select(cls))).scalars().all()
        if not result:
            raise HTTPException(status_code=404, detail=f"No {cls.__name__} found")
        return result
    
class RunningTask(BaseModel):
    __tablename__ = 'running_tasks'

    task_id = Column(String(36), primary_key=True)  # UUIDs 
    name = Column(String(50), nullable=False)
    status = Column(String(10), nullable=False)
    start_time = Column(DateTime, default=datetime.now)

    start_row = Column(Integer, nullable=False)
    num_rows = Column(Integer, nullable=False)

    results = Column(Text, nullable=True)

        
class GRIPdf(BaseModel):
    __tablename__ = 'GRIPdfs'

    id = Column(Integer, primary_key=True, nullable=False)
    brnumber = Column(String(50), nullable=False, unique=True)
    title = Column(Text, nullable=True)
    file_name = Column(Text, nullable=True)
    file_folder = Column(Text, nullable=True)
    publication_year = Column(Text, nullable=True)
    organization_name = Column(Text, nullable=True)
    organization_type = Column(Text, nullable=True)
    organization_sector = Column(Text, nullable=True)
    country = Column(Text, nullable=True)
    region = Column(Text, nullable=True)

    download_status = Column(Text, nullable=False)
    download_message = Column(Text, nullable=True)
    download_attempt_date = Column(DateTime, default=datetime.now)

    pdf_url = Column(Text, nullable=True)
    pdf_backup_url = Column(Text, nullable=True)
    
    @classmethod
    @error_handler_sync
    def process_row(cls, session, row, file_name, file_folder, download_status, download_message=None):
        data = {
            'brnumber': row['BRnum'],
            'title': row['Title'],
            'file_name': file_name,
            'file_folder': file_folder,
            'publication_year': row['Publication Year'],
            'organization_name': row['Name'],
            'organization_type': row['Organization type'],
            'organization_sector': row['Sector'],
            'country': row['Country'],
            'region': row['Region'],
            'pdf_url': row['Pdf_URL'],
            'pdf_backup_url': row['Report Html Address'],
            'download_status': download_status,
            'download_message': download_message,
            'download_attempt_date': datetime.now(),
        }
    
        pdf = cls.upsert(session, **data)
        return pdf
    
    @classmethod
    @error_handler
    async def get_by_brnumber(cls, session, brnumber):
        result = (await session.execute(select(cls).where(cls.brnumber == brnumber))).scalar_one_or_none()
        if result is None:
            raise HTTPException(status_code=404, detail=f"No {cls.__name__} found with BRnumber {brnumber}")
        return result
    
    @classmethod
    @error_handler_sync
    def upsert(cls, session, brnumber=None, **kwargs):
        if brnumber:
            # Query the database for a record with the specified BRnumber
            pdf = session.query(cls).filter_by(brnumber=brnumber).first()
            if pdf:
                # If such a record exists, get its id
                id = pdf.id
                return cls.update(session, brnumber, **kwargs)
        # If no such record exists, insert a new one
        kwargs['brnumber'] = brnumber
        return cls.add(session, **kwargs)
    
    @classmethod
    @error_handler_sync
    def update(cls, session, brnumber, **kwargs):
        pdf = session.query(cls).filter_by(brnumber=brnumber).first()
        if pdf is not None:
            for key, value in kwargs.items():
                setattr(pdf, key, value)
            session.commit()
            return pdf

    @classmethod
    @error_handler_sync
    def add(cls, session, **kwargs):
        pdf = cls(**kwargs)
        session.add(pdf)
        session.commit()
        return pdf
        
class User(BaseModel):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    is_admin = Column(String(10), default="False")
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
    @error_handler
    async def create_user(cls, session, username, password, email, is_admin="False"):
        user = cls(username=username, password=generate_password_hash(password), email=email, is_admin=is_admin)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user
    
    @classmethod
    @error_handler
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
