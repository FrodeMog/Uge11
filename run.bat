@echo off
setlocal

echo Loading environment variables...
for /f "delims== tokens=1,*" %%a in (.env) do set %%a=%%b

echo Activating virtual environment...
call .venv\Scripts\activate

echo Launching API service...
start cmd /k "cd %~dp0back-end && uvicorn main:app --reload"

echo Opening API documentation in the default browser...
start http://localhost:8000/docs

echo Launching React Front-end...
start cmd /k "cd %~dp0front-end\pdf-app && npm start"

pause

endlocal