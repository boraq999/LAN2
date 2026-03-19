@echo off
echo ========================================
echo   Reset Database
echo ========================================
echo.
echo This will delete the database and create a new one.
echo Default admin will be recreated: admin / admin123
echo.
pause

cd backend

echo.
echo [1/2] Deleting old database...
if exist lan-chat.db (
    del lan-chat.db
    echo Database deleted.
) else (
    echo No database found.
)

echo.
echo [2/2] Starting server to create new database...
echo Press Ctrl+C to stop after you see "Database initialized successfully"
echo.
npm start

pause
