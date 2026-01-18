import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at?: number;
  last_login?: number;
}

export interface Tunnel {
  id: string;
  user_id: string;
  name: string;
  local_port: number;
  remote_port: number;
  protocol: 'tcp' | 'udp';
  status: 'active' | 'inactive' | 'error';
  created_at: number;
  updated_at: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),

  register: (username: string, email: string, password: string) =>
    api.post<LoginResponse>('/auth/register', { username, email, password }),

  me: () => api.get<User>('/auth/me'),
};

// Tunnel API
export const tunnelAPI = {
  getAll: () => api.get<Tunnel[]>('/tunnels'),

  getAllAdmin: () => api.get<Tunnel[]>('/tunnels/all'),

  getById: (id: string) => api.get<Tunnel>(`/tunnels/${id}`),

  create: (data: {
    name: string;
    local_port: number;
    remote_port: number;
    protocol?: 'tcp' | 'udp';
  }) => api.post<Tunnel>('/tunnels', data),

  update: (id: string, data: Partial<{
    name: string;
    local_port: number;
    remote_port: number;
    protocol: 'tcp' | 'udp';
  }>) => api.put<Tunnel>(`/tunnels/${id}`, data),

  delete: (id: string) => api.delete(`/tunnels/${id}`),
};

// User API
export const userAPI = {
  getAll: () => api.get<User[]>('/users'),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export default api;
