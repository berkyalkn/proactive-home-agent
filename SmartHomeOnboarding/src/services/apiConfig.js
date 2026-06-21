export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:8000/api/v1',
  WS_URL: 'ws://192.168.1.100:8000/ws',
  TIMEOUT: 10000,
  IS_MOCK: true,
};

// Gerçekçi gecikme simülasyonu (500ms - 1500ms arası)
export const delay = (ms) => {
  const actualDelay = ms || Math.floor(Math.random() * 1000) + 500;
  return new Promise(resolve => setTimeout(resolve, actualDelay));
};

export const mockResponse = (data, success = true) => ({
  success,
  data,
  error: success ? null : 'Bir hata oluştu',
  timestamp: new Date().toISOString(),
});

export const mockError = (message) => ({
  success: false,
  data: null,
  error: message,
  timestamp: new Date().toISOString(),
});
