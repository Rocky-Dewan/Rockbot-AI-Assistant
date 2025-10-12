import os
import json
from datetime import datetime
from typing import List, Dict, Any
from openai import OpenAI

# ---------------------------------------------------
#  ROCKBOT AI SERVICE - MULTI-AGENT SYNCHRONOUS VERSION
# ---------------------------------------------------

class RockbotAI:
    def __init__(self):
        """Initialize the OpenAI client and preconfigure agent profiles"""
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.conversation_memory: Dict[int, List[Dict[str, Any]]] = {}
        
        # Register available AI agent profiles
        self.agents = {
            "general": self._create_general_agent(),
            "translator": self._create_translator_agent(),
            "creative": self._create_creative_agent(),
            "problem_solver": self._create_problem_solver_agent(),
            "task_executor": self._create_task_executor_agent(),
        }

    # ---------------------------------------------------
    #  AGENT CONFIGURATIONS
    # ---------------------------------------------------
    def _create_general_agent(self):
        return {
            "name": "General Assistant",
            "system_prompt": (
                "You are Rockbot, a helpful AI assistant. "
                "You can answer questions, explain concepts, "
                "and provide information across a wide range of topics. "
                "Be conversational, helpful, and accurate."
            ),
            "capabilities": ["qa", "explanation", "general_knowledge"],
        }

    def _create_translator_agent(self):
        return {
            "name": "Translator",
            "system_prompt": (
                "You are a professional translator. Translate text accurately "
                "between languages while preserving tone and context. "
                "Always specify source and target languages clearly."
            ),
            "capabilities": ["translation", "language_detection"],
        }

    def _create_creative_agent(self):
        return {
            "name": "Creative Writer",
            "system_prompt": (
                "You are a creative writing assistant. Help users write stories, "
                "poems, or brainstorm ideas. Be imaginative and inspiring."
            ),
            "capabilities": ["creative_writing", "storytelling", "brainstorming"],
        }

    def _create_problem_solver_agent(self):
        return {
            "name": "Problem Solver",
            "system_prompt": (
                "You are a logical problem-solving assistant. Break down complex "
                "problems into manageable steps and provide clear, structured solutions."
            ),
            "capabilities": ["problem_solving", "logical_reasoning", "guidance"],
        }

    def _create_task_executor_agent(self):
        return {
            "name": "Task Executor",
            "system_prompt": (
                "You are an autonomous task execution assistant. You plan, organize, "
                "and provide detailed steps to accomplish various tasks."
            ),
            "capabilities": ["task_planning", "project_management", "automation"],
        }

    # ---------------------------------------------------
    #  AGENT SELECTION
    # ---------------------------------------------------
    def select_agent(self, message: str) -> str:
        """Select appropriate agent based on message content."""
        msg = message.lower()
        if any(k in msg for k in ["translate", "translation", "spanish", "french", "language"]):
            return "translator"
        if any(k in msg for k in ["story", "poem", "creative", "write", "idea", "imagine"]):
            return "creative"
        if any(k in msg for k in ["problem", "solve", "how to", "help me", "fix"]):
            return "problem_solver"
        if any(k in msg for k in ["plan", "project", "schedule", "execute", "task"]):
            return "task_executor"
        return "general"

    # ---------------------------------------------------
    #  MEMORY MANAGEMENT
    # ---------------------------------------------------
    def get_conversation_context(self, conversation_id: int, limit: int = 10) -> List[Dict]:
        """Fetch limited conversation history."""
        return self.conversation_memory.get(conversation_id, [])[-limit:]

    def update_conversation_memory(self, conversation_id: int, role: str, content: str):
        """Store message in memory."""
        if conversation_id not in self.conversation_memory:
            self.conversation_memory[conversation_id] = []
        self.conversation_memory[conversation_id].append(
            {"role": role, "content": content, "timestamp": datetime.utcnow().isoformat()}
        )
        # Keep memory clean
        if len(self.conversation_memory[conversation_id]) > 50:
            self.conversation_memory[conversation_id] = self.conversation_memory[conversation_id][-50:]

    # ---------------------------------------------------
    #  RESPONSE GENERATION
    # ---------------------------------------------------
    def generate_response(
        self,
        message: str,
        conversation_id: int = None,
        agent_type: str = None,
        model: str = "gpt-4o-mini"
    ) -> Dict[str, Any]:
        """
        Generate AI response using selected agent.
        This is fully synchronous to work with Flask/FastAPI sync endpoints.
        """
        try:
            # Pick agent
            agent_type = agent_type or self.select_agent(message)
            agent = self.agents.get(agent_type, self.agents["general"])

            # Construct conversation
            messages = [{"role": "system", "content": agent["system_prompt"]}]
            if conversation_id:
                messages.extend(self.get_conversation_context(conversation_id))
            messages.append({"role": "user", "content": message})

            # Call OpenAI
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )

            ai_message = response.choices[0].message.content.strip()

            # Save memory
            if conversation_id:
                self.update_conversation_memory(conversation_id, "user", message)
                self.update_conversation_memory(conversation_id, "assistant", ai_message)

            return {
                "success": True,
                "response": ai_message,
                "agent_used": agent_type,
                "agent_name": agent["name"],
                "capabilities": agent["capabilities"],
            }

        except Exception as e:
            return {
                "success": False,
                "response": f"I apologize, but I encountered an error: {str(e)}",
                "agent_used": agent_type or "general",
                "error": str(e),
            }

    # ---------------------------------------------------
    #  TRANSLATION AGENT
    # ---------------------------------------------------
    def translate_text(self, text: str, target_language: str, source_language: str = "auto") -> Dict[str, Any]:
        """Dedicated translator function."""
        try:
            prompt = f"Translate the following text from {source_language} to {target_language}:\n\n{text}"
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.agents["translator"]["system_prompt"]},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=800,
                temperature=0.3,
            )
            translated = response.choices[0].message.content.strip()
            return {
                "success": True,
                "translation": translated,
                "target_language": target_language,
                "source_language": source_language,
            }
        except Exception as e:
            return {"success": False, "translation": "", "error": str(e)}

    # ---------------------------------------------------
    #  TASK EXECUTION AGENT
    # ---------------------------------------------------
    def execute_autonomous_task(self, task_description: str) -> Dict[str, Any]:
        """Generate a structured step-by-step execution plan."""
        try:
            prompt = f"""
            Analyze and break down this task into clear steps: {task_description}.
            Provide:
            1. A short task analysis
            2. Step-by-step execution plan
            3. Potential challenges
            4. Success criteria
            """
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.agents["task_executor"]["system_prompt"]},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1200,
                temperature=0.5,
            )
            plan = response.choices[0].message.content.strip()
            return {
                "success": True,
                "task_plan": plan,
                "task_description": task_description,
                "agent_used": "task_executor",
            }
        except Exception as e:
            return {
                "success": False,
                "task_plan": f"Task planning error: {str(e)}",
                "error": str(e),
            }


# ---------------------------------------------------
#  GLOBAL INSTANCE
# ---------------------------------------------------
rockbot_ai = RockbotAI()
