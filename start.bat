@echo off
echo Starting services...

:: Launch Node app in a new window
start "Node App" cmd /k "npm run start"

:: Launch Python FastAPI backend in a new window
start "FastAPI Backend" cmd /k "cd services\python-backend && .venv\Scripts\activate && fastapi run"

echo Both services launched.