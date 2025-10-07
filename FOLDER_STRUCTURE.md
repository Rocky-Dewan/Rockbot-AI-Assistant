# Rockbot Assistant - Folder Structure

## Complete Project Structure

```
rockbot_assistant/
├── backend/                           # Backend Flask API
│   └── rockbot_api/                   # Main Flask application
│       ├── src/                       # Source code
│       │   ├── models/                # Database models
│       │   │   ├── __init__.py
│       │   │   ├── user.py            # User model (from template)
│       │   │   └── conversation.py    # Conversation and Message models
│       │   ├── routes/                # API route blueprints
│       │   │   ├── __init__.py
│       │   │   ├── user.py            # User routes (from template)
│       │   │   ├── chat.py            # Chat and conversation routes
│       │   │   ├── export.py          # Export and sharing routes
│       │   │   └── multimodal.py      # File upload and image processing
│       │   ├── services/              # Business logic services
│       │   │   ├── __init__.py
│       │   │   └── ai_service.py      # AI integration and multi-agent system
│       │   ├── static/                # Frontend build files (production)
│       │   │   ├── index.html         # Main HTML file
│       │   │   └── assets/            # CSS, JS, and other assets
│       │   ├── database/              # Database files
│       │   │   └── app.db             # SQLite database
│       │   └── main.py                # Flask application entry point
│       ├── venv/                      # Python virtual environment
│       │   ├── bin/                   # Executables
│       │   ├── lib/                   # Python packages
│       │   └── pyvenv.cfg             # Virtual environment config
│       ├── uploads/                   # Uploaded files (created at runtime)
│       └── requirements.txt           # Python dependencies
├── frontend/                          # Frontend React application
│   └── rockbot-ui/                    # React app
│       ├── src/                       # Source code
│       │   ├── components/            # React components
│       │   │   ├── ui/                # UI components (shadcn/ui)
│       │   │   │   ├── button.jsx     # Button component
│       │   │   │   ├── input.jsx      # Input component
│       │   │   │   ├── card.jsx       # Card component
│       │   │   │   ├── scroll-area.jsx # Scroll area component
│       │   │   │   ├── badge.jsx      # Badge component
│       │   │   │   └── select.jsx     # Select component
│       │   │   └── ChatInterface.jsx  # Main chat interface
│       │   ├── lib/                   # Utility functions
│       │   │   └── utils.js           # Utility functions
│       │   ├── hooks/                 # Custom React hooks
│       │   ├── assets/                # Static assets
│       │   │   └── react.svg          # React logo
│       │   ├── App.jsx                # Main App component
│       │   ├── App.css                # App styles
│       │   ├── index.css              # Global styles
│       │   └── main.jsx               # React entry point
│       ├── public/                    # Public assets
│       │   └── vite.svg               # Vite logo
│       ├── dist/                      # Production build (created by build)
│       │   ├── index.html             # Built HTML
│       │   └── assets/                # Built assets
│       ├── node_modules/              # Node.js dependencies
│       ├── package.json               # Node.js dependencies and scripts
│       ├── pnpm-lock.yaml             # Package lock file
│       ├── vite.config.js             # Vite configuration
│       ├── tailwind.config.js         # Tailwind CSS configuration
│       ├── components.json            # shadcn/ui configuration
│       ├── eslint.config.js           # ESLint configuration
│       └── index.html                 # HTML template
├── models/                            # AI models directory (for future use)
├── setup.sh                          # Setup script
├── run_dev.sh                         # Development server script
├── run_prod.sh                        # Production server script
├── README.md                          # Main documentation
├── COMMANDS.md                        # Commands reference
└── FOLDER_STRUCTURE.md                # This file
```

## File Descriptions

### Backend Files

#### Core Application
- **`src/main.py`** - Flask application entry point, configures app, registers blueprints
- **`requirements.txt`** - Python dependencies list

#### Models (`src/models/`)
- **`conversation.py`** - Database models for conversations and messages
- **`user.py`** - User model (from Flask template)

#### Routes (`src/routes/`)
- **`chat.py`** - Chat endpoints, conversation management, AI interaction
- **`export.py`** - PDF export, conversation sharing, search and filtering
- **`multimodal.py`** - File upload, image processing, multi-modal chat
- **`user.py`** - User management routes (from template)

#### Services (`src/services/`)
- **`ai_service.py`** - AI integration, multi-agent system, OpenAI API calls

### Frontend Files

#### Core Application
- **`src/App.jsx`** - Main React application component
- **`src/main.jsx`** - React entry point, renders App component
- **`index.html`** - HTML template

#### Components (`src/components/`)
- **`ChatInterface.jsx`** - Main chat interface with conversation management
- **`ui/`** - Reusable UI components from shadcn/ui library

#### Configuration
- **`package.json`** - Node.js dependencies and build scripts
- **`vite.config.js`** - Vite bundler configuration
- **`tailwind.config.js`** - Tailwind CSS configuration

### Scripts
- **`setup.sh`** - Complete project setup (backend + frontend + build)
- **`run_dev.sh`** - Start development server
- **`run_prod.sh`** - Start production server

## Directory Purposes

### `/backend/rockbot_api/`
Contains the Flask backend API that handles:
- AI model integration and multi-agent system
- Database operations for conversations and messages
- File upload and processing
- PDF generation and export
- API endpoints for frontend communication

### `/frontend/rockbot-ui/`
Contains the React frontend that provides:
- Modern chat interface
- Conversation management UI
- Agent selection and configuration
- File upload interface
- Export and sharing features

### `/models/`
Reserved for AI model files and training data (future expansion)

## Key Technologies

### Backend Stack
- **Flask** - Web framework
- **SQLAlchemy** - Database ORM
- **OpenAI API** - AI model integration
- **ReportLab** - PDF generation
- **Pillow** - Image processing

### Frontend Stack
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons

## Build Process

1. **Development**: Frontend runs on Vite dev server (port 3000), backend on Flask (port 5000)
2. **Production**: Frontend builds to `dist/`, copied to Flask `static/` directory
3. **Deployment**: Single Flask server serves both API and frontend

## Data Flow

1. **User Input** → React Frontend
2. **API Call** → Flask Backend
3. **AI Processing** → OpenAI API
4. **Database Storage** → SQLite
5. **Response** → Frontend Display

This structure provides a clean separation of concerns while maintaining simplicity for development and deployment.
