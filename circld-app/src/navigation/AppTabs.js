// src/navigation/AppTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import GroupStackNavigator from './GroupStackNavigator';
import AccountScreen       from '../screens/Auth/AccountScreen';

const Tab = createBottomTabNavigator();

// helper: if the focused nested screen is one of these, hide the tab bar
function shouldTabBarBeVisible(route) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Groups';
  // list any nested screens under Groups that should hide the footer
  const hiddenOn = ['GroupDetail', 'Expenses', 'Chat'];
  return !hiddenOn.includes(routeName);
}

export default function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="GroupsTab"
        component={GroupStackNavigator}
        options={({ route }) => ({
          tabBarLabel: 'Groups',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
          // dynamically hide/show
          tabBarStyle: shouldTabBarBeVisible(route)
            ? {}
            : { display: 'none' },
        })}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
