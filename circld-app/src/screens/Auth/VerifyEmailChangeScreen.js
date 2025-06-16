// email change in profile section (account)
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator
} from 'react-native';
import { client } from '../../api/client';

export default function VerifyEmailChangeScreen({ navigation }) {
  const [code, setCode]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      return Alert.alert('Invalid code','Enter the 6-digit code.');
    }
    setLoading(true);
    try {
      const { data } = await client.post(
        'profile/verify-email-change/',
        { code }
      );
      Alert.alert(
        'Success',
        data.message,
        [{ text:'OK', onPress:() => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.code || 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Enter the code we sent to your new email address:
      </Text>
      <TextInput
        placeholder="123456"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.input}
      />
      {loading
        ? <ActivityIndicator />
        : <Button title="Verify Code" onPress={handleVerify} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:20, justifyContent:'center' },
  instruction:{ marginBottom:16, textAlign:'center' },
  input:{ 
    height:50, borderWidth:1, borderColor:'#ccc', 
    borderRadius:6, paddingHorizontal:12, marginBottom:16,
    textAlign:'center'
  },
});
