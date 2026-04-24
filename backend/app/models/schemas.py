



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

class RepoRequest(BaseModel):
    url: str

class YamlRequest(BaseModel):
    overview: str
    analysis: str
