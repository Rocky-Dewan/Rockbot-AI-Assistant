# Rockbot Assistant - Commands Reference

## Installation Commands

### Initial Setup
```bash
# Make scripts executable
chmod +x setup.sh run_dev.sh run_prod.sh

# Run complete setup
./setup.sh
```

### Manual Backend Setup
```bash
cd backend/rockbot_api
python3 -m venv venv

# Activate virtual environment based on OS
# On Windows (Git Bash):
source venv/Scripts/activate
# On Linux/macOS:
# source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### Manual Frontend Setup
```bash
cd frontend/rockbot-ui
npm install --legacy-peer-deps
# or
pnpm install --legacy-peer-deps
```

## Development Commands

### Start Development Server
```bash
./run_dev.sh
```

### Start Production Server
```bash
./run_prod.sh
```

### Frontend Development (separate terminal)
```bash
cd frontend/rockbot-ui
npm run dev
# or
pnpm run dev
```

### Backend Development (separate terminal)
```bash
cd backend/rockbot_api

# Activate virtual environment based on OS
# On Windows (Git Bash):
source venv/Scripts/activate
# On Linux/macOS:
# source venv/bin/activate

export FLASK_APP=src.main
python -m flask run
```

## Build Commands

### Build Frontend for Production
```bash
cd frontend/rockbot-ui
npm run build
# or
pnpm run build
```

### Copy Frontend to Backend
```bash
rm -rf backend/rockbot_api/src/static/*
cp -r frontend/rockbot-ui/dist/* backend/rockbot_api/src/static/
```

### Update Python Dependencies
```bash
cd backend/rockbot_api

# Activate virtual environment based on OS
# On Windows (Git Bash):
source venv/Scripts/activate
# On Linux/macOS:
# source venv/bin/activate

pip freeze > requirements.txt
```

## Database Commands

### Reset Database
```bash
cd backend/rockbot_api
rm -f src/database/app.db

# Activate virtual environment based on OS
# On Windows (Git Bash):
source venv/Scripts/activate
# On Linux/macOS:
# source venv/bin/activate

python -c "from src.main import app; from src.models.user import db; from src.models.conversation import Conversation, Message; app.app_context().push(); db.create_all()"
```

## Testing Commands

### Test Backend API
```bash
cd backend/rockbot_api

# Activate virtual environment based on OS
# On Windows (Git Bash):
source venv/Scripts/activate
# On Linux/macOS:
# source venv/bin/activate

python -c "import requests; print(requests.get('http://localhost:5000/api/agents').json())"

```

### Test Frontend Build
```bash
cd frontend/rockbot-ui
npm run preview
# or
pnpm run preview
```

## Deployment Commands

### Install Dependencies Only
```bash
# Backend
cd backend/rockbot_api
# On Windows (Git Bash):
source venv/Scripts/activate
# On Linux/macOS:
# source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend/rockbot-ui && npm install --legacy-peer-deps
```

### Quick Deploy
```bash
# Build and deploy in one command
cd frontend/rockbot-ui && npm run build && cd ../../ && cp -r frontend/rockbot-ui/dist/* backend/rockbot_api/src/static/
```

## Maintenance Commands

### Clean Build Files
```bash
# Clean frontend build
rm -rf frontend/rockbot-ui/dist

# Clean backend static files
rm -rf backend/rockbot_api/src/static/*

# Clean Python cache
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -name "*.pyc" -delete
```

### Update Dependencies
```bash
# Update Python packages
cd backend/rockbot_api

# Activate virtual environment based on OS
# On Windows (Git Bash):
source venv/Scripts/activate
# On Linux/macOS:
# source venv/bin/activate

pip install --upgrade pip
pip list --outdated
pip install --upgrade package_name

# Update Node packages
cd frontend/rockbot-ui
npm update
# or
pnpm update
```

## Environment Setup

### Set Environment Variables
```bash
# Create .env file
cat > backend/rockbot_api/.env << EOF
OPENAI_API_KEY=your_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1
FLASK_ENV=development
FLASK_DEBUG=1
EOF
```

### Export Environment Variables
```bash
export OPENAI_API_KEY="your_api_key_here"
export OPENAI_API_BASE="https://api.openai.com/v1"
export FLASK_ENV="development"
export FLASK_DEBUG="1"
```

## Troubleshooting Commands

### Check Python Environment
```bash
cd backend/rockbot_api

# Activate virtual environment based on OS
# On Windows (Git Bash):
source venv/Scripts/activate
# On Linux/macOS:
# source venv/bin/activate

python --version
pip list
```

### Check Node Environment
```bash
cd frontend/rockbot-ui
node --version
npm --version
npm list
```

### Check Running Processes
```bash
# Check if Flask is running
ps aux | grep python
lsof -i :5000

# Check if Node dev server is running
ps aux | grep node
lsof -i :3000
```

### Kill Running Servers
```bash
# Kill Flask server
pkill -f "python src/main.py"

# Kill Node dev server
pkill -f "vite"
```

## File Structure Commands

### View Project Structure
```bash
tree rockbot_assistant -I \'node_modules|venv|dist|__pycache__|*.pyc\'
```

### Check File Sizes
```bash
du -sh rockbot_assistant/*
du -sh backend/rockbot_api/src/static/*
```

### Backup Project
```bash
tar -czf rockbot_backup_$(date +%Y%m%d).tar.gz rockbot_assistant --exclude=\'node_modules\' --exclude=\'venv\' --exclude=\'dist\' --exclude=\'__pycache__\'
```
