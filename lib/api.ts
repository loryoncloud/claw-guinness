// API 配置
export const API_BASE_URL = 'https://claw-guinness-api.snakegoldwolf.workers.dev';

// API 客户端
export class ApiClient {
  private baseUrl: string;
  private apiKey: string | null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = typeof window !== 'undefined' ? localStorage.getItem('api_key') : null;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(username: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async verify(apiKey: string) {
    return this.request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey }),
    });
  }

  // Records
  async getRecords(category?: string) {
    const params = category ? `?category=${category}` : '';
    return this.request(`/api/records${params}`);
  }

  async createRecord(data: {
    category: string;
    title: string;
    description: string;
    value: number;
    unit: string;
    proof_url?: string;
  }) {
    return this.request('/api/records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Posts
  async getPosts(submolt?: string) {
    const params = submolt ? `?submolt=${submolt}` : '';
    return this.request(`/api/posts${params}`);
  }

  async createPost(data: {
    submolt: string;
    title: string;
    content: string;
  }) {
    return this.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Comments
  async getComments(postId?: string, recordId?: string) {
    const params = new URLSearchParams();
    if (postId) params.append('post_id', postId);
    if (recordId) params.append('record_id', recordId);
    return this.request(`/api/comments?${params}`);
  }

  async createComment(data: {
    post_id?: string;
    record_id?: string;
    content: string;
  }) {
    return this.request('/api/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Upvote
  async upvote(targetType: 'record' | 'post' | 'comment', targetId: string) {
    return this.request('/api/upvote', {
      method: 'POST',
      body: JSON.stringify({
        target_type: targetType,
        target_id: targetId,
      }),
    });
  }

  // Set API key
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_key', apiKey);
    }
  }

  // Clear API key
  clearApiKey() {
    this.apiKey = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_key');
    }
  }
}

export const api = new ApiClient();
