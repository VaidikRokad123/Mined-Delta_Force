@echo off
cls
echo ===================================================
echo   PetPooja Rebuild ^& Rerun Manager
echo ===================================================
echo.
echo [1] Rebuild ^& Run with Docker Compose (Recommended)
echo [2] Install Dependecies Locally (Backend ^& Frontend)
echo [3] Exit
echo.
set /p opt="Select an option (1-3): "

if "%opt%"=="1" goto DOCKER
if "%opt%"=="2" goto LOCAL
if "%opt%"=="3" goto EXIT

:DOCKER
echo.
echo [Docker] Stopping active containers...
docker-compose down
echo [Docker] Rebuilding and launching containers in background...
docker-compose up --build -d
echo.
echo [Docker] Success!
echo - Frontend Nginx Portal: http://localhost:5173
echo - Backend API Endpoint:  http://localhost:3001
echo.
echo To view live logs, run: docker-compose logs -f
echo.
pause
goto EXIT

:LOCAL
echo.
echo [Local] Cleaning existing node_modules...
if exist "backend\node_modules" (
    echo Removing backend node_modules...
    rmdir /S /Q "backend\node_modules"
)
if exist "frontend\node_modules" (
    echo Removing frontend node_modules...
    rmdir /S /Q "frontend\node_modules"
)

echo [Local] Installing backend dependencies...
cd backend
call npm install
cd ..

echo [Local] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [Local] Done installing. To run locally, run:
echo - 'npm run dev' inside backend/
echo - 'npm run dev' inside frontend/
echo.
pause
goto EXIT

:EXIT
exit
