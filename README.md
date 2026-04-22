Auto-Ops AI Agent 🚀
[![CI/CD Pipeline](https://github.com/Juhoedvard/auto-ops-agent/actions/workflows/main.yml/badge.svg)](https://github.com/Juhoedvard/auto-ops-agent/actions/workflows/main.yml)
Note: This project is under active development. Core features (analysis and generation) are functional, while UI refinement and advanced error handling are currently in progress.

Live Demo: https://auto-ops-frontend-1.onrender.com/

Auto-Ops is an AI-powered tool designed to analyze software projects and automatically generate optimized CI/CD pipelines (GitHub Actions). Built with a modern tech stack, the project emphasizes performance, scalability, and a developer-friendly user experience.

🌟 Key Features
AI-Driven Analysis: Automatically identifies project structure and technologies via LLM.

Automated YAML Generation: Creates fully functional GitHub Actions configurations.

Interactive UI: Modern dark-themed interface for reviewing analysis results.

Dockerized Environment: Streamlined setup and local development.

🛠 Tech Stack
Frontend: React 18 (TypeScript), Vite, Tailwind CSS.

Backend: FastAPI (Python), Google Gemini AI API, Pydantic.

Infrastructure: Docker, Docker Compose.

🚀 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites
Docker and Docker Compose installed on your machine.

A Google Gemini API Key (You can obtain one from the Google AI Studio).

Installation & Setup
Clone the repository:

Bash
git clone https://github.com/juhoedvard/auto-ops-agent.git
cd auto-ops-agent
Configure Environment Variables:
Create a .env file inside the backend directory:

Bash
touch backend/.env
Add your API key to the .env file:

Koodinpätkä
GEMINI_API_KEY=your_actual_api_key_here
Launch with Docker:
Run the following command in the root directory to build and start both the frontend and backend containers:

Bash
docker-compose up --build
Access the Application:

Frontend: Open http://localhost:5173 in your browser.

Backend API (Swagger Docs): Open http://localhost:8000/docs.

🛠 Technical Deep Dive
The core of the Auto-Ops agent is a robust, asynchronous background task:

Efficient Cloning: Uses git clone --depth 1 to minimize network overhead.

Asynchronous Orchestration: Leverages Python's asyncio for non-blocking Git and AI operations.

Context-Aware Heuristics: Scans for critical configuration files (e.g., package.json, requirements.txt) to provide the AI with a precise project signature.

Resilient Error Handling: Includes timeouts and error states for Git failures and API limitations.


