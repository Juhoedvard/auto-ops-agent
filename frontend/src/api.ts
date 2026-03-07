import axios from 'axios';



interface ChatResponse {
    response: string;
}


const api = axios.create({
    baseURL: 'http://localhost:8000',
});

export const chatService = {
    analyzeRepo: async (repoUrl: string): Promise<ChatResponse> => {
        const response = await api.post<ChatResponse>("/chat", {
            message: `Analyze the repository and create a ci/cd pipeline for it: ${repoUrl}`
        });
  
        return response.data;
    },

    sendMessage: async (message: string): Promise<ChatResponse> => {
        const response = await api.post<ChatResponse>("/chat", {
            message
        });
        return response.data;
    }
}