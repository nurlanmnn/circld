import React, { useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { client } from '../../api/client';

export default function LoginScreen({ navigation }) {
  const [username,     setUsername]     = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const login = async () => {
    if (!username.trim() || !password) {
      return Alert.alert(
        'Missing fields',
        'Enter both username/email and password.'
      );
    }
  
    try {
      const { data } = await client.post('token/', { username, password });
      await SecureStore.setItemAsync('accessToken', data.access);
      await SecureStore.setItemAsync('refreshToken', data.refresh);
      navigation.replace('Main');
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
  
      if (status === 401) {
        if (detail === 'Email not verified.') {
          // your “please verify” flow
          return Alert.alert(
            'Email not verified',
            'Please verify your email before logging in.'
          );
        } else {
          // generic wrong-credentials flow
          return Alert.alert(
            'Login failed',
            'Invalid username or password.'
          );
        }
      }
  
      // fallback for anything else
      Alert.alert(
        'Login failed',
        'Something went wrong. Please try again.'
      );
    }
  };
  

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Back button */}
      <View style={styles.backContainer}>
        <TouchableOpacity onPress={() => navigation.replace('Welcome')}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Username/Email */}
          <TextInput
            placeholder="Username or Email"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />

          {/* Password + eye toggle */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { paddingRight: 40 }]}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(s => !s)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot */}
          <TouchableOpacity
            style={styles.forgotLinkContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotLinkText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* ——— Styled Login Button ——— */}
          <TouchableOpacity style={styles.primaryButton} onPress={login}>
            <Text style={styles.primaryText}>Log In</Text>
          </TouchableOpacity>

          {/* Sign Up footer */}
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
  backContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    zIndex: 10,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 15,
    padding: 4,
  },
  forgotLinkContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotLinkText: {
    fontSize: 14,
    color: '#888',
  },

  // —— Primary Circld Button ——
  primaryButton: {
    width: '100%',
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  primaryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  signupLink: {
    color: '#E91E63',
    fontWeight: '600',
  },
});
