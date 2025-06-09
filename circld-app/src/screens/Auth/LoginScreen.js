// src/screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { client } from '../../api/client';
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Missing fields', 'Enter both username and password.');
      return;
    }
    try {
      const { data } = await client.post('token/', { username, password });
      await SecureStore.setItemAsync('accessToken', data.access);
      await SecureStore.setItemAsync('refreshToken', data.refresh);
      navigation.replace('Groups');
    } catch (err) {
      // If backend returns 401 (user not active/verified), show a special message
      if (err.response?.status === 401) {
          return Alert.alert(
            'Email not verified',
            'Please verify your email before logging in.'
          );
        }
        // Fallback for other errors
        Alert.alert('Login failed', 'Check your credentials and try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../../assets/logo_circld.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <View style={styles.buttonContainer}>
            <Button title="Log In" onPress={login} />
          </View>

          <View style={styles.footer}>
            <Text>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.replace('Signup')}>
              <Text style={styles.signupLink}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  logo: {
    width: width * 0.52,       // 60% of screen width
    height: width * 0.52,      // keep it square
    alignSelf: 'center',
    marginBottom: 80,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  signupLink: {
    color: '#E91E63',
    fontWeight: '500',
  },
});

