import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const useAuthenticatedFetch = () => {
  const { token, refreshToken, logout } = useAuth();

  const authenticatedFetch = useCallback(async (
    url: string, 
    options: FetchOptions = {}
  ): Promise<Response> => {
    const makeRequest = async (authToken: string | null) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      return fetch(url, {
        ...options,
        headers,
      });
    };

    // First attempt with current token
    let response = await makeRequest(token);

    // If we get 401 and have a token, try to refresh
    if (response.status === 401 && token) {
      console.log('Token expired, attempting refresh...');
      const refreshSuccess = await refreshToken();
      
      if (refreshSuccess) {
        // Get the new token from localStorage since context might not be updated yet
        const newToken = localStorage.getItem('auth_token');
        response = await makeRequest(newToken);
      } else {
        // Refresh failed, logout user
        logout();
        throw new Error('Session expired. Please log in again.');
      }
    }

    return response;
  }, [token, refreshToken, logout]);

  return authenticatedFetch;
};

export default useAuthenticatedFetch;