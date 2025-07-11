// ChatScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
  Keyboard, // Import Keyboard module
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { client } from '../api/client';

export default function ChatScreen({ route }) {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  
  const listRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0); // State to store keyboard height
  const [isKeyboardVisible, setKeyboardVisible] = useState(false); // State to track keyboard visibility

  // Listen to keyboard events to adjust padding
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height); // Get keyboard height
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0); // Reset keyboard height
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []); // Run effect only once on mount and cleanup on unmount


  useEffect(() => {
    if (!listRef.current || sections.length === 0) return
    const lastSection = sections.length - 1
    const lastIndex   = sections[lastSection].data.length - 1
    listRef.current.scrollToLocation({
      sectionIndex: lastSection,
      itemIndex:    lastIndex,
      animated:     true,
      viewOffset:   20,
    })
  }, [sections, isKeyboardVisible]) // Add isKeyboardVisible to re-scroll when keyboard state changes
  
  // 1) fetch me
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => client.get('profile/').then(r => r.data),
  });

  // 2) fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', groupId],
    queryFn: () => client.get(`messages/?group=${groupId}`).then(r => r.data),
    refetchInterval: 3000,
  });

  // 3) send mutation
  const sendMutation = useMutation({
    mutationFn: m => client.post('messages/', m),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', groupId] });
      setText('');
    },
  });

  // group by date header
  const groupByDate = msgs => {
    const sections = [];
    msgs.forEach(msg => {
      const d = new Date(msg.ts);
      const key = d.toDateString();
      let sec = sections.find(s => s.key === key);
      if (!sec) {
        sec = { key, title: formatHeader(d), data: [] };
        sections.push(sec);
      }
      sec.data.push(msg);
    });
    return sections;
  };

  const formatHeader = d => {
    const now = new Date();
    const opts = { hour: 'numeric', minute: '2-digit' };
    if (d.toDateString() === now.toDateString()) {
      return `Today ${d.toLocaleTimeString([], opts)}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${d.toLocaleTimeString([], opts)}`;
    }
    return `${d.toLocaleDateString(undefined, { weekday: 'long' })} ${d.toLocaleTimeString([], opts)}`;
  };

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1, alignSelf: 'center', marginTop: 50 }} />;
  }

  const sections = groupByDate(messages);

  const keyboardVerticalOffset = Platform.select({
    ios: insets.top + (56),
    android: 0,
  });

  // Calculate the height of your input bar
  // Based on your styles, input height is 40, inputBar has 10 padding, and 8 paddingBottom
  const inputBarHeight = 20; // input height + inputBar paddingTop/Bottom + inputBar's prop paddingBottom

  // Dynamic padding for SectionList
  // When keyboard is visible, padding should be smaller (just safe area)
  // When keyboard is hidden, padding should account for input bar height + safe area
  const sectionListPaddingBottom = isKeyboardVisible
    ? insets.bottom - 20 // A small buffer + safe area when keyboard is open
    : insets.bottom - inputBarHeight; // Input bar height + safe area when keyboard is closed


  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={item => String(item.id)}
        
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const isMe = me?.user_id === item.sender;
          return (
            <View
              style={[
                styles.messageRow,
                isMe ? styles.rowRight : styles.rowLeft,
              ]}
            >
              {/** Left side avatar (others) */}
              {!isMe && item.avatar && (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              )}
  
              {/** The bubble */}
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.bubbleRight : styles.bubbleLeft,
                ]}
              >
                <Text style={[ styles.bubbleText, isMe && { color: '#fff' } ]}>
                  {item.text}
                </Text>
                <Text style={[styles.tsText, isMe ? styles.timeRight : styles.timeLeft]}>
                  {new Date(item.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
  
              {/** Right side avatar (me) */}
              {isMe && me?.avatar && (
                <Image source={{ uri: me.avatar }} style={styles.avatar} />
              )}
            </View>
          );
        }}
        getItemLayout={(_, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
  
        onScrollToIndexFailed={info => {
          setTimeout(() => {
            listRef.current?.scrollToLocation({
              sectionIndex: info.sectionIndex,
              itemIndex:    info.itemIndex,
              animated:     true,
              viewOffset:   20,
            })
          }, 200)
        }}
  
        onScrollToLocationFailed={info => {
          setTimeout(() => {
            listRef.current?.scrollToLocation({
              sectionIndex: info.sectionIndex,
              itemIndex:    info.itemIndex,
              animated:     true,
              viewOffset:   20,
            })
          }, 200)
        }}
        onContentSizeChange={() => {
          if (!listRef.current || sections.length === 0) return;
          const si = sections.length - 1;
          const ii = sections[si].data.length - 1;
          listRef.current.scrollToLocation({ sectionIndex: si, itemIndex: ii, animated: true });
        }}
        // Use the dynamically calculated paddingBottom
        contentContainerStyle={{ paddingBottom: sectionListPaddingBottom }}
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            value={text}
            onChangeText={setText}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => sendMutation.mutate({ group: groupId, text })}
          disabled={!text.trim() || sendMutation.isLoading}
        >
          {sendMutation.isLoading
            ? <ActivityIndicator color="#fff" />
            : <Ionicons name="send" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0f2f5' },
  sectionHeader: {
    textAlign: 'center',
    marginVertical: 18,
    color: '#888',
    fontWeight: '600',
    fontSize: 13,
  },

  messageRow: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  rowLeft:  { justifyContent: 'flex-start'  },
  rowRight: { justifyContent: 'flex-end'    },

  avatar: {
    width: 32, height: 32,
    borderRadius: 16,
    marginHorizontal: 4,
  },

  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleLeft: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 5,
  },
  bubbleRight: {
    backgroundColor: '#FF4081',
    borderTopRightRadius: 5,
  },

  sender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#555',
  },

  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  textOnLight: { color: '#333' },
  textOnPrimary: { color: '#fff' },

  tsText: {
    fontSize: 10,
    marginTop: 4,
  },
  timeLeft:  { textAlign: 'left',  color: '#888' },
  timeRight: { textAlign: 'right', color: '#f0f0f0' },

  inputBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    alignItems: 'center',
    width: '100%',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    marginRight: 8,
    justifyContent: 'center',
    minHeight: 40,
  },
  input: {
    height: 40,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#FF4081',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});