// circld-app/src/screens/JoinGroupScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';

export default function JoinGroupScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Mutation to POST /api/groups/join/
  const joinGroup = useMutation({
    mutationFn: ({ invite_code }) => client.post('groups/join/', { invite_code }),
    onSuccess: () => {
      // Refresh the list of groups so the newly joined group appears
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigation.goBack();
    },
  });

  const handleJoin = () => {
    if (!code.trim()) {
      Alert.alert('Validation', 'Invite code cannot be empty.');
      return;
    }
    setLoading(true);

    joinGroup.mutate(
      { invite_code: code.trim() },
      {
        onError: (err) => {
          setLoading(false);
          if (err.response) {
            const status = err.response.status;
            const data = err.response.data;
            if (status === 404) {
              Alert.alert('Invalid Code', 'No group matches that invite code.');
            } else if (data.invite_code) {
              Alert.alert('Error', data.invite_code.join(' '));
            } else if (data.detail) {
              Alert.alert('Error', data.detail);
            } else {
              Alert.alert('Error', 'Could not join group. Try again.');
            }
          } else {
            Alert.alert('Network Error', 'Please check your connection.');
          }
        },
        onSettled: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Text style={styles.instructions}>
        Enter an invitation code to join a group:
      </Text>

      <TextInput
        placeholder="Invitation Code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={8}
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#E91E63" />
      ) : (
        <Button title="Join Group" onPress={handleJoin} color="#E91E63" />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  instructions: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 20,
    paddingHorizontal: 12,
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
