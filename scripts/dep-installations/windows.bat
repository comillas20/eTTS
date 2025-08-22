@echo off
echo --- Starting Python Dependency Setup ---

rem Check if the virtual environment directory exists
if exist .venv (
    echo Virtual environment '.venv' already exists. Deleting...
    rmdir /s /q .venv
)

echo Creating a new virtual environment...
python -m venv .venv
if %errorlevel% neq 0 (
    echo Error: Failed to create virtual environment. Please ensure 'python' is in your PATH.
    pause
    exit /b 1
)

rem Activate the virtual environment
call .venv\Scripts\activate

rem Install the dependencies from requirements.txt
echo Installing Python packages from requirements.txt...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo Error: Failed to install Python dependencies. Please check the error messages above.
    pause
    exit /b 1
)

deactivate
echo --- Setup complete! ---