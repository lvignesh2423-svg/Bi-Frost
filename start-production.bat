@echo off
echo ==========================================
echo   AI Skill Gap Analyzer - Production Build
echo ==========================================
echo.

echo Building Frontend...
cd /d %~dp0frontend
call npx vite build
cd ..

echo.
echo Starting Production Server on port 8001...
cd /d %~dp0backend
..\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001

pause
