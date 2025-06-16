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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!email.trim()) {
      return Alert.alert('Missing fields', 'Please enter your email.');
    }
    setLoading(true);
    try {
      const { data } = await client.post(
        'auth/password-reset/request/',
        { email: email.trim().toLowerCase() }
      );
      Alert.alert('Success', data.message, [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('ResetPassword', { email: email.trim() }),
        },
      ]);
    } catch (err) {
      const errMsg =
        err.response?.data?.email?.join(' ') ||
        err.response?.data?.detail ||
        'Something went wrong.';
      Alert.alert('Error', errMsg);
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
        Enter your email to receive a password reset code.
      </Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <Button
        title={loading ? 'Sending…' : 'Send Reset Code'}
        onPress={handleRequest}
        disabled={loading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex:1, padding:20, justifyContent:'center' },
  instruction: { marginBottom:16, textAlign:'center', color:'#333' },
  input:       {
    height:50, borderColor:'#ccc', borderWidth:1,
    borderRadius:6, marginBottom:16, paddingHorizontal:12
  },
});
