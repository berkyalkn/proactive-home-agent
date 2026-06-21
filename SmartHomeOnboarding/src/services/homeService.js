import { delay, mockResponse } from './apiConfig';
import { DEVICE_CATEGORIES, MOCK_DEVICES_BY_CATEGORY } from './mockData/devices';

/**
 * @endpoint GET /home/rooms
 */
export const getRooms = async () => {
  await delay(500);
  return mockResponse([]); // return empty initially, or mock rooms
};

/**
 * @endpoint POST /home/rooms
 */
export const addRoom = async (roomData) => {
  await delay(600);
  return mockResponse({ id: `room_${Date.now()}`, ...roomData });
};

/**
 * @endpoint DELETE /home/rooms/:id
 */
export const removeRoom = async (roomId) => {
  await delay(400);
  return mockResponse({ success: true });
};

/**
 * @endpoint POST /home/rooms/layout
 */
export const saveRoomLayout = async (rooms) => {
  await delay(800);
  return mockResponse({ success: true, rooms });
};

/**
 * @endpoint GET /home/device-categories
 */
export const getDeviceCategories = async () => {
  await delay(300);
  return mockResponse(DEVICE_CATEGORIES);
};

/**
 * @endpoint GET /home/devices?category=:categoryId
 */
export const getDevicesByCategory = async (categoryId) => {
  await delay(600);
  const devices = MOCK_DEVICES_BY_CATEGORY[categoryId] || [];
  return mockResponse(devices);
};

/**
 * @endpoint POST /home/rooms/:roomId/devices
 */
export const addDeviceToRoom = async (roomId, device) => {
  await delay(500);
  return mockResponse({ success: true });
};

export const homeService = {
  getRooms,
  addRoom,
  removeRoom,
  saveRoomLayout,
  getDeviceCategories,
  getDevicesByCategory,
  addDeviceToRoom
};
