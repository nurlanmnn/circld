// src/screens/CreateGroupScreen.js

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';

export default function CreateGroupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // ⚠️ React Query v5 requires an object signature for useMutation
  const createGroup = useMutation({
    // This is your actual POST call:
    mutationFn: (newGroup) => client.post('groups/', newGroup),

    // On success, invalidate the 'groups' query and go back.
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigation.goBack();
    },

    // You can also include onError / onSettled here if you want:
    onError: (err) => {
      // We’ll also handle errors in handleSubmit for a nicer Alert.
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Group name cannot be empty.');
      return;
    }
    setLoading(true);

    createGroup.mutate(
      { name }, // payload
      {
        onError: (err) => {
          setLoading(false);
          if (err.response && err.response.data) {
            const errors = err.response.data;
            let msg = '';
            Object.keys(errors).forEach((field) => {
              msg += `${field}: ${errors[field].join(' ')}\n`;
            });
            Alert.alert('Create Group Failed', msg.trim());
          } else {
            Alert.alert('Create Group Failed', 'Please try again.');
          }
        },
        onSettled: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Group Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#E91E63" />
      ) : (
        <Button title="Create Group" onPress={handleSubmit} color="#E91E63" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 20,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});
