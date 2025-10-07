import axios from 'axios';

// Set the base URL for all axios requests
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create a custom axios instance with base URL
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log configuration for debugging
console.log('Axios configured with baseURL:', API_URL);

export default axiosInstance;

