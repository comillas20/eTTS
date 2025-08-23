@echo off
echo Running Python dependency installer...

rem Activate the virtual environment
call .venv\Scripts\activate.bat

rem Check if activation was successful
if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to activate virtual environment.
    exit /b 1
)

rem Use the native %* variable to install all packages passed as arguments
python -m pip install %*
if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to install packages.
    exit /b 1
)

rem Update the requirements.txt file
python -m pip freeze > requirements.txt
echo.
echo Successfully updated requirements.txt.