import axios from 'axios';


interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}


interface ChatRequest {
  message: string;
  context: string;
  history: ChatMessage[];
}


interface ChatResponse {
  reply: string;
}
export interface ApiError {
  detail: string | { msg: string; type: string }[]; // FastAPI:n standardi
}

interface ApiErrorData {
  detail?: string;
}


const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatApi = {

  sendMessage: async (request: ChatRequest): Promise<string> => {
    try {
      const response = await api.post<ChatResponse>('/chat', request);
      
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