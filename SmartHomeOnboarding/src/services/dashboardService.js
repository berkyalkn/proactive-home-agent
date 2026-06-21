import { delay, mockResponse } from './apiConfig';
import { MOCK_ENV_DATA, MOCK_CAMERA_FEEDS, MOCK_LIGHT_STATUS } from './mockData/dashboard';

/**
 * @endpoint GET /dashboard/environment
 */
export const getEnvironmentData = async () => {
  await delay(500);
  return mockResponse(MOCK_ENV_DATA);
};

/**
 * @endpoint GET /dashboard/cameras
 */
export const getCameraFeeds = async () => {
  await delay(300);
  return mockResponse(MOCK_CAMERA_FEEDS);
};

/**
 * @endpoint GET /dashboard/lights
 */
export const getLightStatus = async () => {
  await delay(300);
  return mockResponse(MOCK_LIGHT_STATUS);
};

/**
 * @endpoint PUT /dashboard/lights/:id
 */
export const updateLightSettings = async (settings) => {
  await delay(400);
  return mockResponse({ success: true, settings });
};

/**
 * @endpoint POST /dashboard/lights/:id/toggle
 */
export const toggleLight = async (lightId, state) => {
  await delay(200);
  return mockResponse({ success: true, state });
};

export const dashboardService = {
  getEnvironmentData,
  getCameraFeeds,
  getLightStatus,
  updateLightSettings,
  toggleLight
};
