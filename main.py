import os
from dotenv import load_dotenv
from google import genai
import sys
load_dotenv()




def ask_gemini():

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in environment variables.")
        sys.exit(1)
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    print("Asking Gemini...")
    print("Type 'exit' to quit.")

    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Goodbye!")
            break

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_input
            )
            print("Gemini: ", response.text)
        except Exception as e:
            print("Error communicating with Gemini:", e)
            
    
if __name__ == "__main__":
    ask_gemini()