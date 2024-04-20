@echo off
setlocal enabledelayedexpansion

echo Welcome to the setup script (THIS IS A DEBUG TEST BUILD NOT FOR PRODUCTION).
echo.

cd /d %~dp0

set /p mode=Do you want to use local.db setup, easier for debug (Y/N)? 
if /i "%mode%"=="Y" (
    echo Using local.db setup.
    echo LOCAL_DB_MODE=True>.env
    echo LOCAL_DB_ASYNC_ENGINE=sqlite>>.env
    echo LOCAL_DB_ASYNC_ADAPTER=aiosqlite>>.env
    echo LOCAL_DB_ENGINE=sqlite>>.env
    echo LOCAL_DB_NAME=pdf_system.db>>.env
) else if /i "%mode%"=="N" (
    echo Using MySQL setup.
    echo ENGINE=mysql>.env
    echo ADAPTER=pymysql>>.env
    echo ASYNC_ADAPTER=aiomysql>>.env
    set /p us=Please enter your MySQL username: 
    echo USERNAME=!us!>>.env
    set /p ps=Please your MySQL password: 
    echo PASSWORD=!ps!>>.env
    echo DB_NAME=pdf_system>>.env
    echo TEST_DB_NAME=test_pdf_system>>.env
    set /p hn=Please enter your MySQL hostname usually: localhost:
    echo MYSQL_HOSTNAME=!hn!>>.env
    set /p pt=Please enter your MySQL port usually: 3306:
    echo MYSQL_PORT=!pt!>>.env
    echo LOCAL_DB_MODE=False>>.env
) else (
    echo Invalid option. Please run the script again and choose either Y or N.
    pause
    exit /b
)

set /p secret=Please enter a secret key for the API. This will be the secret key used for JWT token generation and validation: 
echo SECRET_KEY=!secret!>>.env
echo ALGORITHM=HS256>>.env
set /p expiry=Do you want to change the default expiry time of the access token from 7 days (Y/N)? 
if /i "!expiry!"=="Y" (
    set /p customExpiry=Please enter the new expiry time in minutes: 
    echo ACCESS_TOKEN_EXPIRE_MINUTES=!customExpiry!>>.env
)
if /i "!expiry!"=="N" (
    echo ACCESS_TOKEN_EXPIRE_MINUTES=10080>>.env
)
if /i not "!expiry!"=="Y" if /i not "!expiry!"=="N" (
    echo Invalid option. Using the default expiry time of 7 days.
    echo ACCESS_TOKEN_EXPIRE_MINUTES=10080>>.env
)

echo.
echo .env file has been set up successfully.

echo Setting up Python environment...
call python -m venv .venv
call .venv\Scripts\activate
call pip install -r requirements.txt

echo Installing npm at app location...
cd %~dp0front-end\pdf-app
call npm install

endlocal