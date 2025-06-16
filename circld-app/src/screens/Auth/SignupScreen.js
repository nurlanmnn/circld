// src/screens/Auth/SignupScreen.js

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { client } from '../../api/client';

export default function SignupScreen({ navigation }) {
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [password2, setPassword2]   = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleSignup = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !password2
    ) {
      return Alert.alert('Missing fields', 'Please fill out all fields.');
    }
    if (password !== password2) {
      return Alert.alert('Passwords don’t match', 'Please re‐enter your passwords.');
    }

    setLoading(true);
    try {
      const registerRes = await client.post('register/', {
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        username:   username.trim(),
        email:      email.trim().toLowerCase(),
        password,
        password2,
      });

      if (registerRes.status === 201) {
        const tokenRes = await client.post('token/', {
          username: username.trim(),
          password,
        });
        await SecureStore.setItemAsync('accessToken', tokenRes.data.access);
        await SecureStore.setItemAsync('refreshToken', tokenRes.data.refresh);
        navigation.replace('Groups');
      }
    } catch (err) {
      if (err.response?.data) {
        let msg = '';
        Object.keys(err.response.data).forEach(field => {
          msg += `${field}: ${err.response.data[field].join(' ')}\n`;
        });
        Alert.alert('Registration Error', msg.trim());
      } else {
        Alert.alert('Registration Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Text style={styles.heading}>Create an Account</Text>
      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        style={styles.input}
      />
      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        style={styles.input}
      />
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      {/* Password field with toggle */}
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

      {/* Confirm password with toggle */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Confirm Password"
          value={password2}
          onChangeText={setPassword2}
          secureTextEntry={!showPassword2}
          style={[styles.input, { paddingRight: 40 }]}
        />
        <TouchableOpacity
          onPress={() => setShowPassword2(s => !s)}
          style={styles.eyeButton}
        >
          <Ionicons
            name={showPassword2 ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#E91E63" style={{ marginTop: 16 }} />
      ) : (
        <Button title="Sign Up" onPress={handleSignup} color="#E91E63" />
      )}

      <View style={styles.footer}>
        <Text>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.loginLink}> Log In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:     {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    backgroundColor: '#fff',
  },
  heading:       {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  input:         {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputContainer:{
    position: 'relative',
  },
  eyeButton:     {
    position: 'absolute',
    right: 16,
    top: 15,
    padding: 4,
  },
  footer:        {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  loginLink:     {
    color: '#E91E63',
    fontWeight: '500',
  },
});
