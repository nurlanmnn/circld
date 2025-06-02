// src/screens/GroupList.js
import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';

export default function GroupList({ navigation }) {
  const queryClient = useQueryClient();

  // 1) Logout function: delete tokens, clear cache, navigate to Login
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      // Clear all cached queries so no old data remains
      queryClient.clear();
      // Replace stack so user cannot go “back” to the Groups screen
      navigation.replace('Login');
    } catch (err) {
      Alert.alert('Logout error', 'Something went wrong while logging out.');
    }
  };

  // 2) Inject a “Logout” button into the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button title="Logout" onPress={logout} color="#d9534f" />
      ),
    });
  }, [navigation]);

  // 3) Existing data‐fetch logic
  const { data, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: () => client.get('groups/').then((res) => res.data),
  });

  if (isLoading) return <Text style={styles.message}>Loading…</Text>;
  if (error)      return <Text style={styles.message}>Error fetching groups.</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(g) => String(g.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              navigation.navigate('GroupDetail', {
                groupId: item.id,
                name:    item.name,
              })
            }
          >
            <Text style={styles.title}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.message}>No groups yet.</Text>}
      />
    </View>
  );
}

// ... your existing styles ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  item: {
    padding: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
  },
  message: {
    marginTop: 50,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});
