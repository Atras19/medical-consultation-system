export const API_BASE_URL = 'http://localhost:3000/api';

type RequestConfig = RequestInit & {
  skipAuth?: boolean;
};

let accessToken: string | null = null;
const setAccessToken = (token: string | null) => { accessToken = token; };


export const apiClient = async (endpoint: string, config: RequestConfig = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(config.headers || {});
  headers.set('Content-Type', 'application/json');

  if (accessToken && !config.skipAuth) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  config.credentials = 'include';
  config.headers = headers;

  let response = await fetch(url, config);

  if (response.status === 401 && !config.skipAuth) {
    try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'GET',
            credentials: 'include' 
        });

        if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            accessToken = data.accessToken;
            headers.set('Authorization', `Bearer ${accessToken}`);
            config.headers = headers; 
            response = await fetch(url, config);
        } else {
            accessToken = null;
            throw new Error('AUTH_EXPIRED');
        }
    } catch (err) {
        throw err;
    }
  }

  if (!response.ok) {
      try {
        const errorData = await response.json();
        const errorMessage = errorData.error || response.statusText;
        
        throw new Error(errorMessage);

      } catch(e) {
            if (e instanceof Error && e.message !== `HTTP Error ${response.status}: ${response.statusText}` && !e.message.startsWith('Unexpected token')) {
                 throw e;
            }
          
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
  }

  if (response.status === 204) return null;

  return response.json();
};

export const authApi = {
    setToken: setAccessToken,
    register: (data: any) => apiClient('/auth/register', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
    login: (data: any) => apiClient('/auth/login', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
    logout: () => apiClient('/auth/logout', { method: 'POST' }),
    refresh: () => apiClient('/auth/refresh', { method: 'GET', skipAuth: true }) 
};
