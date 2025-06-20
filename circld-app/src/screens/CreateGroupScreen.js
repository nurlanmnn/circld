// src/screens/CreateGroupScreen.js

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';

export default function CreateGroupScreen({ navigation }) {
  const [name, setName] = useState('');
  const queryClient     = useQueryClient();

  // ✅ React-Query v5 style: pass an object
  const createGroupMutation = useMutation({
    mutationFn: (newGroup) =>
      client.post('groups/', newGroup),

    onSuccess: () => {
      // refresh your list and go back
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigation.goBack();
    },

    onError: (err) => {
      // present a friendly alert
      const data = err.response?.data;
      let message = 'Could not create group. Please try again.';
      if (data) {
        message = Object.entries(data)
          .map(([field, arr]) => `${field}: ${arr.join(' ')}`)
          .join('\n');
      }
      Alert.alert('Create Group Failed', message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      return Alert.alert(
        'Validation Error',
        'Group name cannot be empty.'
      );
    }
    createGroupMutation.mutate({ name: name.trim() });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ← Back button */}
      <View style={styles.backContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            placeholder="Group Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          {createGroupMutation.isLoading ? (
            <ActivityIndicator
              size="large"
              color="#E91E63"
              style={{ marginTop: 8 }}
            />
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
            >
              <Text style={styles.primaryText}>
                Create Group
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    zIndex: 10,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});