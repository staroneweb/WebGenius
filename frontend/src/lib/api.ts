import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // Only add token for protected routes (not auth routes)
  const isAuthRoute = config.url?.includes('/auth/');
  
  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasToken: true,
      tokenPreview: token.substring(0, 20) + '...'
    });
  } else if (!token && !isAuthRoute) {
    console.warn('No token found for protected route:', config.url);
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Log the error for debugging
      console.error('401 Unauthorized error:', {
        url: error.config?.url,
        message: error.response?.data?.message,
        hasToken: !!localStorage.getItem('token')
      });
      
      // Don't automatically redirect - let components handle it
      // This allows components to show error messages first
      // Components can check error.response?.status === 401 and handle accordingly
    }
    return Promise.reject(error);
  }
);

export default api;

