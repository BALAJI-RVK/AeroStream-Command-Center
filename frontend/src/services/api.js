import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
});

// Health
export const getHealth = () => api.get('/health');

// Flights
export const getFlights = (limit = 50) => api.get(`/flights?limit=${limit}`);
export const getFlight = (id) => api.get(`/flights/${id}`);

// Predictions
export const predictDelay = (data) => api.post('/predict', data);

// Mitigation
export const getMitigation = (data) => api.post('/mitigate', data);

// Weather
export const getWeather = (code) => api.get(`/weather/${code}`);

// KPIs
export const getKPIs = () => api.get('/kpis');

// AI Brief
export const getAIBrief = () => api.get('/ai-brief');

// Analytics
export const getAnalyticsSummary = () => api.get('/analytics/summary');
export const getAnalyticsTrends = () => api.get('/analytics/trends');

// Cache
export const getCacheStats = () => api.get('/cache/stats');
export const clearCache = () => api.post('/cache/clear');

// Model
export const getModelInfo = () => api.get('/model/info');

// Settings
export const updateSettings = (data) => api.post('/settings/env', data);

// Airports
export const getAirports = () => api.get('/airports');

export default api;
