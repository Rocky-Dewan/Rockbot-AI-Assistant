#!/bin/bash

echo "=== Starting Rockbot Assistant (Development Mode) ==="

# Check if setup has been run
if [ ! -d "backend/rockbot_api/venv" ]; then
    echo "Error: Backend not set up. Please run ./setup.sh first."
    exit 1
fi

# Start backend in development mode
echo "Starting backend server..."
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
export FLASK_ENV=development
export FLASK_DEBUG=1

# Start Flask server
python src/main.py
