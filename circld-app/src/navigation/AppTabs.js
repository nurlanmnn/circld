import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GroupStackNavigator from './GroupStackNavigator';
import AccountScreen       from '../screens/Auth/AccountScreen';  // we’ll build this next
import { Ionicons }        from '@expo/vector-icons'; 

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator 
        initialRouteName="GroupsTab"
        screenOptions={{ headerShown: false }}
    >
        <Tab.Screen
        // give this tab its own route name
        name="GroupsTab"
        component={GroupStackNavigator}
        options={{
            headerShown: false,
            // this label is what the user sees
            tabBarLabel: 'Groups',
            tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
            ),
        }}
        />
        <Tab.Screen
            name="Account"
            component={AccountScreen}
            options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-circle-outline" color={color} size={size} />
            ),
            }}
        />
    </Tab.Navigator>
  );
}
