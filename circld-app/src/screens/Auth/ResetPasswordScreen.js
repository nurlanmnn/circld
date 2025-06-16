// reseting passwoard in login page
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { client } from '../../api/client';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params;
  const [code, setCode]           = useState('');
  const [password, setPassword]   = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showPassword2, setShowPassword2]   = useState(false);
  const [loading, setLoading]               = useState(false);

  const handleConfirm = async () => {
    if (!code.trim() || !password || !password2) {
      return Alert.alert('Missing fields', 'Please fill out all fields.');
    }
    if (password !== password2) {
      return Alert.alert('Passwords don’t match', 'Please re‐enter.');
    }

    setLoading(true);
    try {
      const { data } = await client.post(
        'auth/password-reset/confirm/',
        {
          email:         email.toLowerCase(),
          token:         code.trim(),
          new_password:  password,
          new_password2: password2,
        }
      );

      Alert.alert('Success', data.message, [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (err) {
      const errData = err.response?.data || {};
      let msg = 'Something went wrong.';

      if (errData.token) {
        msg = Array.isArray(errData.token)
          ? errData.token.join(' ')
          : String(errData.token);
      } else if (errData.new_password2) {
        msg = errData.new_password2.join(' ');
      } else if (errData.detail) {
        msg = errData.detail;
      }

      Alert.alert('Error', msg);
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
      <Text style={styles.instruction}>
        We’ve sent a 6-digit code to {email}. Enter it below with your new password.
      </Text>

      <TextInput
        placeholder="6-digit code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.input}
      />

      {/* New password with toggle */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={[styles.input, { paddingRight: 40 }]}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword((s) => !s)}
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
          placeholder="Confirm password"
          value={password2}
          onChangeText={setPassword2}
          secureTextEntry={!showPassword2}
          style={[styles.input, { paddingRight: 40 }]}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword2((s) => !s)}
        >
          <Ionicons
            name={showPassword2 ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <Button
        title={loading ? 'Resetting…' : 'Reset Password'}
        onPress={handleConfirm}
        disabled={loading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  instruction: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  input:       {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  eyeButton:   {
    position: 'absolute',
    right: 16,
    top: 15,
    padding: 4,
  },
});
