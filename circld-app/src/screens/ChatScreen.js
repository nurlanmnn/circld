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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client }      from '../api/client';
import * as Clipboard  from 'expo-clipboard';

export default function ChatScreen({ route, navigation }) {
  const { groupId, name } = route.params;
  const queryClient      = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading]         = useState(false);
  const flatListRef      = useRef(null);
  const insets           = useSafeAreaInsets();

  // 1) Poll messages every 3 seconds
  const {
    data: messages,
    isLoading: loadingMsg,
    error: messageError,
  } = useQuery({
    queryKey: ['messages', groupId],
    queryFn: () =>
      client.get(`messages/?group=${groupId}`).then(res => res.data),
    refetchInterval: 3000,
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
      return Alert.alert('Validation', 'Message cannot be empty.');
    }
    setLoading(true);

    sendMessage.mutate(
      { group: groupId, text: messageText.trim() },
      {
        onError: err => {
          setLoading(false);
          const data = err.response?.data;
          if (data) {
            let msg = '';
            Object.keys(data).forEach(key => {
              msg += `${key}: ${data[key].join(' ')}\n`;
            });
            Alert.alert('Send Failed', msg.trim());
          } else {
            Alert.alert('Send Failed', 'Please try again.');
          }
        },
        onSettled: () => setLoading(false),
      }
    );
  };

  // 3) Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messages && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (loadingMsg) {
    return <ActivityIndicator size="large" color="#E91E63" />;
  }
  if (messageError) {
    return <Text style={styles.message}>Failed to load messages.</Text>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >

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
        ListEmptyComponent={
          <Text style={styles.message}>No messages yet.</Text>
        }
        // add extra bottom margin so list scrolls above the input bar + inset
        style={{ marginBottom: insets.bottom }}
      />

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
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
  container:      { flex: 1, backgroundColor: '#fff', padding: 12 },
  heading:        {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  msgItem:        {
    marginBottom: 12,
    backgroundColor: '#f1f1f1',
    padding: 8,
    borderRadius: 6,
  },
  msgSender:      { fontWeight: 'bold', marginBottom: 4 },
  msgText:        { fontSize: 16 },
  msgDate:        {
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
    // bottom inset applied dynamically
  },
  input:          {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  message:        {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
});