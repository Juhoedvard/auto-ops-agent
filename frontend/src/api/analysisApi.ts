
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export interface JobStatus {
  id: string;
  status: 'cloning' | 'analyzing' | 'generating' | 'ready' | 'failed';
  result?: string;
  error?: string;
}

export const analysisApi = {

  startAnalysis: async (repoUrl: string): Promise<string> => {
    const response = await api.post<{ jobId: string }>('/analyze', { url: repoUrl });
    return response.data.jobId;
  },


  checkStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await api.get<JobStatus>(`/status/${jobId}`);
    return response.data;
  }
};