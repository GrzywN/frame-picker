/**
 * API Client for Frame Picker
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Session {
  session_id: string;
  status: string;
  message: string;
  created_at?: string;
  expires_at?: string;
}

export interface ProcessRequest {
  mode: 'profile' | 'action';
  quality: 'fast' | 'balanced' | 'best';
  count: number;
  sample_rate: number;
  min_interval: number;
}

export interface FrameResult {
  frame_index: number;
  score: number;
  timestamp: number;
  file_path?: string;
  download_url?: string;
  width?: number;
  height?: number;
  file_size?: number;
}

export interface SessionStatus {
  session_id: string;
  status: string;
  message: string;
  progress: number;
  results?: FrameResult[];
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async createSession(): Promise<Session> {
    const response = await fetch(`${this.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadVideo(sessionId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload video: ${response.statusText}`);
    }

    return response.json();
  }

  async processVideo(sessionId: string, params: ProcessRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to process video: ${response.statusText}`);
    }

    return response.json();
  }

  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/status`);

    if (!response.ok) {
      throw new Error(`Failed to get session status: ${response.statusText}`);
    }

    return response.json();
  }

  async getResults(sessionId: string): Promise<FrameResult[]> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}/results`);

    if (!response.ok) {
      throw new Error(`Failed to get results: ${response.statusText}`);
    }

    return response.json();
  }

  getDownloadUrl(sessionId: string, frameIndex: number): string {
    return `${this.baseUrl}/api/sessions/${sessionId}/download/${frameIndex}`;
  }

  async cleanupSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to cleanup session: ${response.statusText}`);
    }
  }
}

export const apiClient = new ApiClient();