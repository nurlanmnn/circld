import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupList         from '../screens/GroupList';
import GroupDetail       from '../screens/GroupDetail';
import JoinGroupScreen   from '../screens/JoinGroupScreen';
import ExpensesScreen    from '../screens/ExpensesScreen';
import ChatScreen        from '../screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function GroupStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Groups">
      <Stack.Screen
        name="Groups"
        component={GroupList}
        options={{ title: 'Your Circld Groups' }}
      />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'New Group' }}/>
      <Stack.Screen name="JoinGroup"   component={JoinGroupScreen}   options={{ title: 'Join a Group' }}/>
      <Stack.Screen name="GroupDetail" component={GroupDetail}       options={({ route }) => ({ title: route.params.name })}/>
      <Stack.Screen name="Expenses"    component={ExpensesScreen}    options={{ title: 'Expenses' }}/>
      <Stack.Screen name="Chat"        component={ChatScreen}        options={{ title: 'Chat' }}/>
    </Stack.Navigator>
  );
}
