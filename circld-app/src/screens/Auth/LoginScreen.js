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
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 

  const login = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Missing fields', 'Enter both username or email and password.');
      return;
    }
    try {
      const { data } = await client.post('token/', { username, password });
      await SecureStore.setItemAsync('accessToken', data.access);
      await SecureStore.setItemAsync('refreshToken', data.refresh);
      navigation.replace('Main'); // temp
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
            placeholder="Username or Email"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />

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

          <TouchableOpacity
            style={styles.forgotLinkContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotLinkText}>Forgot password?</Text>
          </TouchableOpacity>

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
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 15,
    padding: 4,
  },
  forgotLinkContainer: {
    alignSelf:    'flex-end',
    marginBottom: 16,
  },
  forgotLinkText: {
    fontSize:  13,
    color:     '#888',    // lighter, less prominent
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