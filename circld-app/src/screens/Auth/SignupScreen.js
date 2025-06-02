// circld-app/src/screens/Auth/SignupScreen.js

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { client } from '../../api/client';

/**
 * SignupScreen lets a new user register with username, email, and password.
 * On success, we automatically log them in by fetching a JWT and storing it.
 */
export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password || !password2) {
      Alert.alert('Missing fields', 'Please fill out all fields.');
      return;
    }
    if (password !== password2) {
      Alert.alert('Passwords don’t match', 'Please re‐enter your passwords.');
      return;
    }

    setLoading(true);
    try {
      // 1) Register new user
      const registerRes = await client.post('register/', {
        username,
        email,
        password,
        password2,
      });

      // If register was successful (HTTP 201), proceed to login:
      if (registerRes.status === 201) {
        // 2) Immediately log them in (fetch JWT)
        const tokenRes = await client.post('token/', { username, password });

        await SecureStore.setItemAsync('accessToken', tokenRes.data.access);
        await SecureStore.setItemAsync('refreshToken', tokenRes.data.refresh);

        // 3) Navigate to Groups (and replace so they can’t go back)
        navigation.replace('Groups');
      }
    } catch (err) {
      setLoading(false);
      // If the error is from DRF validation, err.response.data holds field errors:
      if (err.response && err.response.data) {
        const errors = err.response.data;
        // Flatten errors into a single string
        let msg = '';
        Object.keys(errors).forEach((field) => {
          msg += `${field}: ${errors[field].join(' ')}\n`;
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
    <View style={styles.container}>
      <Text style={styles.heading}>Create an Account</Text>

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

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        placeholder="Confirm Password"
        value={password2}
        onChangeText={setPassword2}
        secureTextEntry
        style={styles.input}
      />

      <Button
        title={loading ? 'Registering…' : 'Sign Up'}
        onPress={handleSignup}
        disabled={loading}
      />

      <View style={styles.footer}>
        <Text>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.loginLink}> Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  loginLink: {
    color: '#E91E63',
    fontWeight: '500',
  },
});