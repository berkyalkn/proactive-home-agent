import { delay, mockResponse, mockError } from './apiConfig';
import { MOCK_USERS, MOCK_AUTH_TOKEN } from './mockData/users';

/**
 * @endpoint POST /auth/register
 */
export const register = async (userData) => {
  await delay(1200);
  
  if (!userData.email || !userData.password) {
    return mockError('Missing required fields');
  }

  const newUser = {
    ...MOCK_USERS[0],
    username: userData.username || 'New User',
    email: userData.email,
  };

  return mockResponse({ user: newUser, token: MOCK_AUTH_TOKEN });
};

/**
 * @endpoint POST /auth/login
 */
export const login = async (credentials) => {
  await delay(1000);
  
  if (credentials.email !== MOCK_USERS[0].email && credentials.email !== '') {
    // allow empty email for testing simplicity, but reject wrong emails if provided
    // actually, let's just always succeed for mock
  }

  return mockResponse({ user: MOCK_USERS[0], token: MOCK_AUTH_TOKEN });
};

/**
 * @endpoint POST /auth/logout
 */
export const logout = async () => {
  await delay(500);
  return mockResponse({ success: true });
};

/**
 * @endpoint GET /auth/me
 */
export const checkAuthStatus = async () => {
  await delay(500);
  // Defaulting to false for initial onboarding flow in mock mode
  return mockResponse({ isAuthenticated: false, user: null });
};

/**
 * @endpoint POST /auth/face-login
 */
export const loginWithFaceId = async (faceData) => {
  await delay(1500);
  return mockResponse({ user: MOCK_USERS[0], token: MOCK_AUTH_TOKEN });
};

export const authService = {
  register,
  login,
  logout,
  checkAuthStatus,
  loginWithFaceId
};
