@echo off
echo ========================================
echo   LAN Chat Application Launcher
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Application Started!
echo ========================================
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo ========================================
echo.
pause
