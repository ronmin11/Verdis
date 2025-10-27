@echo off
echo Starting Verdis Crop Health Assessment Application
echo ============================================================

echo.
echo Starting backend server...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
cd /d "%~dp0"

echo.
echo Starting frontend server...
cd /d "%~dp0"
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both services are starting...
echo.
echo Application URLs:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:5173

echo.
echo Services are running in separate windows.
echo Close those windows to stop the services.
echo.
pause
