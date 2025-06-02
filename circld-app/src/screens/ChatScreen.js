// src/screens/ChatScreen.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatScreen({ groupId }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Chat for group ID: {groupId}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});
