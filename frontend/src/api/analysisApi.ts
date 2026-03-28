
import axios from 'axios';
import type { AnalysisResult, JobStatus } from '../types/analysis';

type AnalysisContext =  Pick<AnalysisResult, 'overview' | 'analysis'>;

const api = axios.create({
  baseURL: 'http://localhost:8000',
});


export const analysisApi = {

  startAnalysis: async (repoUrl: string): Promise<string> => {
    const response = await api.post<{ jobId: string }>('/analyze', { url: repoUrl });
    return response.data.jobId;
  },


  checkStatus: async (jobId: string): Promise<JobStatus> => {
      try {
        const response = await api.get<JobStatus>(`/status/${jobId}`);
        // Logitetaan TÄÄLLÄ, koska tämä on lähempänä lähdettä
        console.log("📡 API Response Layer:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ API Call crashed in analysisApi.ts:", error);
        throw error;
      }
    },
   handleRegenerateYaml: async (ContextData: AnalysisContext) => {
      if (!ContextData) return;
      try {
        const response = await api.post('refetchYaml', ContextData);
        return response.data;
      } catch (err) {
        console.error("Regeneration failed", err);
        throw err;
    }
  }
};
