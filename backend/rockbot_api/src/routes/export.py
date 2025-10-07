from flask import Blueprint, request, jsonify, send_file
from src.models.conversation import db, Conversation, Message
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import os
import tempfile
from datetime import datetime

export_bp = Blueprint("export", __name__)

@export_bp.route("/conversations/<int:conversation_id>/pdf", methods=["GET"])
def export_conversation_pdf(conversation_id):
    """Export conversation as PDF"""
    conversation = Conversation.query.get_or_404(conversation_id)
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()

    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.close()

    try:
        # Create PDF document
        doc = SimpleDocTemplate(temp_file.name, pagesize=letter)
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=18,
            spaceAfter=30,
            textColor="#2563eb"
        )

        user_style = ParagraphStyle(
            "UserMessage",
            parent=styles["Normal"],
            fontSize=11,
            leftIndent=20,
            rightIndent=20,
            spaceAfter=12,
            backColor="#eff6ff",
            borderColor="#2563eb",
            borderWidth=1,
            borderPadding=8
        )

        assistant_style = ParagraphStyle(
            "AssistantMessage",
            parent=styles["Normal"],
            fontSize=11,
            leftIndent=20,
            rightIndent=20,
            spaceAfter=12,
            backColor="#f9fafb",
            borderColor="#6b7280",
            borderWidth=1,
            borderPadding=8
        )

        timestamp_style = ParagraphStyle(
            "Timestamp",
            parent=styles["Normal"],
            fontSize=9,
            textColor="#6b7280",
            spaceAfter=6
        )

        # Build content
        content = []

        # Title
        content.append(Paragraph(f"Conversation: {conversation.title}", title_style))
        content.append(Paragraph(f"Created: {conversation.created_at.strftime('%Y-%m-%d %H:%M:%S')}", timestamp_style))
        content.append(Spacer(1, 20))

        # Messages
        for message in messages:
            role_label = "You" if message.role == "user" else "Rockbot"
            timestamp = message.timestamp.strftime("%H:%M:%S")

            # Timestamp
            content.append(Paragraph(f"[{timestamp}] {role_label}:", timestamp_style))

            # Message content
            style = user_style if message.role == "user" else assistant_style
            content.append(Paragraph(message.content.replace("\n", "<br/>"), style))

            content.append(Spacer(1, 10))

        # Build PDF
        doc.build(content)

        # Return file
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=f"conversation-{conversation_id}.pdf",
            mimetype='application/pdf'
        )

    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

    finally:
        # For now, leave the temp file for download
        pass


@export_bp.route("/conversations/<int:conversation_id>/share", methods=["POST"])
def share_conversation(conversation_id):
    """Create shareable link for conversation"""
    conversation = Conversation.query.get_or_404(conversation_id)
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()

    # Generate share data
    share_data = {
        'conversation': conversation.to_dict(),
        'messages': [msg.to_dict() for msg in messages],
        'shared_at': datetime.utcnow().isoformat(),
        'share_id': f"share_{conversation_id}_{int(datetime.utcnow().timestamp())}"
    }

    return jsonify({
        'share_id': share_data['share_id'],
        'share_url': f"/shared/{share_data['share_id']}",
        'share_data': share_data
    })


@export_bp.route("/conversations/search", methods=["GET"])
def search_conversations():
    """Search conversations by title or content"""
    query = request.args.get('q', '')
    limit = int(request.args.get('limit', 20))

    if not query:
        return jsonify([])

    # Search in conversation titles
    title_matches = Conversation.query.filter(
        Conversation.title.contains(query)
    ).limit(limit).all()

    # Search in message content
    message_matches = db.session.query(Conversation).join(Message).filter(
        Message.content.contains(query)
    ).distinct().limit(limit).all()

    # Combine and deduplicate results
    all_matches = {conv.id: conv for conv in title_matches + message_matches}
    results = list(all_matches.values())

    # Sort by updated_at
    results.sort(key=lambda x: x.updated_at, reverse=True)

    return jsonify([conv.to_dict() for conv in results[:limit]])


@export_bp.route("/conversations/filter", methods=["GET"])
def filter_conversations():
    """Filter conversations by date range or other criteria"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = int(request.args.get('limit', 50))

    query = Conversation.query

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Conversation.created_at >= start_dt)
        except ValueError:
            return jsonify({'error': 'Invalid start_date format'}), 400

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(Conversation.created_at <= end_dt)
        except ValueError:
            return jsonify({'error': 'Invalid end_date format'}), 400

    conversations = query.order_by(Conversation.updated_at.desc()).limit(limit).all()

    return jsonify([conv.to_dict() for conv in conversations])
