/**
 * ApiClient — Fastify REST API Client with JWT Bearer Authentication
 * Automatically manages JWT persistence in localStorage and injects
 * Authorization headers into all outbound requests.
 */

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
  [key: string]: any;
}

export class ApiClient {
  private static readonly TOKEN_KEY = 'ethiofantasy_jwt_token';
  private static _instance: ApiClient | null = null;
  private _baseUrl: string;
  private _onAuthErrorCallbacks: Set<() => void> = new Set();

  private constructor() {
    // Relative to origin so NGINX reverse-proxy and Vite dev proxy route correctly
    this._baseUrl = '/api';
  }

  public static getInstance(): ApiClient {
    if (!ApiClient._instance) {
      ApiClient._instance = new ApiClient();
    }
    return ApiClient._instance;
  }

  public getToken(): string | null {
    try {
      return localStorage.getItem(ApiClient.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setToken(token: string): void {
    try {
      localStorage.setItem(ApiClient.TOKEN_KEY, token);
    } catch (e) {
      console.warn('[ApiClient] Failed to save token to localStorage:', e);
    }
  }

  public clearToken(): void {
    try {
      localStorage.removeItem(ApiClient.TOKEN_KEY);
    } catch (e) {
      console.warn('[ApiClient] Failed to remove token from localStorage:', e);
    }
  }

  public onAuthError(callback: () => void): () => void {
    this._onAuthErrorCallbacks.add(callback);
    return () => this._onAuthErrorCallbacks.delete(callback);
  }

  private _notifyAuthError(): void {
    this.clearToken();
    this._onAuthErrorCallbacks.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('[ApiClient] Error in auth error callback:', err);
      }
    });
  }

  private async _request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this._baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        console.warn(`[ApiClient] 401 Unauthorized encountered on ${url}`);
        this._notifyAuthError();
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || json.message || `HTTP ${response.status}`);
        }
        return json;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.text()) as any;
    } catch (error: any) {
      console.warn(`[ApiClient] Request to ${url} failed:`, error.message);
      throw error;
    }
  }

  public async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let fullPath = endpoint;
    if (params) {
      const query = new URLSearchParams();
      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null) {
          query.append(key, String(val));
        }
      }
      const qs = query.toString();
      if (qs) {
        fullPath += (endpoint.includes('?') ? '&' : '?') + qs;
      }
    }
    return this._request<T>(fullPath, { method: 'GET' });
  }

  public async post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this._request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T = any>(endpoint: string, body?: any): Promise<T> {
    return this._request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T = any>(endpoint: string): Promise<T> {
    return this._request<T>(endpoint, { method: 'DELETE' });
  }
}
