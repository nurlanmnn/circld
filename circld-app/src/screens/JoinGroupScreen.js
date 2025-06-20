import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
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

export default function JoinGroupScreen({ navigation }) {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient          = useQueryClient();

  const joinGroup = useMutation({
    mutationFn: ({ invite_code }) => client.post('groups/join/', { invite_code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigation.goBack();
    },
  });

  const handleJoin = () => {
    if (!code.trim()) {
      return Alert.alert('Validation', 'Invite code cannot be empty.');
    }
    setLoading(true);
    joinGroup.mutate(
      { invite_code: code.trim() },
      {
        onError: (err) => {
          setLoading(false);
          if (err.response) {
            const { status, data } = err.response;
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
        onSettled: () => setLoading(false),
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Back arrow */}
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
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleJoin}
            >
              <Text style={styles.primaryText}>Join Group</Text>
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
  instructions: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
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
