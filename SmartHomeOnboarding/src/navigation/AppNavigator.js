import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoadingScreen from '../screens/LoadingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginRegisterScreen from '../screens/LoginRegisterScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import AccountCreatedLoadingScreen from '../screens/AccountCreatedLoadingScreen';
import WelcomeSetupScreen from '../screens/WelcomeSetupScreen';
import AddRoomScreen from '../screens/AddRoomScreen';
import RoomLayoutScreen from '../screens/RoomLayoutScreen';
import DeviceSelectScreen from '../screens/DeviceSelectScreen';
import PersonalizeAssistantScreen from '../screens/PersonalizeAssistantScreen';
import VoiceRecognitionScreen from '../screens/VoiceRecognitionScreen';
import FaceRecognitionScreen from '../screens/FaceRecognitionScreen';
import SecurityProtocolScreen from '../screens/SecurityProtocolScreen';
import SetupProtocolsScreen from '../screens/SetupProtocolsScreen';
import HandControlScreen from '../screens/HandControlScreen';
import GestureMappingScreen from '../screens/GestureMappingScreen';
import AlmostReadyScreen from '../screens/AlmostReadyScreen';
import FinalLoadingScreen from '../screens/FinalLoadingScreen';
import SetupCompleteScreen from '../screens/SetupCompleteScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraFeedScreen from '../screens/CameraFeedScreen';
import LightSettingsScreen from '../screens/LightSettingsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          contentStyle: { backgroundColor: '#EDE8DF' },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animation: 'fade', animationDuration: 600 }}
        />
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ animation: 'fade', animationDuration: 600 }}
        />
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ animation: 'fade', animationDuration: 800 }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: 'fade_from_bottom', animationDuration: 800 }}
        />
        <Stack.Screen
          name="LoginRegister"
          component={LoginRegisterScreen}
          options={{ animation: 'fade', animationDuration: 800 }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ animation: 'slide_from_right', animationDuration: 350, gestureEnabled: true }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ animation: 'slide_from_right', animationDuration: 350, gestureEnabled: true }}
        />
        <Stack.Screen
          name="AccountCreatedLoading"
          component={AccountCreatedLoadingScreen}
          options={{ animation: 'fade', animationDuration: 600 }}
        />
        <Stack.Screen
          name="WelcomeSetup"
          component={WelcomeSetupScreen}
          options={{ animation: 'fade', animationDuration: 800 }}
        />
        <Stack.Screen
          name="AddRoom"
          component={AddRoomScreen}
          options={{ animation: 'slide_from_right', animationDuration: 400 }}
        />
        <Stack.Screen
          name="RoomLayout"
          component={RoomLayoutScreen}
          options={{ animation: 'slide_from_right', animationDuration: 350 }}
        />
        <Stack.Screen
          name="DeviceSelect"
          component={DeviceSelectScreen}
          options={{ animation: 'slide_from_right', animationDuration: 350, gestureEnabled: true }}
        />
        <Stack.Screen
          name="PersonalizeAssistant"
          component={PersonalizeAssistantScreen}
          options={{ animation: 'fade', animationDuration: 700 }}
        />
        <Stack.Screen
          name="VoiceRecognition"
          component={VoiceRecognitionScreen}
          options={{ animation: 'slide_from_right', animationDuration: 400 }}
        />
        <Stack.Screen
          name="FaceRecognition"
          component={FaceRecognitionScreen}
          options={{ animation: 'slide_from_right', animationDuration: 400 }}
        />
        <Stack.Screen
          name="SecurityProtocol"
          component={SecurityProtocolScreen}
          options={{ animation: 'slide_from_right', animationDuration: 400 }}
        />
        <Stack.Screen
          name="SetupProtocols"
          component={SetupProtocolsScreen}
          options={{ animation: 'slide_from_right', animationDuration: 400 }}
        />
        <Stack.Screen
          name="HandControl"
          component={HandControlScreen}
          options={{ animation: 'slide_from_right', animationDuration: 400 }}
        />
        <Stack.Screen
          name="GestureMapping"
          component={GestureMappingScreen}
          options={{ animation: 'slide_from_right', animationDuration: 400 }}
        />
        <Stack.Screen
          name="AlmostReady"
          component={AlmostReadyScreen}
          options={{ animation: 'fade', animationDuration: 600 }}
        />
        <Stack.Screen
          name="FinalLoading"
          component={FinalLoadingScreen}
          options={{ animation: 'fade', animationDuration: 600 }}
        />
        <Stack.Screen
          name="SetupComplete"
          component={SetupCompleteScreen}
          options={{ animation: 'fade', animationDuration: 800 }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ animation: 'fade', animationDuration: 1000 }}
        />
        <Stack.Screen
          name="CameraFeed"
          component={CameraFeedScreen}
          options={{ animation: 'fade', animationDuration: 300 }}
        />
        <Stack.Screen
          name="LightSettings"
          component={LightSettingsScreen}
          options={{ animation: 'slide_from_right', animationDuration: 350 }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
