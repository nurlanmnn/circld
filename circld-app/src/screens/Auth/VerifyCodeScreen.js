// verifying email when signing up
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { client } from '../../api/client';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';


export default function VerifyCodeScreen({ route, navigation }) {
  const { email } = route.params;  // passed from SignupScreen
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      Alert.alert('Invalid code', 'Code must be 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('verify-code/', { email, code });
  
      await SecureStore.setItemAsync('accessToken', data.access);
      await SecureStore.setItemAsync('refreshToken', data.refresh);
  
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.backContainer}>
        <TouchableOpacity onPress={() => navigation.replace('Welcome')}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.instruction}>
            Enter the 6-digit code we emailed to {email}:
          </Text>
          <TextInput
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            style={styles.input}
            maxLength={6}
          />
          {loading
            ? <ActivityIndicator size="large" />
            : <Button title="Verify Code" onPress={handleVerify} />
          }
          <Text
            style={styles.resend}
            onPress={() => {
              client.post('resend-code/', { email })
                .then(r => Alert.alert('Sent!', r.data.message))
                .catch(e => Alert.alert('Error', e.response?.data?.error));
            }}
          >
            Resend code
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, justifyContent:'center' },
  backContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    zIndex: 10,
  },
  instruction: { marginBottom:16, fontSize:16, textAlign:'center' },
  input: { 
    height:50, borderWidth:1, borderColor:'#ccc', 
    borderRadius:6, padding:12, marginBottom:16, textAlign:'center'
  },
  resend: { marginTop:20, color:'#E91E63', textAlign:'center' },
});
