import axios from 'axios';
import { getToken, clearAuth } from './auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export const healthApi = {
  // Symptoms
  getSymptoms: () => api.get('/symptoms'),
  createSymptom: (data: any) => api.post('/symptoms', data),
  updateSymptom: (id: string, data: any) => api.put(`/symptoms/${id}`, data),
  deleteSymptom: (id: string) => api.delete(`/symptoms/${id}`),
  analyzeSymptom: (id: string) => api.post(`/symptoms/${id}/analyze`),

  // Medications
  getMedications: () => api.get('/medications'),
  getTodayMedications: () => api.get('/medications/today'),
  createMedication: (data: any) => api.post('/medications', data),
  updateMedication: (id: string, data: any) => api.put(`/medications/${id}`, data),
  deleteMedication: (id: string) => api.delete(`/medications/${id}`),
  logDose: (id: string, data: any) => api.post(`/medications/${id}/log`, data),

  // Appointments
  getAppointments: () => api.get('/appointments'),
  getUpcomingAppointments: () => api.get('/appointments/upcoming'),
  createAppointment: (data: any) => api.post('/appointments', data),
  updateAppointment: (id: string, data: any) => api.put(`/appointments/${id}`, data),
  deleteAppointment: (id: string) => api.delete(`/appointments/${id}`),
  addAppointmentNotes: (id: string, data: any) => api.post(`/appointments/${id}/notes`, data),

  // Mood
  getMoodLogs: () => api.get('/mood'),
  getMoodTrends: (days?: number) => api.get(`/mood/trends?days=${days || 7}`),
  getLatestMood: () => api.get('/mood/latest'),
  createMoodLog: (data: any) => api.post('/mood', data),
  updateMoodLog: (id: string, data: any) => api.put(`/mood/${id}`, data),
  deleteMoodLog: (id: string) => api.delete(`/mood/${id}`),

  // Medical History
  getHistory: () => api.get('/history'),
  createHistory: (data: any) => api.post('/history', data),
  updateHistory: (id: string, data: any) => api.put(`/history/${id}`, data),
  deleteHistory: (id: string) => api.delete(`/history/${id}`),

  // Allergies
  getAllergies: () => api.get('/allergies'),
  createAllergy: (data: any) => api.post('/allergies', data),
  deleteAllergy: (id: string) => api.delete(`/allergies/${id}`),

  // Chat
  sendMessage: (messages: any[], config = {}) =>
    api.post('/chat', { messages }, { ...config, responseType: 'text' }),
};

export default api;
