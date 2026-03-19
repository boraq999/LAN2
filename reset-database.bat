@echo off
echo ========================================
echo   Reset Database
echo ========================================
echo.
echo WARNING: This will delete ALL data!
echo   - All users (except admin)
echo   - All messages
echo   - All groups
echo   - All activity logs
echo.
echo Default admin will be recreated:
echo   Username: admin
echo   Password: admin123
echo.
set /p confirm="Are you sure? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo.
    echo Cancelled.
    pause
    exit
)

echo.
echo Resetting database...
cd backend
node reset-database.js

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo You can now run: start.bat
echo.
pause
