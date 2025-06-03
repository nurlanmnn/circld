// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LoginScreen from './src/screens/Auth/LoginScreen';
import SignupScreen  from './src/screens/Auth/SignupScreen';
import CreateGroupScreen  from './src/screens/CreateGroupScreen';
import GroupList from './src/screens/GroupList';
import GroupDetail   from './src/screens/GroupDetail';
// (Import other screens as you build them)

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{ title: 'New Group' }}
          />
          <Stack.Screen
            name="Groups"
            component={GroupList}
            options={{ title: 'Your Circld Groups' }}
          />

          <Stack.Screen
            name="GroupDetail"
            component={GroupDetail}
            options={({ route }) => ({ title: route.params.name })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}