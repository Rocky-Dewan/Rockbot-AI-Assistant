import os
import json
import time
import random
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional

# ---------------------------------------------------
#  ROCKBOT AI SERVICE - ADVANCED MULTI-AGENT (OpenRouter Edition)
# ---------------------------------------------------

#  ✅ Automatic model switching based on agent type
#  ✅ Smart rate-limit retry + exponential backoff
#  ✅ Memory caching (limited)
#  ✅ Unified translation, creative writing, logic reasoning
#  ✅ Customizable model override via parameter
# ---------------------------------------------------

class RockbotAI:
    def __init__(self):
        """Initialize OpenRouter API and configure multi-agent setup."""
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"

        self.conversation_memory: Dict[int, List[Dict[str, Any]]] = {}

        # Base agent registry
        self.agents = {
            "general": self._create_general_agent(),
            "translator": self._create_translator_agent(),
            "creative": self._create_creative_agent(),
            "problem_solver": self._create_problem_solver_agent(),
            "task_executor": self._create_task_executor_agent(),
        }

        # Recommended models for each use-case
        self.model_map = {
            "general": "gpt-4o-mini",
            "translator": "mistralai/mistral-small",
            "creative": "meta-llama/llama-3.1-70b-instruct",
            "problem_solver": "mistralai/mixtral-8x7b",
            "task_executor": "anthropic/claude-3.5-sonnet",
        }

    # ---------------------------------------------------
    #  AGENT DEFINITIONS
    # ---------------------------------------------------
    def _create_general_agent(self):
        return {
            "name": "General Assistant",
            "system_prompt": (
                "You are Rockbot, a friendly and intelligent AI assistant. "
                "You help users with general questions, explanations, and everyday reasoning. "
                "Respond in a concise, informative, and engaging way."
            ),
            "capabilities": ["qa", "general_knowledge", "guidance"],
        }

    def _create_translator_agent(self):
        return {
            "name": "Translator",
            "system_prompt": (
                "You are an expert linguist. Translate text between languages fluently, "
                "keeping tone and cultural context intact. Always clarify both languages."
            ),
            "capabilities": ["translation", "language_detection"],
        }

    def _create_creative_agent(self):
        return {
            "name": "Creative Writer",
            "system_prompt": (
                "You are a creative writer and idea generator. "
                "Help brainstorm stories, poems, dialogues, or marketing ideas. "
                "Write imaginatively with style and inspiration."
            ),
            "capabilities": ["creative_writing", "storytelling", "idea_generation"],
        }

    def _create_problem_solver_agent(self):
        return {
            "name": "Problem Solver",
            "system_prompt": (
                "You are an analytical problem solver. Decompose complex issues "
                "into clear steps and provide logical, structured, and practical solutions."
            ),
            "capabilities": ["reasoning", "step_by_step_guidance", "debugging"],
        }

    def _create_task_executor_agent(self):
        return {
            "name": "Task Planner",
            "system_prompt": (
                "You are an autonomous task execution assistant. "
                "Plan and organize step-by-step strategies to achieve goals efficiently."
            ),
            "capabilities": ["task_planning", "project_management", "execution"],
        }

    # ---------------------------------------------------
    #  AGENT DETECTION
    # ---------------------------------------------------
    def select_agent(self, message: str) -> str:
        msg = message.lower()
        if any(k in msg for k in ["translate", "language", "spanish", "french"]):
            return "translator"
        if any(k in msg for k in ["story", "poem", "creative", "imagine", "idea"]):
            return "creative"
        if any(k in msg for k in ["problem", "solve", "error", "fix", "how to"]):
            return "problem_solver"
        if any(k in msg for k in ["plan", "task", "project", "execute", "workflow"]):
            return "task_executor"
        return "general"

    # ---------------------------------------------------
    #  MEMORY HANDLING
    # ---------------------------------------------------
    def get_conversation_context(self, conversation_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        return self.conversation_memory.get(conversation_id, [])[-limit:]

    def update_conversation_memory(self, conversation_id: int, role: str, content: str):
        if conversation_id not in self.conversation_memory:
            self.conversation_memory[conversation_id] = []
        self.conversation_memory[conversation_id].append(
            {"role": role, "content": content, "timestamp": datetime.utcnow().isoformat()}
        )
        if len(self.conversation_memory[conversation_id]) > 50:
            self.conversation_memory[conversation_id] = self.conversation_memory[conversation_id][-50:]

    # ---------------------------------------------------
    #  CORE REQUEST HANDLER (OpenRouter)
    # ---------------------------------------------------
    def _call_openrouter(
        self, model: str, messages: List[Dict[str, str]],
        temperature=0.7, max_tokens=1000, retries=3
    ):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        for attempt in range(retries):
            try:
                response = requests.post(self.api_url, headers=headers, json=payload, timeout=60)
                if response.status_code == 429:
                    wait_time = 2 ** attempt + random.random()
                    time.sleep(wait_time)
                    continue
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"].strip()
            except Exception as e:
                if attempt == retries - 1:
                    raise e
                time.sleep(2 ** attempt)

    # ---------------------------------------------------
    #  GENERIC RESPONSE GENERATION
    # ---------------------------------------------------
    def generate_response(
        self, message: str, conversation_id: Optional[int] = None,
        agent_type: Optional[str] = None, model: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            agent_type = agent_type or self.select_agent(message)
            agent = self.agents.get(agent_type, self.agents["general"])
            model = model or self.model_map.get(agent_type, "gpt-4o-mini")

            messages = [{"role": "system", "content": agent["system_prompt"]}]
            if conversation_id:
                messages.extend(self.get_conversation_context(conversation_id))
            messages.append({"role": "user", "content": message})

            ai_response = self._call_openrouter(model, messages)

            if conversation_id:
                self.update_conversation_memory(conversation_id, "user", message)
                self.update_conversation_memory(conversation_id, "assistant", ai_response)

            return {
                "success": True,
                "response": ai_response,
                "agent_used": agent_type,
                "agent_name": agent["name"],
                "model_used": model,
                "capabilities": agent["capabilities"],
            }
        except Exception as e:
            return {
                "success": False,
                "response": f"Error: {str(e)}",
                "agent_used": agent_type or "general",
                "error": str(e),
            }

    # ---------------------------------------------------
    #  TRANSLATION AGENT
    # ---------------------------------------------------
    def translate_text(self, text: str, target_language: str, source_language: str = "auto") -> Dict[str, Any]:
        try:
            prompt = f"Translate from {source_language} to {target_language}:\n\n{text}"
            messages = [
                {"role": "system", "content": self.agents["translator"]["system_prompt"]},
                {"role": "user", "content": prompt},
            ]
            translated = self._call_openrouter(self.model_map["translator"], messages, temperature=0.3)
            return {
                "success": True,
                "translation": translated,
                "target_language": target_language,
                "source_language": source_language,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ---------------------------------------------------
    #  TASK EXECUTION AGENT
    # ---------------------------------------------------
    def execute_autonomous_task(self, task_description: str) -> Dict[str, Any]:
        try:
            prompt = (
                f"Analyze and break down this task: {task_description}\n"
                f"Provide:\n"
                f"1. Task analysis\n"
                f"2. Step-by-step plan\n"
                f"3. Challenges\n"
                f"4. Success criteria"
            )
            messages = [
                {"role": "system", "content": self.agents["task_executor"]["system_prompt"]},
                {"role": "user", "content": prompt},
            ]
            plan = self._call_openrouter(self.model_map["task_executor"], messages, temperature=0.5, max_tokens=1200)
            return {
                "success": True,
                "task_plan": plan,
                "agent_used": "task_executor",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


# ---------------------------------------------------
#  GLOBAL INSTANCE
# ---------------------------------------------------
rockbot_ai = RockbotAI()
