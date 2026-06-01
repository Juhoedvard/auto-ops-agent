import axios from 'axios';
import type { AnalysisData, AnalysisResult, JobStatus } from '../types/analysis';

type AnalysisContext = Pick<AnalysisResult, 'overview' | 'analysis'> & { jobId: string, ai: 'gemini' | 'groq' };

type StatusSocketCallbacks = {
  onOpen?: () => void;
  onMessage?: (data: unknown) => void;
  onError?: (error: Error) => void;
  onClose?: (event: CloseEvent) => void;
};

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const convertHttpToWebSocketUrl = (url: string) => {
  const cleanUrl = url.replace(/\/$/, '');
  if (cleanUrl.startsWith('https://')) {
    return `wss://${cleanUrl.slice(8)}`;
  }
  if (cleanUrl.startsWith('http://')) {
    return `ws://${cleanUrl.slice(7)}`;
  }
  return cleanUrl;
};

const buildWebSocketUrl = (jobId: string) => `${convertHttpToWebSocketUrl(BASE_URL)}/ws/${jobId}`;

const createStatusWebSocket = (jobId: string, callbacks: StatusSocketCallbacks) => {
  const wsUrl = buildWebSocketUrl(jobId);
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    callbacks.onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callbacks.onMessage?.(data);
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error('Invalid WebSocket message'));
    }
  };

  socket.onerror = () => {
    callbacks.onError?.(new Error('WebSocket connection error'));
  };

  socket.onclose = (event) => {
    callbacks.onClose?.(event);
  };

  return socket;
};

// Create axios instances
const mainApi = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

const wakeUpApi = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // Longer timeout for waking up (2 minutes)
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

  // Wake up the backend service before critical operations
  wakeUp: async (): Promise<boolean> => {
    try {
      await wakeUpApi.get('/health', { timeout: 60000 }); // 1 minute for wake-up
      return true;
    } catch (error) {
      console.warn('Wake up ping failed, service may still be waking up', error);
      return false;
    }
  },

  // Alias for older frontend code using ping()
  ping: async (): Promise<boolean> => {
    return analysisApi.wakeUp();
  },

  startAnalysis: async (analysisData: AnalysisData): Promise<string> => {
    return circuitBreaker.execute(async () => {
      const response = await mainApi.post<{ jobId: string }>('/analyze', analysisData);
      return response.data.jobId;
    });
  },


  checkStatus: async (jobId: string): Promise<JobStatus> => {
    return circuitBreaker.execute(async () => {
      const response = await mainApi.get<JobStatus>(`/status/${jobId}`);
      console.log("📡 API Response Layer:", response.data);
      return response.data;
    });
  },
    handleRegenerateYaml: async (ContextData: AnalysisContext) => {
    return circuitBreaker.execute(async () => {
      const response = await mainApi.post('refetchYaml', ContextData);
      return response.data;
    });
  },

  subscribeJobStatus: (jobId: string, callbacks: StatusSocketCallbacks) => {
    const socket = createStatusWebSocket(jobId, callbacks);
    const cleanup = () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };

    return { socket, close: cleanup };
  },

};

