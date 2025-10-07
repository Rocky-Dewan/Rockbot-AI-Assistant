#!/bin/bash

echo "=== Starting Rockbot Assistant (Production Mode) ==="

# Check if setup has been run
if [ ! -d "backend/rockbot_api/venv" ]; then
    echo "Error: Backend not set up. Please run ./setup.sh first.
"
    exit 1
fi

# Check if frontend has been built
if [ ! -f "backend/rockbot_api/src/static/index.html" ]; then
    echo "Error: Frontend not built. Please run ./setup.sh first.
"
    exit 1
fi

# Start backend in production mode
echo "Starting production server..."
cd backend/rockbot_api

# Activate virtual environment based on OS
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    echo "Error: Virtual environment activation script not found."
    exit 1
fi

# Set environment variables
export FLASK_ENV=production
export FLASK_DEBUG=0

# Start Flask server
python src/main.py