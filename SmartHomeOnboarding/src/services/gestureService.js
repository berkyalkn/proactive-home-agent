import { delay, mockResponse } from './apiConfig';
import { AVAILABLE_GESTURES, DEVICE_CONFIGS } from './mockData/devices';

/**
 * @endpoint GET /gestures/mappings
 */
export const getGestureMappings = async () => {
  await delay(500);
  return mockResponse(null); // No existing mappings initially
};

/**
 * @endpoint PUT /gestures/mappings
 */
export const saveGestureMappings = async (mappings) => {
  await delay(800);
  return mockResponse({ success: true, mappings });
};

/**
 * @endpoint GET /gestures/available
 */
export const getAvailableGestures = async () => {
  await delay(300);
  return mockResponse(AVAILABLE_GESTURES);
};

/**
 * @endpoint GET /gestures/device-configs
 */
export const getDeviceConfigs = async () => {
  await delay(300);
  return mockResponse(DEVICE_CONFIGS);
};

/**
 * @endpoint GET /gestures/confirmed-devices
 */
export const getConfirmedDevices = async () => {
  await delay(400);
  // Mocking the globally confirmed device categories for this demo
  return mockResponse(['bulbs', 'plugs']);
};

export const gestureService = {
  getGestureMappings,
  saveGestureMappings,
  getAvailableGestures,
  getDeviceConfigs,
  getConfirmedDevices
};
