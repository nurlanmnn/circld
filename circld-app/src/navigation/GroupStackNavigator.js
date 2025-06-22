import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CreateGroupScreen  from '../screens/CreateGroupScreen';
import GroupList          from '../screens/GroupList';  
import GroupSettings      from '../screens/GroupSettings';   // ← new
import JoinGroupScreen    from '../screens/JoinGroupScreen';
import ExpensesScreen     from '../screens/ExpensesScreen';
import ChatScreen         from '../screens/ChatScreen';
import GroupTabs          from '../screens/GroupTabs';

const Stack = createNativeStackNavigator();

export default function GroupStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Groups">
      <Stack.Screen
        name="Groups"
        component={GroupList}
        options={{ title: 'Your Circld Groups' }}
      />

      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />

      <Stack.Screen
        name="JoinGroup"
        component={JoinGroupScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />

      <Stack.Screen
        name="GroupTabs"
        component={GroupTabs}
        options={({ route }) => ({
          title: route.params.name,
          headerShown: false,            // we'll render our own header
          gestureEnabled: true,
          tabBarStyle: { display: 'none' } ,
        })}
      />

      <Stack.Screen
        name="GroupSettings"
        component={GroupSettings}
        options={{
          title: 'Settings',
          // use default header for settings so you get the back button auto
        }}
      />

      <Stack.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ title: 'Expenses' }}
      />

      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
}
