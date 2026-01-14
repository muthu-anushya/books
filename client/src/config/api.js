// API Configuration
// Use environment variable for production, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://books-serverside.onrender.com' 
    : 'http://localhost:8000');

export default API_BASE_URL;
