import openai
import json
import asyncio
from typing import List, Dict, Any
from datetime import datetime

class RockbotAI:
    def __init__(self):
        self.client = openai.OpenAI()
        self.agents = {
            'general': self._create_general_agent(),
            'translator': self._create_translator_agent(),
            'creative': self._create_creative_agent(),
            'problem_solver': self._create_problem_solver_agent(),
            'task_executor': self._create_task_executor_agent()
        }
        self.conversation_memory = {}
        
    def _create_general_agent(self):
        return {
            'name': 'General Assistant',
            'system_prompt': """You are Rockbot, a helpful AI assistant. You can answer questions, 
            explain concepts, and provide information on a wide variety of topics. Be conversational, 
            helpful, and accurate in your responses.""",
            'capabilities': ['qa', 'explanation', 'general_knowledge']
        }
    
    def _create_translator_agent(self):
        return {
            'name': 'Translator',
            'system_prompt': """You are a professional translator. Translate text accurately 
            between languages while preserving meaning, tone, and context. Always specify the 
            source and target languages.""",
            'capabilities': ['translation', 'language_detection']
        }
    
    def _create_creative_agent(self):
        return {
            'name': 'Creative Writer',
            'system_prompt': """You are a creative writing assistant. Help users with stories, 
            poems, creative ideas, brainstorming, and imaginative content. Be inspiring and 
            original in your suggestions.""",
            'capabilities': ['creative_writing', 'brainstorming', 'storytelling']
        }
    
    def _create_problem_solver_agent(self):
        return {
            'name': 'Problem Solver',
            'system_prompt': """You are a logical problem-solving assistant. Break down complex 
            problems into manageable steps, provide structured solutions, and use clear reasoning. 
            Focus on practical, actionable advice.""",
            'capabilities': ['problem_solving', 'logical_reasoning', 'step_by_step_guidance']
        }
    
    def _create_task_executor_agent(self):
        return {
            'name': 'Task Executor',
            'system_prompt': """You are an autonomous task execution assistant. You can plan, 
            organize, and provide detailed instructions for completing various tasks. Break down 
            complex tasks into actionable steps.""",
            'capabilities': ['task_planning', 'autonomous_execution', 'project_management']
        }
    
    def select_agent(self, message: str, context: Dict = None) -> str:
        """Select the most appropriate agent based on the message content"""
        message_lower = message.lower()
        
        # Translation keywords
        if any(word in message_lower for word in ['translate', 'translation', 'language', 'spanish', 'french', 'german', 'chinese', 'japanese']):
            return 'translator'
        
        # Creative keywords
        if any(word in message_lower for word in ['story', 'poem', 'creative', 'write', 'brainstorm', 'idea', 'imagine']):
            return 'creative'
        
        # Problem solving keywords
        if any(word in message_lower for word in ['problem', 'solve', 'help me', 'how to', 'step by step', 'solution']):
            return 'problem_solver'
        
        # Task execution keywords
        if any(word in message_lower for word in ['plan', 'task', 'project', 'organize', 'schedule', 'execute', 'autonomous']):
            return 'task_executor'
        
        # Default to general agent
        return 'general'
    
    def get_conversation_context(self, conversation_id: int, limit: int = 10) -> List[Dict]:
        """Get recent conversation context for better responses"""
        if conversation_id not in self.conversation_memory:
            return []
        
        return self.conversation_memory[conversation_id][-limit:]
    
    def update_conversation_memory(self, conversation_id: int, role: str, content: str):
        """Update conversation memory for adaptive learning"""
        if conversation_id not in self.conversation_memory:
            self.conversation_memory[conversation_id] = []
        
        self.conversation_memory[conversation_id].append({
            'role': role,
            'content': content,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Keep only last 50 messages per conversation
        if len(self.conversation_memory[conversation_id]) > 50:
            self.conversation_memory[conversation_id] = self.conversation_memory[conversation_id][-50:]
    
    async def generate_response(self, message: str, conversation_id: int = None, agent_type: str = None) -> Dict[str, Any]:
        """Generate AI response using the selected agent"""
        try:
            # Select agent if not specified
            if not agent_type:
                agent_type = self.select_agent(message)
            
            agent = self.agents[agent_type]
            
            # Build conversation context
            messages = [{'role': 'system', 'content': agent['system_prompt']}]
            
            # Add conversation history if available
            if conversation_id:
                context = self.get_conversation_context(conversation_id)
                messages.extend(context)
            
            # Add current user message
            messages.append({'role': 'user', 'content': message})
            
            # Generate response
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            # Update conversation memory
            if conversation_id:
                self.update_conversation_memory(conversation_id, 'user', message)
                self.update_conversation_memory(conversation_id, 'assistant', ai_response)
            
            return {
                'response': ai_response,
                'agent_used': agent_type,
                'agent_name': agent['name'],
                'capabilities': agent['capabilities'],
                'success': True
            }
            
        except Exception as e:
            return {
                'response': f"I apologize, but I encountered an error: {str(e)}",
                'agent_used': agent_type or 'general',
                'error': str(e),
                'success': False
            }
    
    def translate_text(self, text: str, target_language: str, source_language: str = 'auto') -> Dict[str, Any]:
        """Specialized translation function"""
        try:
            prompt = f"Translate the following text from {source_language} to {target_language}:\n\n{text}"
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {'role': 'system', 'content': self.agents['translator']['system_prompt']},
                    {'role': 'user', 'content': prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            return {
                'translation': response.choices[0].message.content,
                'source_language': source_language,
                'target_language': target_language,
                'success': True
            }
            
        except Exception as e:
            return {
                'translation': f"Translation error: {str(e)}",
                'error': str(e),
                'success': False
            }
    
    def execute_autonomous_task(self, task_description: str) -> Dict[str, Any]:
        """Execute autonomous tasks with step-by-step planning"""
        try:
            prompt = f"""Break down this task into detailed, actionable steps: {task_description}
            
            Provide:
            1. Task analysis
            2. Step-by-step execution plan
            3. Potential challenges and solutions
            4. Success criteria
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {'role': 'system', 'content': self.agents['task_executor']['system_prompt']},
                    {'role': 'user', 'content': prompt}
                ],
                max_tokens=1500,
                temperature=0.5
            )
            
            return {
                'task_plan': response.choices[0].message.content,
                'task_description': task_description,
                'agent_used': 'task_executor',
                'success': True
            }
            
        except Exception as e:
            return {
                'task_plan': f"Task planning error: {str(e)}",
                'error': str(e),
                'success': False
            }

# Global AI service instance
rockbot_ai = RockbotAI()

