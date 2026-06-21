import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext();

/**
 * Global state for the entire onboarding flow.
 * When backend is connected, replace the default values
 * with API responses and persist via AsyncStorage or API calls.
 */
export const AppProvider = ({ children }) => {
  // ── User Account ──────────────────────────────────────────────────────────
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [username, setUsername] = useState('JohnDoe');
  const [email, setEmail]       = useState('');

  // ── Home Setup (WelcomeSetupScreen) ───────────────────────────────────────
  const [homeName, setHomeName]           = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [location, setLocation]           = useState('');
  const [householdType, setHouseholdType] = useState('');
  const [ageGroup, setAgeGroup]           = useState('');

  // ── Rooms & Devices (AddRoomScreen) ───────────────────────────────────────
  // Each room: { id: string, name: string, devices: [{ id, name, category }] }
  const [rooms, setRooms] = useState([]);

  const addRoom = useCallback((room) => {
    setRooms((prev) => [...prev, { ...room, id: Date.now().toString() }]);
  }, []);

  const removeRoom = useCallback((roomId) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  }, []);

  const updateRoom = useCallback((roomId, updates) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, ...updates } : r))
    );
  }, []);

  // ── SOS / Security Config (SetupProtocolsScreen) ─────────────────────────
  const [sosConfig, setSosConfig] = useState({
    contactName: '',
    phoneNumber: '',
    sosTrigger: '',
    sosCancel: '',
    alertColor: '',
    duration: '',
    fallDetection: false,
    sendSms: false,
    makeVoiceCall: false,
    sendTelegram: false,
    voiceAnnouncement: 'Intruder detected! The authorities have been notified.',
  });

  // ── Gesture Mappings (GestureMappingScreen) ───────────────────────────────
  const [gestureMappings, setGestureMappings] = useState({});

  // ── Convenience: get display name ─────────────────────────────────────────
  const displayName = homeName || username || 'Home';

  const value = {
    // Account
    authToken, setAuthToken,
    isAuthenticated, setIsAuthenticated,
    isLoading, setIsLoading,
    username, setUsername,
    email, setEmail,

    // Home setup
    homeName, setHomeName,
    assistantName, setAssistantName,
    location, setLocation,
    householdType, setHouseholdType,
    ageGroup, setAgeGroup,

    // Rooms
    rooms, setRooms,
    addRoom, removeRoom, updateRoom,

    // Security
    sosConfig, setSosConfig,

    // Gestures
    gestureMappings, setGestureMappings,

    // Helpers
    displayName,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Hook to access the global app state.
 * Usage: const { homeName, setHomeName, rooms, addRoom } = useApp();
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
