import { delay, mockResponse } from './apiConfig';
import { MOCK_CHAT_MESSAGES, MOCK_BOT_RESPONSES } from './mockData/dashboard';

/**
 * @endpoint POST /chat/send
 */
export const sendMessage = async (message) => {
  await delay(1000);
  
  // Pick a random response from mock data
  const randomResponse = MOCK_BOT_RESPONSES[Math.floor(Math.random() * MOCK_BOT_RESPONSES.length)];
  
  return mockResponse({ message: randomResponse });
};

/**
 * @endpoint GET /chat/history
 */
export const getChatHistory = async () => {
  await delay(500);
  return mockResponse(MOCK_CHAT_MESSAGES);
};

/**
 * @endpoint POST /chat/voice-command
 */
export const processVoiceCommand = async (audio) => {
  await delay(1200);
  return mockResponse({ success: true, transcribedText: 'turn on the lights', actionTaken: true });
};

export const chatService = {
  sendMessage,
  getChatHistory,
  processVoiceCommand
};
