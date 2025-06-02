// src/screens/GroupDetail.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// We’ll stub ChatScreen and ExpensesScreen for now.
// You should also have src/screens/ChatScreen.js and src/screens/ExpensesScreen.js
import ChatScreen     from './ChatScreen';
import ExpensesScreen from './ExpensesScreen';
// (Later you can add EventsScreen here.)

const Tab = createBottomTabNavigator();

export default function GroupDetail({ route }) {
  // We expect App.js to call: navigation.navigate('GroupDetail', { groupId, name })
  const { groupId } = route.params;

  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenOptions={{
        headerShown: false,       // We already show the group name in App.js’s Stack header
        tabBarLabelStyle: { fontSize: 14 },
        tabBarActiveTintColor: '#E91E63',
      }}
    >
      <Tab.Screen
        name="Chat"
        children={() => <ChatScreen groupId={groupId} />}
        options={{ title: 'Chat' }}
      />

      <Tab.Screen
        name="Expenses"
        children={() => <ExpensesScreen groupId={groupId} />}
        options={{ title: 'Expenses' }}
      />

      {/*
      <Tab.Screen
        name="Events"
        children={() => <EventsScreen groupId={groupId} />}
        options={{ title: 'Events' }}
      />
      */}
    </Tab.Navigator>
  );
}
