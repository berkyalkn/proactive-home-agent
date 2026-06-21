import { delay, mockResponse } from './apiConfig';
import { SOS_TRIGGERS, SOS_CANCELS, ALERT_COLORS, DURATIONS } from './mockData/devices';

/**
 * @endpoint GET /security/sos
 */
export const getSOSConfig = async () => {
  await delay(500);
  return mockResponse(null); // No config initially
};

/**
 * @endpoint PUT /security/sos
 */
export const saveSOSConfig = async (config) => {
  await delay(800);
  return mockResponse({ success: true, config });
};

/**
 * @endpoint GET /security/sos/triggers
 */
export const getSOSTriggers = async () => {
  await delay(300);
  return mockResponse(SOS_TRIGGERS);
};

/**
 * @endpoint GET /security/sos/cancels
 */
export const getSOSCancels = async () => {
  await delay(300);
  return mockResponse(SOS_CANCELS);
};

/**
 * @endpoint GET /security/alert-colors
 */
export const getAlertColors = async () => {
  await delay(300);
  return mockResponse(ALERT_COLORS);
};

/**
 * @endpoint GET /security/durations
 */
export const getDurations = async () => {
  await delay(300);
  return mockResponse(DURATIONS);
};

/**
 * @endpoint POST /security/voice-profile
 */
export const saveVoiceData = async (audioBlob) => {
  await delay(1500);
  return mockResponse({ success: true });
};

/**
 * @endpoint POST /security/face-profile
 */
export const saveFaceData = async (images) => {
  await delay(2000);
  return mockResponse({ success: true });
};

export const securityService = {
  getSOSConfig,
  saveSOSConfig,
  getSOSTriggers,
  getSOSCancels,
  getAlertColors,
  getDurations,
  saveVoiceData,
  saveFaceData
};
