// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LoginScreen       from './src/screens/Auth/LoginScreen';
import SignupScreen      from './src/screens/Auth/SignupScreen';
import VerifyCodeScreen  from './src/screens/Auth/VerifyCodeScreen';
import AppTabs           from './src/navigation/AppTabs';
import VerifyEmailChangeScreen from './src/screens/Auth/VerifyEmailChangeScreen';
import ForgotPasswordScreen  from './src/screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen   from './src/screens/Auth/ResetPasswordScreen';

const RootStack = createNativeStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {/* Auth flow */}
          <RootStack.Screen name="Login"      component={LoginScreen} />
          <RootStack.Screen name="Signup"     component={SignupScreen} />
          <RootStack.Screen name="VerifyCode" component={VerifyCodeScreen} />

          <RootStack.Screen
            name="VerifyEmailChange"
            component={VerifyEmailChangeScreen}
            options={{ headerShown:false }}
          />
          {/* override headerShown for ForgotPassword */}
        <RootStack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{
            headerShown: true,
            title: 'Forgot Password',
          }}
        />

        {/* override for ResetPassword too */}
        <RootStack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{
            headerShown: true,
            title: 'Reset Password',
          }}
        />

        {/* once you’re authenticated… */}
        <RootStack.Screen name="Main" component={AppTabs} />
        </RootStack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
