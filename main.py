import os
from dotenv import load_dotenv
from google import genai

load_dotenv()


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def ask_gemini():

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Hey! Are you ready to code"
        )
        print(response.text)
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    ask_gemini()