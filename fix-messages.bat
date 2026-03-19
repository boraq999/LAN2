@echo off
echo ========================================
echo   Fix Old Messages
echo ========================================
echo.
echo This will fix sender names in old messages.
echo.
pause

cd backend
node fix-messages.js

echo.
pause
