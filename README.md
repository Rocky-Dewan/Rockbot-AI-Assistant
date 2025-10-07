# Rockbot - AI Assistant

A comprehensive AI assistant project with advanced features including Q&A, content generation, translation, autonomous task execution, multi-agent architecture, multi-modal processing, adaptive learning, real-time interaction, conversation sharing and PDF export capabilities.

## Features

### Core AI Capabilities
- **Multi-Agent Architecture**: Specialized agents for different tasks (General, Translator, Creative Writer, Problem Solver, Task Executor)
- **Question Answering**: Intelligent responses to user queries
- **Content Generation**: Creative writing, brainstorming, and idea generation
- **Translation**: Multi-language translation capabilities
- **Autonomous Task Execution**: Step-by-step task planning and execution
- **Adaptive Learning**: Conversation memory and context awareness

### User Interface
- **Real-time Chat Interface**: Modern, responsive chat UI built with React
- **Conversation Management**: Create, save, and manage multiple conversations
- **Agent Selection**: Choose specific AI agents for different tasks
- **Mobile-Friendly**: Responsive design for desktop and mobile devices

### Advanced Features
- **Multi-Modal Processing**: Image upload and analysis using OpenAI Vision API
- **Document Processing**: Support for various file formats (PDF, text, images)
- **Conversation Export**: Export conversations as PDF or text files
- **Conversation Sharing**: Share conversations with others
- **Search and Filter**: Find conversations by content or date

## Project Structure

```
rockbot_assistant/
├── backend/                    # Flask backend API
│   └── rockbot_api/
│       ├── src/
│       │   ├── models/         # Database models
│       │   │   ├── user.py
│       │   │   └── conversation.py
│       │   ├── routes/         # API endpoints
│       │   │   ├── user.py
│       │   │   ├── chat.py
│       │   │   ├── export.py
│       │   │   └── multimodal.py
│       │   ├── services/       # AI service integration
│       │   │   └── ai_service.py
│       │   ├── static/         # Frontend build files
│       │   └── main.py         # Flask application entry point
│       ├── venv/               # Python virtual environment
│       └── requirements.txt    # Python dependencies
├── frontend/                   # React frontend
│   └── rockbot-ui/
│       ├── src/
│       │   ├── components/     # React components
│       │   │   ├── ui/         # UI components (shadcn/ui)
│       │   │   └── ChatInterface.jsx
│       │   ├── App.jsx         # Main App component
│       │   └── main.jsx        # React entry point
│       ├── package.json        # Node.js dependencies
│       └── dist/               # Production build
├── models/                     # AI models directory
├── setup.sh                   # Setup script
├── run_dev.sh                  # Development server script
├── run_prod.sh                 # Production server script
└── README.md                   # This file
```

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or pnpm package manager

### Quick Setup

1. **Clone or download the project**
   ```bash
   # If you have the project files, navigate to the directory
   cd rockbot_assistant
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   This script will:
   - Set up the Python virtual environment
   - Install backend dependencies
   - Install frontend dependencies
   - Build the frontend for production
   - Copy frontend files to the Flask static directory

### Manual Setup

If you prefer to set up manually:

1. **Backend Setup**
   ```bash
   cd backend/rockbot_api
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Frontend Setup**
   ```bash
   cd frontend/rockbot-ui
   npm install  # or pnpm install
   npm run build  # or pnpm run build
   ```

3. **Copy Frontend Build**
   ```bash
   cp -r frontend/rockbot-ui/dist/* backend/rockbot_api/src/static/
   ```

## Configuration

### Environment Variables

Create a `.env` file in the `backend/rockbot_api` directory with:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1
FLASK_ENV=development
FLASK_DEBUG=1
```

**Note**: The OpenAI API key is required for AI functionality. Get your API key from [OpenAI Platform](https://platform.openai.com/).

## Running the Application

### Development Mode
```bash
./run_dev.sh
```

### Production Mode
```bash
./run_prod.sh
```

The application will be available at `http://localhost:5000`

## API Endpoints

### Chat Endpoints
- `POST /api/chat` - Send message to AI
- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/{id}` - Get specific conversation
- `DELETE /api/conversations/{id}` - Delete conversation

### AI Agent Endpoints
- `GET /api/agents` - Get available AI agents
- `POST /api/translate` - Translate text
- `POST /api/task` - Execute autonomous task

### Export Endpoints
- `GET /api/conversations/{id}/export` - Export conversation as text
- `GET /api/conversations/{id}/pdf` - Export conversation as PDF
- `POST /api/conversations/{id}/share` - Create shareable link

### Multi-Modal Endpoints
- `POST /api/upload` - Upload and process files
- `POST /api/analyze-image` - Analyze image with custom prompt
- `POST /api/chat-with-image` - Chat about uploaded image

## Usage Examples

### Basic Chat
```javascript
// Send a message to the AI
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Hello, how are you?",
    agent_type: "general"
  })
});
```

### Translation
```javascript
// Translate text
const response = await fetch('/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Hello world",
    target_language: "Spanish"
  })
});
```

### Task Execution
```javascript
// Execute autonomous task
const response = await fetch('/api/task', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task_description: "Plan a birthday party for 20 people"
  })
});
```

## AI Agents

### Available Agents

1. **General Assistant** (`general`)
   - Capabilities: Q&A, explanation, general knowledge
   - Best for: General questions and conversations

2. **Translator** (`translator`)
   - Capabilities: Translation, language detection
   - Best for: Multi-language communication

3. **Creative Writer** (`creative`)
   - Capabilities: Creative writing, brainstorming, storytelling
   - Best for: Creative projects and idea generation

4. **Problem Solver** (`problem_solver`)
   - Capabilities: Problem solving, logical reasoning, step-by-step guidance
   - Best for: Complex problem analysis

5. **Task Executor** (`task_executor`)
   - Capabilities: Task planning, autonomous execution, project management
   - Best for: Planning and organizing tasks

## Development

### Adding New Features

1. **Backend**: Add new routes in `src/routes/`
2. **Frontend**: Add new components in `src/components/`
3. **AI Services**: Extend `src/services/ai_service.py`

### Database Models

The application uses SQLite with SQLAlchemy ORM:
- `Conversation`: Stores conversation metadata
- `Message`: Stores individual messages with role and content

### Frontend Components

Built with React and modern UI components:
- Tailwind CSS for styling
- shadcn/ui for UI components
- Lucide React for icons

## Deployment

### Local Deployment
Use the provided scripts for easy local deployment.

### Production Deployment
For production deployment:
1. Set up a proper WSGI server (e.g., Gunicorn)
2. Configure environment variables
3. Set up a reverse proxy (e.g., Nginx)
4. Use a production database (e.g., PostgreSQL)

## Troubleshooting

### Common Issues

1. **OpenAI API Key Error**
   - Ensure your API key is set in environment variables
   - Check API key validity and billing status

2. **Database Errors**
   - Delete `src/database/app.db` and restart to reset database
   - Check file permissions

3. **Frontend Build Issues**
   - Clear node_modules and reinstall dependencies
   - Check Node.js version compatibility

4. **Port Already in Use**
   - Change port in `src/main.py` or kill existing processes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the Apache License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check console logs for error details

---

**Rockbot** - Your intelligent AI assistant for every task.



