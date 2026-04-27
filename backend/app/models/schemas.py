



from typing import List

from pydantic import BaseModel


class ChatPart(BaseModel):
    text: str

class ChatMessage(BaseModel):
    role: str
    parts: List[ChatPart]

class ChatRequest(BaseModel):
    message: str
    context: str
    history: List[ChatMessage]
    ai: str = "gemini"  # 'gemini' or 'groq', default to gemini

class RepoRequest(BaseModel):
    url: str
    ai: str = "gemini"

class YamlRequest(BaseModel):
    overview: str
    analysis: str
    ai: str = "gemini"
