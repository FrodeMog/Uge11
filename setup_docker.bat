@echo off

REM Check if Docker is running
docker version >nul 2>&1
IF ERRORLEVEL 1 (
    echo Docker is not running. Please start Docker and try again.
    pause
    exit /b
)

REM Run setup.py to generate .env file
python setup.py

REM Run docker-compose
docker-compose -f "docker-compose.yml" up -d --build

pause