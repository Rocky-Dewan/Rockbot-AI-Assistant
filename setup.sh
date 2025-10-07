#!/bin/bash

echo "=== Rockbot Assistant Setup ==="
echo "Setting up the complete AI assistant project..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

# Setup backend
echo "Setting up backend..."
cd backend/rockbot_api

# Create virtual environment if it doesn\'t exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    echo "Error: Virtual environment activation script not found."
    exit 1
fi
pip install --upgrade pip
pip install -r requirements.txt

echo "Backend setup complete!"

# Setup frontend
echo "Setting up frontend..."
cd ../../frontend/rockbot-ui

# Install dependencies
if command -v pnpm &> /dev/null; then
    pnpm install
else
    npm install
fi

echo "Frontend setup complete!"

# Build frontend for production
echo "Building frontend for production..."
if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi

# Copy frontend build to Flask static directory
echo "Copying frontend build to backend static directory..."
rm -rf ../../backend/rockbot_api/src/static/*
cp -r dist/* ../../backend/rockbot_api/src/static/

echo "=== Setup Complete! ==="
echo ""
echo "To run the application:"
echo "1. Development mode:"
echo "   ./run_dev.sh"
echo ""
echo "2. Production mode:"
echo "   ./run_prod.sh"
echo ""
echo "The application will be available at http://localhost:5000"