# eTTS

## Prerequisites & System Dependencies

### Install the usual softwares:
    - Git
    - Node.js
    - PostgreSQL

### Installing these extras for the PDF parsing feature:
    - Python
    - uv — A Python package manager

## Initial Local Setup (First Time Only)

### Clone this Repository

### Configure Environment Variables
    - Copy .env.example to .env in the root directory (for Next.js).

## Install Frontend Dependencies
    From the root of the project:

    ```
    npm install
    ```
    
## Install Backend Dependencies

    ```
    cd services/python-backend
    uv sync
    ```

## Editor Integration Pro-Tips (VS Code)
To make your code editor understand your isolated environments properly:
**Python**: Open a Python file inside services/python-backend/. Press Ctrl+Shift+P, search for "Python: Select Interpreter", and choose the interpreter path ending in services/python-backend/.venv/bin/python (or Scripts\\python.exe on Windows). This ensures auto-complete, linting, and types work seamlessly.
