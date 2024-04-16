from fastapi import FastAPI, HTTPException, status, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, APIKeyHeader
from fastapi.staticfiles import StaticFiles
from fastapi import BackgroundTasks

from db_pydantic_classes import *
from db_classes import *
from db_connect import DatabaseConnect
from db_utils import DatabaseUtils
from db_download_manager import DownloadManager

import asyncio
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.future import select
from sqlalchemy import update

from sqlalchemy.ext.asyncio import AsyncSession

from jose import JWTError, jwt
from passlib.context import CryptContext

from datetime import datetime, timedelta
import json
from typing import List
import os
import time
import uuid

import uvicorn
#uvicorn main:app --reload
#npx create-react-app storage-app
#http://localhost:8000/docs

with open('jwt_info.json') as f:
    jwt_info = json.load(f)

SECRET_KEY = jwt_info['secret_key']
ALGORITHM = jwt_info['algorithm']
ACCESS_TOKEN_EXPIRE_MINUTES = jwt_info['access_token_expire_minutes']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
API_KEY_NAME = "User_Authentication"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)
directory = "pdf-files"

app = FastAPI()

# Check if the directory exists
if not os.path.exists(directory):
    # If the directory doesn't exist, create it
    os.makedirs(directory)

# Mount the directory
app.mount("/pdf-files", StaticFiles(directory=directory), name="pdf-files")

origins = [
    "http://localhost:3000",  # React's default port
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_db():
    db_connect = await DatabaseConnect.connect_from_config()
    session = await db_connect.get_new_session()
    try:
        yield session
    finally:
        await db_connect.close()

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_db)):
    user = await User.authenticate(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "is_admin": user.is_admin}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = (await session.execute(select(User).where(User.username == token_data.username))).scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin == "True":
        raise HTTPException(status_code=403, detail="User is not an admin")
    return current_user

@app.post("/users/create", response_model=UserResposne)
async def create_user(user: UserBase, session: AsyncSession = Depends(get_db)):
    existing_user = await User.check_if_exists(session, field="username", value=user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    existing_user = await User.check_if_exists(session, field="email", value=user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    try:
        result = await User.create_user(session=session, **user.dict())
        return UserResposne.from_orm(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/create/admin", response_model=UserAdminResponse)
async def create_admin_user(user: UserAdmin, current_user: User = Depends(get_current_admin_user), session: AsyncSession = Depends(get_db)):
    existing_user = await User.check_if_exists(session, field="username", value=user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    existing_user = await User.check_if_exists(session, field="email", value=user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    try:
        result = await User.create_user(session=session, **user.dict())
        return UserAdminResponse.from_orm(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/pdfs", response_model=List[GRIPdfBase])
async def get_pdfs(session: AsyncSession = Depends(get_db)):
    result = await GRIPdf.get_all(session)
    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail="No PDFs found")
    
@app.get("/pdfs/brnumber/{brnumber}", response_model=GRIPdfBase)
async def get_by_brnumber(brnumber: str, session: AsyncSession = Depends(get_db)):
    result = await GRIPdf.get_by_brnumber(session, brnumber)
    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail="PDF not found")
    
@app.get("/pdfs/id/{id}", response_model=GRIPdfBase)
async def get_pdf(id: int, session: AsyncSession = Depends(get_db)):
    result = await GRIPdf.get_by_id(session, id)
    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail="PDF not found")

@app.get("/pdfs/field_value/{field}/{value}", response_model=List[GRIPdfBase])
async def get_pdf_by_field_value(field: str, value: str, session: AsyncSession = Depends(get_db)):
    result = await GRIPdf.get_by_field_value(session, field, value)
    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail="PDF not found")
    
@app.get("/pdfs/brnumber/{brnumber}/pdf_file")
async def get_pdf_file(brnumber: str, response_type: str = "download", current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    result = await GRIPdf.get_by_brnumber(session, brnumber)
    if result:
        if response_type == "local":
            file_path = f"{result.file_folder}/{result.file_name}"
            return f"file://{file_path}"
        elif response_type == "link":
            return {"pdf_url": result.pdf_url, "pdf_backup_url": result.pdf_backup_url}
        elif response_type == "download":
            if not result.file_name:
                raise HTTPException(status_code=404, detail="PDF file not found")
            if not os.path.exists(f"{result.file_folder}/{result.file_name}"):
                raise HTTPException(status_code=404, detail="PDF file not found")
            if not result.download_status == "TRUE":
                raise HTTPException(status_code=404, detail="PDF file not downloaded")
            return FileResponse(
                path=f"{result.file_folder}/{result.file_name}",
                media_type='application/pdf',
                headers={"Content-Disposition": f"attachment; filename={result.file_name}"}
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid response_type")
    else:
        raise HTTPException(status_code=404, detail="brnumber not found")

executor = ThreadPoolExecutor(max_workers = os.cpu_count() or 1)
async def download_task(dm: DownloadManager, start_row: int, num_rows: int, task_id: str, session: AsyncSession):
    loop = asyncio.get_event_loop()
    results = await loop.run_in_executor(executor, lambda: dm.start_download(start_row, num_rows))
    results_json = json.dumps(results)
    end_time = datetime.now()
    stmt = (
        update(RunningTask).
        where(RunningTask.task_id == task_id).
        values(status="finished", results=results_json, end_time=end_time)
    )
    await session.execute(stmt)
    await session.commit()

@app.post("/start_download/{start_row}/{num_rows}")
async def start_download(start_row: int, num_rows: int, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_admin_user), session: AsyncSession = Depends(get_db)):
    if not current_user.is_admin == "True":
        raise HTTPException(status_code=403, detail="User is not an admin")
    try:
        db_dm = DownloadManager(folder='pdf-files', file_with_urls='GRI_2017_2020.xlsx')
        task_id = str(uuid.uuid4())
        new_task = RunningTask(
            task_id=task_id,
            name="Download Task",
            status="running",
            start_time=datetime.now(),
            start_row=start_row,
            num_rows=num_rows
        )
        session.add(new_task)
        await session.commit()
        background_tasks.add_task(download_task, db_dm, start_row, num_rows, task_id, session)
        return {"message": "Download started", "task_id": task_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download_results/{task_id}")
async def get_download_results(task_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(RunningTask).where(RunningTask.task_id == task_id))
    task = result.scalars().first()
    if not task:
        return {"message": "No such task"}
    if task.status == "running":
        return {
            "status": "running",
            "start_time": task.start_time,
            "running_time": datetime.now() - task.start_time,
            "start_row": task.start_row,
            "num_rows": task.num_rows
        }
    elif task.status == "finished":
        results = task.results
        await session.commit()
        return {
            "status": "finished",
            "start_time": task.start_time,
            "running_time": task.end_time - task.start_time,
            "start_row": task.start_row,
            "num_rows": task.num_rows,
            "results": json.loads(results)
        }

db_utils = DatabaseUtils()
#db_utils.reset_and_setup_db()
db_utils.setup_db()
#db_utils.extract_table_as_csv(User, "users.csv")
#db_utils.extract_table_as_csv(GRIPdf, "gri_pdfs.csv")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)