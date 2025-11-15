import axios from 'axios';
const API = window.__API_URL__ || 'http://localhost:4000';
export const fetchHistory = (ticker) => axios.get(`${API}/api/history/${ticker}`);
