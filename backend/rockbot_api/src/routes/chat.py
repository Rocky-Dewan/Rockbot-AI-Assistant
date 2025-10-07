from flask import Blueprint, request, jsonify
from src.extensions import db
from src.models.conversation import Conversation, Message
from src.services.ai_service import rockbot_ai
import json
import asyncio
from datetime import datetime

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/conversations', methods=['GET'])
def get_conversations():
    """Get all conversations"""
    conversations = Conversation.query.order_by(Conversation.updated_at.desc()).all()
    return jsonify([conv.to_dict() for conv in conversations])

@chat_bp.route('/conversations', methods=['POST'])
def create_conversation():
    """Create a new conversation"""
    data = request.get_json()
    title = data.get('title', 'New Conversation')
    
    conversation = Conversation(title=title)
    db.session.add(conversation)
    db.session.commit()
    
    return jsonify(conversation.to_dict()), 201

@chat_bp.route('/conversations/<int:conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Get a specific conversation with messages"""
    conversation = Conversation.query.get_or_404(conversation_id)
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
    
    return jsonify({
        'conversation': conversation.to_dict(),
        'messages': [msg.to_dict() for msg in messages]
    })

@chat_bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    """Delete a conversation"""
    conversation = Conversation.query.get_or_404(conversation_id)
    db.session.delete(conversation)
    db.session.commit()
    
    return jsonify({'message': 'Conversation deleted successfully'})

@chat_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
def add_message(conversation_id):
    """Add a message to a conversation"""
    conversation = Conversation.query.get_or_404(conversation_id)
    data = request.get_json()
    
    role = data.get('role')
    content = data.get('content')
    metadata = data.get('metadata')
    
    if not role or not content:
        return jsonify({'error': 'Role and content are required'}), 400
    
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        message_metadata=json.dumps(metadata) if metadata else None
    )
    
    db.session.add(message)
    conversation.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(message.to_dict()), 201

@chat_bp.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint for AI interaction"""
    data = request.get_json()
    message = data.get('message')
    conversation_id = data.get('conversation_id')
    agent_type = data.get('agent_type')
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    # Create new conversation if not provided
    if not conversation_id:
        conversation = Conversation(title=message[:50] + "..." if len(message) > 50 else message)
        db.session.add(conversation)
        db.session.flush()
        conversation_id = conversation.id
    else:
        conversation = Conversation.query.get_or_404(conversation_id)
    
    # Add user message
    user_message = Message(
        conversation_id=conversation_id,
        role='user',
        content=message
    )
    db.session.add(user_message)
    
    # Generate AI response using the AI service
    try:
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        ai_result = loop.run_until_complete(
            rockbot_ai.generate_response(message, conversation_id, agent_type)
        )
        loop.close()
        
        ai_response = ai_result['response']
        metadata = {
            'agent_used': ai_result.get('agent_used'),
            'agent_name': ai_result.get('agent_name'),
            'capabilities': ai_result.get('capabilities'),
            'success': ai_result.get('success')
        }
        
    except Exception as e:
        ai_response = f"I apologize, but I encountered an error: {str(e)}"
        metadata = {'error': str(e), 'success': False}
    
    # Add AI response
    ai_message = Message(
        conversation_id=conversation_id,
        role='assistant',
        content=ai_response,
        message_metadata=json.dumps(metadata)
    )
    db.session.add(ai_message)
    
    conversation.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'conversation_id': conversation_id,
        'user_message': user_message.to_dict(),
        'ai_response': ai_message.to_dict()
    })

@chat_bp.route('/translate', methods=['POST'])
def translate():
    """Translation endpoint"""
    data = request.get_json()
    text = data.get('text')
    target_language = data.get('target_language')
    source_language = data.get('source_language', 'auto')
    
    if not text or not target_language:
        return jsonify({'error': 'Text and target_language are required'}), 400
    
    result = rockbot_ai.translate_text(text, target_language, source_language)
    return jsonify(result)

@chat_bp.route('/task', methods=['POST'])
def execute_task():
    """Autonomous task execution endpoint"""
    data = request.get_json()
    task_description = data.get('task_description')
    
    if not task_description:
        return jsonify({'error': 'Task description is required'}), 400
    
    result = rockbot_ai.execute_autonomous_task(task_description)
    return jsonify(result)

@chat_bp.route('/agents', methods=['GET'])
def get_agents():
    """Get available AI agents"""
    agents_info = {}
    for agent_type, agent_data in rockbot_ai.agents.items():
        agents_info[agent_type] = {
            'name': agent_data['name'],
            'capabilities': agent_data['capabilities']
        }
    
    return jsonify(agents_info)

@chat_bp.route('/conversations/<int:conversation_id>/export', methods=['GET'])
def export_conversation(conversation_id):
    """Export conversation as text for PDF generation"""
    conversation = Conversation.query.get_or_404(conversation_id)
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
    
    export_text = f"Conversation: {conversation.title}\n"
    export_text += f"Created: {conversation.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
    export_text += "=" * 50 + "\n\n"
    
    for message in messages:
        role_label = "You" if message.role == "user" else "Rockbot"
        timestamp = message.timestamp.strftime('%H:%M:%S')
        export_text += f"[{timestamp}] {role_label}: {message.content}\n\n"
    
    return jsonify({
        'conversation': conversation.to_dict(),
        'export_text': export_text
    })
