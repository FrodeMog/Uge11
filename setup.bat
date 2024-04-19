@echo off
setlocal enabledelayedexpansion

echo Welcome to the setup script (THIS IS A DEBUG TEST BUILD NOT FOR PRODUCTION).
echo.

cd /d %~dp0

set /p mode=Do you want to use local setup, easier for debug (Y/N)? 
if /i "%mode%"=="Y" (
    echo Using local setup.
    echo LOCAL_DB_MODE=True > .env
    echo LOCAL_DB_ASYNC_ENGINE=sqlite >> .env
    echo LOCAL_DB_ASYNC_ADAPTER=aiosqlite >> .env
    echo LOCAL_DB_ENGINE=sqlite >> .env
    echo LOCAL_DB_NAME=pdf_system.db >> .env
) else if /i "%mode%"=="N" (
    echo Using non-local setup.
    echo ENGINE=mysql > .env
    echo ADAPTER=pymysql >> .env
    echo ASYNC_ADAPTER=aiomysql >> .env
    set /p us=Please enter your MySQL username: 
    echo USERNAME=!us! >> .env
    set /p ps=Please enter your MySQL password: 
    echo PASSWORD=!ps! >> .env
    echo DB_NAME=pdf_system >> .env
    echo TEST_DB_NAME=test_pdf_system >> .env
    echo HOSTNAME=localhost >> .env
    echo LOCAL_DB_MODE=False >> .env
) else (
    echo Invalid option. Please run the script again and choose either local or non-local.
    exit /b
)

set /p secret=Please enter your secret key for the API: 
echo SECRET_KEY=!secret! >> .env
echo ALGORITHM=HS256 >> .env
echo ACCESS_TOKEN_EXPIRE_MINUTES=60 >> .env

echo.
echo .env file has been set up successfully.

echo Setting up Python environment...
call python -m venv .venv
call .venv\Scripts\activate
call pip install -r requirements.txt

echo Installing npm at app location...
cd %~dp0front-end\pdf-app
call npm install

echo Launching API service...
start cmd /k "cd %~dp0 && uvicorn main:app --reload"

echo Opening API documentation in the default browser...
start http://localhost:8000/docs

echo Launching React Front-end...
start cmd /k "cd %~dp0front-end\pdf-app && npm start"

pause

endlocal