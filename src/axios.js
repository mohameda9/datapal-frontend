import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8000', // Replace with your FastAPI backend URL
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  export default instance;