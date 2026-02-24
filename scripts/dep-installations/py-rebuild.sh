#!/bin/bash

# Equivalent to running npm ci for Python dependencies

echo "--- Starting Python Dependency Setup ---"

# Check if the virtual environment directory exists
if [ -d ".venv" ]; then
    echo "Virtual environment '.venv' already exists. Deleting..."
    rm -rf .venv && python3.12 -m venv .venv
fi

echo "Creating a new virtual environment..."
python3.12 -m venv .venv

if [ $? -ne 0 ]; then
    echo "Error: Failed to create virtual environment. Please ensure 'python3.12' is installed and in your PATH."
    exit 1
fi

# Activate the virtual environment
source .venv/bin/activate

# Install the dependencies from requirements.txt
echo "Installing Python packages from requirements.txt..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "Error: Failed to install Python dependencies. Please check the error messages above."
    deactivate # Deactivate environment before exiting
    exit 1
fi

deactivate
echo "--- Setup complete! ---"