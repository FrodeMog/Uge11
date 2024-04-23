@echo off

REM Check if Docker is running
docker version >nul 2>&1
IF ERRORLEVEL 1 (
    echo Docker is not running. Please start Docker and try again.
    pause
    exit /b
)

python newsetup.py