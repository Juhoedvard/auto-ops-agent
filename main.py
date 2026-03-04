import os
from dotenv import load_dotenv
from google import genai

load_dotenv()


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def ask_gemini():
    files = [f for f in os.listdir() if os.path.isfile(f)]

    prompt = f"""
    You are DevOpsGPT. My project includes these files {files}. I want to create a Dockerfile for this project. Can you help me with that?
    Result should be only the content of the Dockerfile, without any explanations or comments.
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        docker = response.text.strip()

        with open("Dockerfile", "w", encoding="utf-8") as f:
            f.write(docker)
        print("Dockerfile has been created successfully.")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    ask_gemini()