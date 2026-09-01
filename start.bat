@echo off
echo ==========================================
echo   AI Skill Gap Analyzer - Starting...
echo ==========================================
echo.

REM Start Backend
echo Starting Backend (port 8001)...
start "SkillGap Backend" cmd /k "cd /d %~dp0backend && ..\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001"

REM Wait for backend
timeout /t 3 /nobreak >nul

REM Start Frontend Dev Server
echo Starting Frontend (port 5173)...
start "SkillGap Frontend" cmd /k "cd /d %~dp0frontend && npx vite"

echo.
echo ==========================================
echo   Backend:  http://localhost:8001
echo   Frontend: http://localhost:5173
echo ==========================================
echo.
pause
