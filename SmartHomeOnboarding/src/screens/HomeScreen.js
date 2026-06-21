import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Easing,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { dashboardService } from '../services/dashboardService';
import { chatService } from '../services/chatService';

const { width: SW } = Dimensions.get('window');

const SERIF =
  Platform.OS === 'web'
    ? '"Georgia", "Times New Roman", serif'
    : Platform.OS === 'ios'
    ? 'Georgia'
    : 'serif';

// ── Data loaded from API ───────────────────────────────────────────────────

// ── Hamburger menu items ────────────────────────────────────────────────────
const MENU_ITEMS = [
  { id: 'gestures',  label: 'Gesture Settings',     icon: 'hand-left-outline',       screen: 'GestureMapping' },
  { id: 'emergency', label: 'Emergency Protocols',  icon: 'shield-checkmark-outline', screen: 'SetupProtocols' },
  { id: 'devices',   label: 'My Devices',           icon: 'hardware-chip-outline',    screen: null },
  { id: 'rooms',     label: 'Rooms',                icon: 'home-outline',             screen: null },
  { id: 'settings',  label: 'App Settings',         icon: 'settings-outline',         screen: null },
];

const HomeScreen = ({ navigation }) => {
  const { homeName: ctxHomeName, displayName } = useApp();

  // ── State ─────────────────────────────────────────────────────────────────
  const [envData, setEnvData]               = useState([]);
  const [lightOn, setLightOn]               = useState(true);
  const [brightness, setBrightness]         = useState(75);
  const [selectedColor, setSelectedColor]   = useState('warm');
  const [showChatbot, setShowChatbot]       = useState(false);
  const [isListening, setIsListening]       = useState(false);
  const [showMenu, setShowMenu]             = useState(false);
  const [chatMessages, setChatMessages]     = useState([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      const envResult = await dashboardService.getEnvironmentData();
      if (envResult.success) setEnvData(envResult.data);
      const lightResult = await dashboardService.getLightStatus();
      if (lightResult.success) {
        setLightOn(lightResult.data.isOn);
        setBrightness(lightResult.data.brightness);
        setSelectedColor(lightResult.data.color);
      }
      const chatRes = await chatService.getChatHistory();
      if (chatRes.success) {
        setChatMessages(chatRes.data);
      }
    };
    loadDashboard();
  }, []);

  // ── Animations ────────────────────────────────────────────────────────────
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const micPulse     = useRef(new Animated.Value(1)).current;
  const micRing      = useRef(new Animated.Value(0)).current;
  const menuSlide    = useRef(new Animated.Value(-SW * 0.75)).current;
  const menuOverlay  = useRef(new Animated.Value(0)).current;
  const chatSlide    = useRef(new Animated.Value(300)).current;
  const chatOpacity  = useRef(new Animated.Value(0)).current;

  // ── Draggable Chat FAB ────────────────────────────────────────────────────
  const chatPan = useRef(new Animated.ValueXY()).current;
  const chatPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        chatPan.setOffset({ x: chatPan.x._value, y: chatPan.y._value });
        chatPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: chatPan.x, dy: chatPan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        chatPan.flattenOffset();
        // Clamp position to screen bounds
        const MARGIN = 10;
        const FAB_SIZE = 60;
        const maxX = SW - FAB_SIZE - 24 - MARGIN; // 24 is the initial right offset
        const minX = -(SW - FAB_SIZE - 24 - MARGIN);
        const maxY = 200; // Don't go too far down
        const minY = -(600); // Don't go too far up
        const clampedX = Math.max(minX, Math.min(maxX, chatPan.x._value));
        const clampedY = Math.max(minY, Math.min(maxY, chatPan.y._value));
        Animated.spring(chatPan, {
          toValue: { x: clampedX, y: clampedY },
          friction: 7,
          useNativeDriver: false,
        }).start();
        // If the movement was very small, count it as a tap
        const distance = Math.sqrt(Math.pow(gestureState.dx, 2) + Math.pow(gestureState.dy, 2));
        if (distance < 5) {
          openChat();
        }
      }
    })
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 500, delay: 80,
      easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start();
  }, []);

  // ── Mic listening animation ───────────────────────────────────────────────
  const micPulseLoop = useRef(null);
  const startListening = useCallback(() => {
    setIsListening(true);
    micPulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    micPulseLoop.current.start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(micRing, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(micRing, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    micPulse.setValue(1);
    micRing.setValue(0);
    if (micPulseLoop.current) micPulseLoop.current.stop();
  }, []);

  // ── Menu animation ────────────────────────────────────────────────────────
  const openMenu = useCallback(() => {
    setShowMenu(true);
    Animated.parallel([
      Animated.timing(menuSlide, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(menuOverlay, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const closeMenu = useCallback(() => {
    Animated.parallel([
      Animated.timing(menuSlide, { toValue: -SW * 0.75, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(menuOverlay, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setShowMenu(false));
  }, []);

  // ── Chatbot popup animation ───────────────────────────────────────────────
  const openChat = useCallback(() => {
    setShowChatbot(true);
    Animated.parallel([
      Animated.spring(chatSlide, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
      Animated.timing(chatOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const closeChat = useCallback(() => {
    Animated.parallel([
      Animated.timing(chatSlide, { toValue: 300, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(chatOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowChatbot(false));
  }, []);

  // ── Chat handler ──────────────────────────────────────────────────────────
  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), from: 'user', text: userMessage }]);
    setChatInput('');
    const response = await chatService.sendMessage(userMessage);
    if (response.success) {
      setChatMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(), from: 'bot',
        text: response.data.message,
      }]);
    }
  }, [chatInput]);

  // ── Light settings callback ───────────────────────────────────────────────
  const handleLightSave = useCallback((data) => {
    setLightOn(data.lightOn);
    setBrightness(data.brightness);
    setSelectedColor(data.selectedColor);
  }, []);

  // Current light color hex
  const lightColorHex = (() => {
    const map = { warm: '#FFD54F', cool: '#81D4FA', daylight: '#FFF9C4', red: '#EF5350', green: '#66BB6A', blue: '#42A5F5', purple: '#AB47BC' };
    return map[selectedColor] || '#FFD54F';
  })();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE8DF" />

      {/* ═══════ TOP BAR ═══════ */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuBtn} onPress={openMenu} activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.brandMini}>H O M I E E</Text>
        </View>
        <View style={{ width: 42, height: 42 }} /> {/* Placeholder for balance */}
      </View>

      {/* ═══════ GREETING + MIC ═══════ */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>{(() => { const h = new Date().getHours(); if (h < 12) return 'Good Morning'; if (h < 18) return 'Good Afternoon'; return 'Good Evening'; })()}</Text>
          <Text style={styles.homeName}>{displayName}'s Home</Text>
        </View>

        {/* Mic button with listening state */}
        <TouchableOpacity
          style={styles.micOuter}
          onPress={isListening ? stopListening : startListening}
          activeOpacity={0.7}
        >
          {isListening && (
            <Animated.View style={[styles.micRingAnim, {
              opacity: micRing.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
              transform: [{ scale: micRing.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
            }]} />
          )}
          <Animated.View style={[styles.micCircle, isListening && styles.micCircleActive, { transform: [{ scale: micPulse }] }]}>
            <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={22} color={isListening ? '#EDE8DF' : '#2C2C2C'} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {isListening && (
        <View style={styles.listeningBar}>
          <View style={styles.listeningDot} />
          <Text style={styles.listeningText}>Listening... say a command</Text>
        </View>
      )}

      {/* ═══════ SCROLLABLE CONTENT ═══════ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ════════════ ENVIRONMENT STATUS ════════════ */}
          <View style={[styles.sectionHeader, { justifyContent: 'center' }]}>
            <Ionicons name="leaf-outline" size={15} color="#3A5A78" />
            <Text style={styles.sectionTitle}>Environment Status</Text>
          </View>

          <View style={styles.envGrid}>
            {envData.map((env) => (
              <View key={env.id} style={styles.envCard}>
                <View style={[styles.envIconWrap, { backgroundColor: env.bg }]}>
                  <Ionicons name={env.icon} size={18} color={env.color} />
                </View>
                <View style={styles.envTextArea}>
                  <Text style={styles.envLabel}>{env.label}</Text>
                  <Text style={styles.envValue}>
                    {env.value}<Text style={styles.envUnit}>{env.unit}</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ════════════ CAMERA LIVE FEED ════════════ */}
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam-outline" size={15} color="#3A5A78" />
            <Text style={styles.sectionTitle}>Camera Live Feed</Text>
          </View>

          <TouchableOpacity
            style={styles.cameraCard}
            onPress={() => navigation.navigate('CameraFeed')}
            activeOpacity={0.85}
          >
            <View style={styles.cameraPreview}>
              <Ionicons name="videocam" size={32} color="rgba(237,232,223,0.5)" />
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.cameraBottom}>
              <View style={styles.cameraInfo}>
                <Ionicons name="camera-outline" size={14} color="rgba(44,44,44,0.4)" />
                <Text style={styles.cameraName}>Living Room Camera</Text>
              </View>
              <Ionicons name="expand-outline" size={16} color="rgba(44,44,44,0.35)" />
            </View>
          </TouchableOpacity>

          {/* ════════════ SMART LIGHTING ════════════ */}
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb-outline" size={15} color="#3A5A78" />
            <Text style={styles.sectionTitle}>Smart Lighting</Text>
          </View>

          <View style={styles.lightCard}>
            <View style={styles.lightCardTop}>
              <View style={styles.lightInfo}>
                <View style={[styles.lightDot, { backgroundColor: lightOn ? lightColorHex : 'rgba(44,44,44,0.12)' }]} />
                <View>
                  <Text style={styles.lightName}>Living Room</Text>
                  <Text style={styles.lightStatus}>{lightOn ? `On · ${brightness}%` : 'Off'}</Text>
                </View>
              </View>
              <View style={styles.lightActions}>
                <TouchableOpacity
                  style={styles.lightSettingsBtn}
                  onPress={() => navigation.navigate('LightSettings', { lightOn, brightness, selectedColor, onSave: handleLightSave })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="options-outline" size={18} color="rgba(44,44,44,0.5)" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.lightToggle, lightOn && styles.lightToggleOn]}
                  onPress={() => setLightOn(!lightOn)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="power" size={17} color={lightOn ? '#EDE8DF' : 'rgba(44,44,44,0.35)'} />
                </TouchableOpacity>
              </View>
            </View>

            {lightOn && (
              <View style={styles.lightPreview}>
                <View style={[styles.lightGlow, { backgroundColor: lightColorHex + '25' }]}>
                  <Ionicons name="bulb" size={28} color={lightColorHex} />
                </View>
                <Text style={styles.lightBrightLabel}>{brightness}%</Text>
              </View>
            )}
          </View>

        </Animated.View>
      </ScrollView>

      {/* ═══════ DRAGGABLE CHAT FAB ═══════ */}
      <Animated.View
        style={[
          styles.chatFab,
          { transform: [{ translateX: chatPan.x }, { translateY: chatPan.y }] }
        ]}
        {...chatPanResponder.panHandlers}
      >
        <Ionicons name="chatbubbles" size={26} color="#EDE8DF" />
        <View style={styles.chatFabDot} />
      </Animated.View>

      {/* ═══════ CHATBOT POPUP ═══════ */}
      {showChatbot && (
        <KeyboardAvoidingView
          style={styles.chatPopupContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.chatPopup, { opacity: chatOpacity, transform: [{ translateY: chatSlide }] }]}>
            {/* Chat header */}
            <View style={styles.chatPopupHeader}>
              <View style={styles.chatPopupHeaderLeft}>
                <View style={styles.chatAvatar}>
                  <Ionicons name="chatbubble-ellipses" size={14} color="#3A5A78" />
                </View>
                <View>
                  <Text style={styles.chatPopupTitle}>Homiee</Text>
                  <Text style={styles.chatOnline}>● Online</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeChat} activeOpacity={0.7} style={styles.chatCloseBtn}>
                <Ionicons name="close" size={18} color="rgba(44,44,44,0.5)" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              style={styles.chatMsgList}
              contentContainerStyle={styles.chatMsgContent}
              showsVerticalScrollIndicator={false}
            >
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.chatBubble, msg.from === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot]}
                >
                  <Text style={[styles.chatBubbleText, msg.from === 'user' && styles.chatBubbleTextUser]}>
                    {msg.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Input */}
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Type a message..."
                placeholderTextColor="rgba(44,44,44,0.3)"
                returnKeyType="send"
                onSubmitEditing={handleSendChat}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, !chatInput.trim() && styles.chatSendBtnOff]}
                onPress={handleSendChat}
                activeOpacity={0.7}
                disabled={!chatInput.trim()}
              >
                <Ionicons name="send" size={15} color="#EDE8DF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      )}

      {/* ═══════ HAMBURGER MENU (slide from left) ═══════ */}
      {showMenu && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Overlay */}
          <Animated.View style={[styles.menuOverlay, { opacity: menuOverlay }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeMenu} activeOpacity={1} />
          </Animated.View>

          {/* Menu panel */}
          <Animated.View style={[styles.menuPanel, { transform: [{ translateX: menuSlide }] }]}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuBrand}>H O M I E E</Text>
              <Text style={styles.menuSubtitle}>{displayName}'s Home</Text>
            </View>

            <View style={styles.menuDivider} />

            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  if (item.screen) {
                    setTimeout(() => navigation.navigate(item.screen), 300);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={20} color="#3A5A78" />
                <Text style={styles.menuItemText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(44,44,44,0.2)" />
              </TouchableOpacity>
            ))}

            <View style={styles.menuDivider} />

            <View style={styles.menuFooter}>
              <Text style={styles.menuVersion}>Homiee v1.0</Text>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDE8DF' },

  // ── Top bar ─────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20, paddingBottom: 8,
  },
  menuBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(44,44,44,0.05)',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  topCenter: { alignItems: 'center' },
  brandMini: {
    fontSize: 12, fontWeight: '500', color: 'rgba(44,44,44,0.4)',
    letterSpacing: 5, fontFamily: SERIF,
  },
  chatBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(44,44,44,0.05)',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  chatDot: {
    position: 'absolute', top: 10, right: 10,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#E53935',
  },

  // ── Greeting + mic ──────────────────────────────────────────────────────
  greetingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4,
  },
  greeting: {
    fontSize: 12, color: 'rgba(44,44,44,0.4)', fontFamily: SERIF,
    letterSpacing: 0.3, marginBottom: 2,
  },
  homeName: {
    fontSize: 22, fontWeight: '400', color: '#2C2C2C', fontFamily: SERIF,
  },
  micOuter: {
    width: 56, height: 56,
    alignItems: 'center', justifyContent: 'center',
  },
  micRingAnim: {
    position: 'absolute',
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: '#3A5A78',
  },
  micCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(44,44,44,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(44,44,44,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  micCircleActive: {
    backgroundColor: '#3A5A78',
    borderColor: '#3A5A78',
    shadowColor: '#3A5A78', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  listeningBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    marginHorizontal: 20, marginTop: 12, marginBottom: 8,
    paddingVertical: 16, paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#3A5A78', // Theme blue instead of black
    shadowColor: '#3A5A78', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  listeningDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#81D4FA',
    shadowColor: '#81D4FA', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 8, elevation: 4,
  },
  listeningText: {
    fontSize: 15, color: '#EDE8DF', fontFamily: SERIF, fontWeight: '600', letterSpacing: 0.5,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },

  // ── Section headers ─────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginBottom: 12, marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '500', color: '#2C2C2C', fontFamily: SERIF,
  },

  // ── Environment grid (2x2 Small Safe Squares) ─────────────────────────
  envGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24,
    justifyContent: 'center', // Centers the cards nicely
  },
  envCard: {
    width: 130, // Fixed safe width for all phones
    height: 130, // Fixed safe height to ensure it stays square without aspectRatio bugs
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.06)',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  envIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  envTextArea: { alignItems: 'flex-start' },
  envLabel: {
    fontSize: 13, fontWeight: '700', color: '#2C2C2C', 
    fontFamily: SERIF, marginBottom: 4, letterSpacing: 0.3,
  },
  envValue: {
    fontSize: 22, fontWeight: '600', color: '#3A5A78', fontFamily: SERIF,
  },
  envUnit: {
    fontSize: 12, fontWeight: '500', color: 'rgba(58,90,120,0.6)',
  },

  // ── Camera card ─────────────────────────────────────────────────────────
  cameraCard: {
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.06)',
    marginBottom: 22,
  },
  cameraPreview: {
    height: 140,
    backgroundColor: '#161616',
    alignItems: 'center', justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(229,57,53,0.2)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' },
  liveText: { fontSize: 9, fontWeight: '800', color: '#E53935', letterSpacing: 1.2 },
  cameraBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  cameraInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cameraName: { fontSize: 13, color: '#2C2C2C', fontFamily: SERIF, fontWeight: '500' },

  // ── Light card ──────────────────────────────────────────────────────────
  lightCard: {
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.05)',
    marginBottom: 22,
  },
  lightCardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  lightInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lightDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  lightName: { fontSize: 14, fontWeight: '500', color: '#2C2C2C', fontFamily: SERIF },
  lightStatus: { fontSize: 11, color: 'rgba(44,44,44,0.4)', fontFamily: SERIF, marginTop: 1 },
  lightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lightSettingsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(44,44,44,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  lightToggle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(44,44,44,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  lightToggleOn: { backgroundColor: '#2C2C2C' },
  lightPreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingBottom: 14, paddingTop: 6,
    borderTopWidth: 1, borderTopColor: 'rgba(44,44,44,0.04)',
  },
  lightGlow: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  lightBrightLabel: {
    fontSize: 12, color: 'rgba(44,44,44,0.35)', fontFamily: SERIF,
  },

  // ── Chatbot popup ───────────────────────────────────────────────────────
  chatPopupContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  chatPopup: {
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#EDE8DF',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.12)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 12,
    maxHeight: 380,
  },
  chatPopupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(44,44,44,0.06)',
  },
  chatPopupHeaderLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  chatAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(58,90,120,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  chatPopupTitle: {
    fontSize: 14, fontWeight: '600', color: '#2C2C2C', fontFamily: SERIF,
  },
  chatOnline: {
    fontSize: 9, color: '#43A047', fontFamily: SERIF,
  },
  chatCloseBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(44,44,44,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  chatMsgList: { maxHeight: 220 },
  chatMsgContent: { paddingVertical: 12, paddingHorizontal: 16, gap: 8 },
  chatBubble: {
    maxWidth: '82%', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 14,
  },
  chatBubbleBot: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.05)',
    borderBottomLeftRadius: 4,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#2C2C2C',
    borderBottomRightRadius: 4,
  },
  chatBubbleText: {
    fontSize: 13, color: '#2C2C2C', fontFamily: SERIF, lineHeight: 19,
  },
  chatBubbleTextUser: { color: '#EDE8DF' },
  chatInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(44,44,44,0.06)',
  },
  chatInput: {
    flex: 1, fontSize: 13, color: '#2C2C2C', fontFamily: SERIF,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1, borderColor: 'rgba(44,44,44,0.08)',
  },
  chatSendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2C2C2C',
    alignItems: 'center', justifyContent: 'center',
  },
  chatSendBtnOff: { backgroundColor: 'rgba(44,44,44,0.12)' },

  // ── Draggable FAB ───────────────────────────────────────────────────────
  chatFab: {
    position: 'absolute', bottom: 40, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#3A5A78',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 12,
    zIndex: 999,
  },
  chatFabDot: {
    position: 'absolute', top: 12, right: 12,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#E53935',
    borderWidth: 2, borderColor: '#3A5A78',
  },

  // ── Hamburger menu ──────────────────────────────────────────────────────
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  menuPanel: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    width: SW * 0.72,
    backgroundColor: '#EDE8DF',
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 10,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
  },
  menuHeader: {
    paddingHorizontal: 24, paddingBottom: 20,
  },
  menuBrand: {
    fontSize: 14, fontWeight: '500', color: '#2C2C2C',
    letterSpacing: 6, fontFamily: SERIF, marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13, color: 'rgba(44,44,44,0.4)', fontFamily: SERIF,
  },
  menuDivider: {
    height: 1, backgroundColor: 'rgba(44,44,44,0.08)',
    marginHorizontal: 24, marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 24,
  },
  menuItemText: {
    flex: 1, fontSize: 15, color: '#2C2C2C', fontFamily: SERIF,
  },
  menuFooter: {
    paddingHorizontal: 24, paddingTop: 16,
  },
  menuVersion: {
    fontSize: 11, color: 'rgba(44,44,44,0.25)', fontFamily: SERIF,
  },
});

export default HomeScreen;
