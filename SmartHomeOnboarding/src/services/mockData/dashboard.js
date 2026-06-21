export const MOCK_ENV_DATA = [
  { id: 'temp', label: 'Temperature', value: '23.5°', unit: 'C', icon: 'thermometer-outline', color: '#E53935', bg: 'rgba(229,57,53,0.08)' },
  { id: 'humidity', label: 'Humidity', value: '58', unit: '%', icon: 'water-outline', color: '#1E88E5', bg: 'rgba(30,136,229,0.08)' },
  { id: 'motion', label: 'Motion', value: 'Clear', unit: '', icon: 'walk-outline', color: '#43A047', bg: 'rgba(67,160,71,0.08)' },
  { id: 'light', label: 'Light', value: '420', unit: ' lx', icon: 'sunny-outline', color: '#FB8C00', bg: 'rgba(251,140,0,0.08)' },
];

export const MOCK_CAMERA_FEEDS = [
  { id: 'cam_1', name: 'Living Room Camera', status: 'online', isRecording: false },
  { id: 'cam_2', name: 'Front Door Camera', status: 'online', isRecording: true },
];

export const MOCK_LIGHT_STATUS = {
  id: 'light_1',
  name: 'Living Room',
  isOn: true,
  brightness: 75,
  color: 'warm',
};

export const MOCK_CHAT_MESSAGES = [
  { id: '1', from: 'bot', text: "Hello! I'm Homiee. How can I help you?" },
];

export const MOCK_BOT_RESPONSES = [
  "Got it! I'll take care of that for you. 🏠",
  "Sure thing! Your smart home is adjusting now. ✨",
  "I've noted that. Would you like me to automate this? 🤖",
  "Done! Everything is set up as you requested. 👍",
  "Great question! Let me check your device status... All systems normal. 📊",
];
