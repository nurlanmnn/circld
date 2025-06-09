// circld-app/src/screens/Auth/SignupScreen.js

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
import * as SecureStore from 'expo-secure-store';
import { client } from '../../api/client';

/**
 * SignupScreen lets a new user register with:
 *   - First Name
 *   - Last Name
 *   - Username
 *   - Email
 *   - Password
 *   - Confirm Password
 * On success, we immediately log them in by fetching a JWT and storing it.
 */
export default function SignupScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSignup = async () => {
    // 1) Validate that *all six* fields are filled
    if (
      !firstName.trim() ||
      !lastName.trim()  ||
      !username.trim()  ||
      !email.trim()     ||
      !password         ||
      !password2
    ) {
      Alert.alert('Missing fields', 'Please fill out all fields.');
      return;
    }

    // 2) Ensure passwords match
    if (password !== password2) {
      Alert.alert('Passwords don`t match', 'Please re-enter your passwords.');
      return;
    }

    setLoading(true);
    try {
      // 3) Register new user with the extra first_name & last_name fields
      const registerRes = await client.post('register/', {
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        username:   username.trim(),
        email:      email.trim().toLowerCase(),
        password:   password,
        password2:  password2,
      });

      if (registerRes.status === 201) {
           // pass email so VerifyCodeScreen knows which account
           navigation.replace('VerifyCode', { email: email.trim().toLowerCase() });
         }
      
    } catch (err) {
      // 7) Handle DRF validation errors (e.g. “username already taken”, etc.)
      if (err.response && err.response.data) {
        const errors = err.response.data;
        let msg = '';
        Object.keys(errors).forEach((field) => {
          // Join any array of error strings for each field
          msg = `${field}: ${errors[field].join(' ')}\n`;
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

      {loading ? (
        <ActivityIndicator size="large" color="#E91E63" style={{ marginTop: 16 }} />
      ) : (
        <Button
          title="Sign Up"
          onPress={handleSignup}
          color="#E91E63"
        />
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