@echo off
echo ========================================
echo   Update Database Schema
echo ========================================
echo.
echo This will add the room_type column to your database.
echo Your existing data will be preserved.
echo.
pause

cd backend
node update-database.js

echo.
pause
