#!/bin/bash

echo "--- Starting Python Dependency Setup ---"

# Check if the virtual environment directory exists
if [ ! -d ".venv" ]; then
    echo "Creating a new virtual environment..."
    python3 -m venv .venv

    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment. Please ensure 'python3' is installed and in your PATH."
        exit 1
    fi
else
    echo "Virtual environment '.venv' already exists. Skipping creation."
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
echo "To run your Python script, first activate the environment by running:"
echo "source .venv/bin/activate"