import axios from 'axios';
import toast from 'react-hot-toast';

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}


interface ChatRequest {
  message: string;
  context: string;
  history: ChatMessage[];
  ai?: 'gemini' | 'groq';
}


interface ChatResponse {
  reply: string;
  fallbackUsed?: boolean;
}
export interface ApiError {
  detail: string | { msg: string; type: string }[]; // FastAPI:n standardi
}

const BASE_URL  = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatApi = {

  sendMessage: async (request: ChatRequest): Promise<string> => {
    try {
      const response = await api.post<ChatResponse>('/chat', request);
      
      if (response.data.fallbackUsed) {
         toast('Gemini is busy. Switched to Groq Llama-70B model.', { icon: '🔄', id: 'fallback-chat', duration: 4000 });
      }

      // Varmistetaan, että vastaus sisältää odotetun tekstin
      if (!response.data || typeof response.data.reply !== 'string') {
        throw new Error('Server returned an invalid response.');
      }

      return response.data.reply;

    } catch (error: unknown) {
      if (axios.isAxiosError<ApiError>(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Connection timeout. The AI service is taking too long to respond.');
        }
        
        if (!error.response) {
          throw new Error('No connection to the server.');
        }

        const status = error.response.status;
        const detail = error.response.data?.detail;
        
        // Parse FastAPI detail which can be a string or array of error objects
        const serverMessage = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map(err => err.msg).join(', ')
            : error.message;

        console.error(`Chat API Error [${status}]:`, serverMessage);

        if (status === 500) {
          throw new Error('Server error occurred while processing the AI request.');
        }

        throw new Error(serverMessage || 'Unknown error occurred while sending the message.');
      }
      
      throw error instanceof Error ? error : new Error('An unexpected error occurred');
    }
  }
};