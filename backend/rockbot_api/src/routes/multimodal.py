from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import base64
import openai
from PIL import Image
import io
from src.services.ai_service import rockbot_ai

multimodal_bp = Blueprint('multimodal', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def ensure_upload_folder():
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

@multimodal_bp.route('/upload', methods=['POST'])
def upload_file():
    """Upload and process files (images, documents)"""
    ensure_upload_folder()

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        file_ext = filename.rsplit('.', 1)[1].lower()

        if file_ext in ['png', 'jpg', 'jpeg', 'gif']:
            result = process_image(filepath)
        elif file_ext == 'pdf':
            result = process_pdf(filepath)
        else:
            result = process_document(filepath)

        return jsonify({
            'filename': filename,
            'filepath': filepath,
            'file_type': file_ext,
            'processing_result': result
        })

    return jsonify({'error': 'File type not allowed'}), 400

def process_image(filepath):
    """Process image using OpenAI Vision API"""
    try:
        with open(filepath, 'rb') as image_file:
            image_data = image_file.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')

        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this image and describe what you see in detail. Include any text, objects, people, or other notable elements."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )

        analysis = response.choices[0].message.content

        with Image.open(filepath) as img:
            width, height = img.size
            format_type = img.format

        return {
            'type': 'image',
            'analysis': analysis,
            'metadata': {
                'width': width,
                'height': height,
                'format': format_type
            }
        }

    except Exception as e:
        return {
            'type': 'image',
            'error': f"Image processing failed: {str(e)}"
        }

def process_pdf(filepath):
    try:
        file_size = os.path.getsize(filepath)
        return {
            'type': 'pdf',
            'message': 'PDF uploaded successfully. Text extraction not implemented in this demo.',
            'metadata': {
                'file_size': file_size
            }
        }
    except Exception as e:
        return {
            'type': 'pdf',
            'error': f"PDF processing failed: {str(e)}"
        }

def process_document(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()

        word_count = len(content.split())
        char_count = len(content)

        return {
            'type': 'document',
            'content': content[:1000] + "..." if len(content) > 1000 else content,
            'metadata': {
                'word_count': word_count,
                'char_count': char_count
            }
        }

    except Exception as e:
        return {
            'type': 'document',
            'error': f"Document processing failed: {str(e)}"
        }

@multimodal_bp.route('/analyze-image', methods=['POST'])
def analyze_image():
    data = request.get_json()
    filepath = data.get('filepath')
    prompt = data.get('prompt', 'Describe this image')

    if not filepath or not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404

    try:
        with open(filepath, 'rb') as image_file:
            image_data = image_file.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')

        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000
        )

        analysis = response.choices[0].message.content

        return jsonify({
            'analysis': analysis,
            'prompt': prompt,
            'success': True
        })

    except Exception as e:
        return jsonify({
            'error': f"Image analysis failed: {str(e)}",
            'success': False
        }), 500

@multimodal_bp.route('/chat-with-image', methods=['POST'])
def chat_with_image():
    data = request.get_json()
    filepath = data.get('filepath')
    message = data.get('message')
    conversation_id = data.get('conversation_id')

    if not filepath or not message:
        return jsonify({'error': 'Filepath and message are required'}), 400

    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404

    try:
        with open(filepath, 'rb') as image_file:
            image_data = image_file.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')

        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": message
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000
        )

        ai_response = response.choices[0].message.content

        return jsonify({
            'response': ai_response,
            'message': message,
            'filepath': filepath,
            'conversation_id': conversation_id,
            'success': True
        })

    except Exception as e:
        return jsonify({
            'error': f"Multimodal chat failed: {str(e)}",
            'success': False
        }), 500
