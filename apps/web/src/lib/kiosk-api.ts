import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4301/api/v1';

export const kioskApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

kioskApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const deviceId = localStorage.getItem('kiosk_device_id');
    const deviceKey = localStorage.getItem('kiosk_device_key');
    if (deviceId) config.headers['X-Device-Id'] = deviceId;
    if (deviceKey) config.headers['X-Device-Key'] = deviceKey;
  }
  return config;
});

export function isKioskConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('kiosk_device_id') && localStorage.getItem('kiosk_device_key'));
}

export function getKioskDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kiosk_device_id');
}

export function getKioskDeviceNome(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kiosk_device_nome');
}

export function setKioskConfig(deviceId: string, deviceKey: string, nome?: string) {
  localStorage.setItem('kiosk_device_id', deviceId);
  localStorage.setItem('kiosk_device_key', deviceKey);
  if (nome) localStorage.setItem('kiosk_device_nome', nome);
}

export function clearKioskConfig() {
  localStorage.removeItem('kiosk_device_id');
  localStorage.removeItem('kiosk_device_key');
  localStorage.removeItem('kiosk_device_nome');
}

export default kioskApi;
