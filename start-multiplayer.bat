@echo off
echo ========================================
echo   Sonor Online Multiplayer Launcher
echo ========================================
echo.

REM Check if server dependencies are installed
if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
    echo.
)

echo Starting server...
start "Sonor Server" cmd /k "cd server && npm start"

timeout /t 3 /nobreak >nul

echo Starting client...
start "Sonor Client" cmd /k "npm run dev"

echo.
echo ========================================
echo   Both server and client are starting!
echo ========================================
echo.
echo Server: http://localhost:3001
echo Client: http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul
