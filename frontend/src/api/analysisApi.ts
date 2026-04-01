
import axios from 'axios';
import type { AnalysisResult, JobStatus } from '../types/analysis';

type AnalysisContext =  Pick<AnalysisResult, 'overview' | 'analysis'> & { jobId: string };

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000, // 30 second timeout
});

// Circuit breaker state
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 60000; // 1 minute
  private readonly successThreshold = 2;
  private halfOpenSuccesses = 0;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
        this.halfOpenSuccesses = 0;
      } else {
        throw new Error('Circuit breaker is open. Service is temporarily unavailable.');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'half-open') {
        this.halfOpenSuccesses++;
        if (this.halfOpenSuccesses >= this.successThreshold) {
          this.state = 'closed';
          this.failures = 0;
        }
      } else {
        this.failures = Math.max(0, this.failures - 1); // Gradual recovery
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'open';
      }
      
      throw error;
    }
  }

  getState() {
    return this.state;
  }
}

const circuitBreaker = new CircuitBreaker();


export const analysisApi = {

  startAnalysis: async (repoUrl: string): Promise<string> => {
    return circuitBreaker.execute(async () => {
      const response = await api.post<{ jobId: string }>('/analyze', { url: repoUrl });
      return response.data.jobId;
    });
  },


  checkStatus: async (jobId: string): Promise<JobStatus> => {
    return circuitBreaker.execute(async () => {
      const response = await api.get<JobStatus>(`/status/${jobId}`);
      console.log("📡 API Response Layer:", response.data);
      return response.data;
    });
  },
  handleRegenerateYaml: async (ContextData: AnalysisContext) => {
    return circuitBreaker.execute(async () => {
      const response = await api.post('refetchYaml', ContextData);
      return response.data;
    });
  }
};
