#!/bin/bash

# Equivalent to running npm install [package] for Python

echo "Running Python dependency installer..."

# Activate the virtual environment
source .venv/bin/activate

# Check if activation was successful
if [ $? -ne 0 ]; then
    echo ""
    echo "Error: Failed to activate virtual environment."
    exit 1
fi

# Use the "$@" variable to install all packages passed as arguments
python -m pip install "$@"
if [ $? -ne 0 ]; then
    echo ""
    echo "Error: Failed to install packages."
    exit 1
fi

# Update the requirements.txt file
python -m pip freeze > requirements.txt
echo ""
echo "Successfully updated requirements.txt."