import axios from 'axios';
import { convertKeysToCamelCase } from '../utils/caseConverter';

// In dev mode, use relative URL so requests go through Vite's proxy (avoids CORS).
// In production builds, use the full API URL from env.
const API_BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:7001');
const DEFAULT_TENANT = import.meta.env.VITE_DEFAULT_TENANT || '1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId') || DEFAULT_TENANT;
  config.headers['X-Tenant-Id'] = tenantId;

  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

client.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = convertKeysToCamelCase(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    if (error.response?.status === 429) {
      console.warn('Rate limited — retrying in 2s');
      return new Promise((resolve) => {
        setTimeout(() => resolve(client(error.config)), 2000);
      });
    }
    return Promise.reject(error);
  }
);

export default client;

export function setTenantId(id: string) {
  localStorage.setItem('tenantId', id);
}

export function getTenantId(): string {
  return localStorage.getItem('tenantId') || DEFAULT_TENANT;
}
