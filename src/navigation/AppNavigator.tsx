import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, MainTabParamList } from '../types';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import SavedInspectionsScreen from '../screens/SavedInspectionsScreen';
import CompareSelectScreen from '../screens/CompareSelectScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VehicleDetailsScreen from '../screens/VehicleDetailsScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import InspectionSummaryScreen from '../screens/InspectionSummaryScreen';
import CompareResultScreen from '../screens/CompareResultScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const HEADER_STYLE = {
  backgroundColor: '#242830',
} as const;

const HEADER_TINT = '#F1F5F9';

const HEADER_TITLE_STYLE = {
  fontWeight: '600' as const,
  color: '#F1F5F9',
};

const CARD_STYLE = {
  backgroundColor: '#1A1D21',
} as const;

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#242830',
          borderTopColor: '#3A4055',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedInspectionsScreen}
        options={{
          tabBarLabel: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bookmark" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Compare"
        component={CompareSelectScreen}
        options={{
          tabBarLabel: 'Compare',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="compare-arrows" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

type AppNavigatorProps = {
  initialRoute: 'Onboarding' | 'MainTabs';
};

function AppNavigator({ initialRoute }: AppNavigatorProps): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: HEADER_STYLE,
          headerTintColor: HEADER_TINT,
          headerTitleStyle: HEADER_TITLE_STYLE,
          cardStyle: CARD_STYLE,
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VehicleDetails"
          component={VehicleDetailsScreen}
          options={{ title: 'Vehicle Details' }}
        />
        <Stack.Screen
          name="Checklist"
          component={ChecklistScreen}
          options={({ route }) => ({
            title:
              route.params && typeof route.params.sectionIndex === 'number'
                ? `Section ${route.params.sectionIndex + 1} of ${
                    route.params.totalSections
                  }`
                : 'Checklist',
          })}
        />
        <Stack.Screen
          name="InspectionSummary"
          component={InspectionSummaryScreen}
          options={{ title: 'Inspection Summary' }}
        />
        <Stack.Screen
          name="CompareResult"
          component={CompareResultScreen}
          options={{ title: 'Comparison' }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ title: 'Privacy Policy' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
