import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Your backend API base URL
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized, token might be expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      // Redirect to login page
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;
