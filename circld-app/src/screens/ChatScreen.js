// circld-app/src/screens/ChatScreen.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';

export default function ChatScreen({ route, navigation }) {
  const { groupId, name } = route.params;
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  // 1) Poll messages every 3 seconds
  const {
    data: messages,
    isLoading: loadingMsg,
    error: messageError,
  } = useQuery({
    queryKey: ['messages', groupId],
    queryFn: () => client.get(`messages/?group=${groupId}`).then(res => res.data),
    refetchInterval: 3000, // poll interval
  });

  // 2) Mutation to send a new message
  const sendMessage = useMutation({
    mutationFn: newMsg => client.post('messages/', newMsg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
      setMessageText('');
    },
  });

  const handleSend = () => {
    if (!messageText.trim()) {
      Alert.alert('Validation', 'Message cannot be empty.');
      return;
    }
    setLoading(true);

    sendMessage.mutate(
      { group: groupId, text: messageText.trim() },
      {
        onError: err => {
          setLoading(false);
          if (err.response && err.response.data) {
            let msg = '';
            Object.keys(err.response.data).forEach(field => {
              msg += `${field}: ${err.response.data[field].join(' ')}\n`;
            });
            Alert.alert('Send Failed', msg.trim());
          } else {
            Alert.alert('Send Failed', 'Please try again.');
          }
        },
        onSettled: () => {
          setLoading(false);
        },
      }
    );
  };

  // 3) Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messages && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (loadingMsg) return <ActivityIndicator size="large" color="#E91E63" />;
  if (messageError) return <Text style={styles.message}>Failed to load messages.</Text>;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Text style={styles.heading}>{name} • Chat</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={m => String(m.id)}
        renderItem={({ item }) => (
          <View style={styles.msgItem}>
            <Text style={styles.msgSender}>{item.sender_username}:</Text>
            <Text style={styles.msgText}>{item.text}</Text>
            <Text style={styles.msgDate}>
              {new Date(item.ts).toLocaleTimeString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.message}>No messages yet.</Text>}
      />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message…"
          value={messageText}
          onChangeText={setMessageText}
          style={styles.input}
        />
        {loading ? (
          <ActivityIndicator size="small" color="#E91E63" />
        ) : (
          <Button title="Send" onPress={handleSend} color="#E91E63" />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 12 },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  msgItem: {
    marginBottom: 12,
    backgroundColor: '#f1f1f1',
    padding: 8,
    borderRadius: 6,
  },
  msgSender: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  msgText: {
    fontSize: 16,
  },
  msgDate: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  message: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
});
