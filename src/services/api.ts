import axios from 'axios';

const API_BASE_URL = 'https://app.peoplepowerco.com/cloud/json';

export const careApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

careApi.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('care_api_key');
  if (apiKey) {
    config.headers['API_KEY'] = apiKey;
  }
  return config;
});

export const authService = {
  loginWithPassword: async (username: string, password: string) => {
    const response = await careApi.get('/login', {
      params: { username },
      headers: { PASSWORD: password },
    });
    return response.data;
  },
  sendPasscode: async (username: string) => {
    const response = await careApi.get('/passcode', {
      params: { username, prefDeliveryType: 3 }, // 3 for SMS
    });
    return response.data;
  },
  loginWithPasscode: async (username: string, passcode: string) => {
    const response = await careApi.get('/login', {
      params: { username },
      headers: { passcode },
    });
    return response.data;
  },
  getUserInfo: async () => {
    const response = await careApi.get('/user');
    return response.data;
  },
  getDevices: async (locationId: number) => {
    const response = await careApi.get('/devices', {
      params: { locationId },
    });
    return response.data;
  },
  getSettings: async () => {
      const response = await careApi.get('/settings');
      return response.data;
  },
  getWsServer: async () => {
      const response = await careApi.get('/settingsServer/wsapi');
      return response.data;
  }
};
