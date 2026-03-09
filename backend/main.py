import os
from dotenv import load_dotenv
from google import genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class ChatMessage(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"status": "Agent is running"}

@app.post("/chat")
async def chat_with_gemini(chat_message: ChatMessage):
    if not chat_message.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=chat_message.message

        )
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)