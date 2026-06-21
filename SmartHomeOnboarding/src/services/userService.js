import { delay, mockResponse } from './apiConfig';
import { MOCK_USERS } from './mockData/users';

/**
 * @endpoint GET /users/me
 */
export const getProfile = async () => {
  await delay(500);
  return mockResponse(MOCK_USERS[0]);
};

/**
 * @endpoint PUT /users/me
 */
export const updateProfile = async (data) => {
  await delay(800);
  return mockResponse({ ...MOCK_USERS[0], ...data });
};

/**
 * @endpoint POST /users/me/home-setup
 */
export const saveHomeSetup = async (setupData) => {
  await delay(1000);
  // setupData expects: homeName, assistantName, location, householdType, ageGroup
  return mockResponse({ success: true, savedData: setupData });
};

export const userService = {
  getProfile,
  updateProfile,
  saveHomeSetup
};
