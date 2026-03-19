@echo off
echo ========================================
echo   Create Test User
echo ========================================
echo.
echo This will create a test user:
echo   Username: test
echo   Password: test123
echo   Role: user
echo.
pause

cd backend
node create-test-user.js

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo You can now login at: http://localhost:5173
echo   Username: test
echo   Password: test123
echo.
pause
