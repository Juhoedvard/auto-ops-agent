export interface AnalysisResult {
  overview: string;
  tech_stack: string[];
  analysis: string;
  yaml_config: string;
  implementation_steps: string[];
  benefits: string[];
}


export interface JobStatus {
  id: string;
  status: 'pending' | 'cloning' | 'analyzing' | 'generating' | 'ready' | 'failed';
  result?: AnalysisResult;
  error?: string;
  aiUsed?: 'gemini' | 'groq';
}
export interface AnalysisData {
  url: string;
  ai: 'gemini' | 'groq';
}