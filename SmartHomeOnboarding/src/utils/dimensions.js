import { Dimensions, Platform } from 'react-native';

const window = Dimensions.get('window');

// On web, we render inside a 390x844 mobile frame
// so force mobile dimensions for consistent layout
export const SCREEN_WIDTH = Platform.OS === 'web' ? 390 : window.width;
export const SCREEN_HEIGHT = Platform.OS === 'web' ? 844 : window.height;
export const scale = SCREEN_WIDTH / 390;
