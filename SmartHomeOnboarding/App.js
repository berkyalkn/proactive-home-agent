import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

function MobileFrame({ children }) {
  if (Platform.OS !== 'web') {
    return children;
  }

  return (
    <View style={webStyles.outerContainer}>
      <View style={webStyles.phoneFrame}>
        <View style={webStyles.notch} />
        <View style={webStyles.screen}>
          {children}
        </View>
        <View style={webStyles.homeIndicator}>
          <View style={webStyles.homeBar} />
        </View>
      </View>
    </View>
  );
}

const webStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#D4CFC6',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  phoneFrame: {
    width: 390,
    height: 844,
    backgroundColor: '#2C2C2C',
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#3a3a3a',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  notch: {
    width: 126,
    height: 32,
    backgroundColor: '#2C2C2C',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    alignSelf: 'center',
    zIndex: 10,
  },
  screen: {
    flex: 1,
    backgroundColor: '#EDE8DF',
    marginTop: -2,
  },
  homeIndicator: {
    height: 20,
    backgroundColor: '#EDE8DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBar: {
    width: 134,
    height: 5,
    backgroundColor: '#2C2C2C',
    borderRadius: 3,
  },
});

export default function App() {
  return (
    <AppProvider>
      <MobileFrame>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </MobileFrame>
    </AppProvider>
  );
}
