// circld-app/src/screens/GroupList.js

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

  // 1) Logout helper: clear tokens & navigate to Login
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      queryClient.clear();
      navigation.replace('Welcome');
    } catch (err) {
      Alert.alert('Logout error', 'Something went wrong while logging out');
    }
  };

  // 2) Use React Query to GET /api/groups/
  const {
    data: groups,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['groups'],
    queryFn: () => client.get('groups/').then(res => res.data),
  });

  // 3) Configure the header buttons (Logout, Join, Create)
  useLayoutEffect(() => {
    navigation.setOptions({
      // Left side: a Logout button
      headerLeft: () => (
        <Button title="Logout" onPress={logout} color="#d9534f" />
      ),

      // Right side: “Join” + “+” buttons
      headerRight: () => (
        <View style={styles.headerButtons}>
          <Button
            title="Join"
            onPress={() => navigation.navigate('JoinGroup')}
            color="#FFA500"
          />
          <View style={{ width: 8 }} />
          <Button
            title="+"
            onPress={() => navigation.navigate('CreateGroup')}
            color="#E91E63"
          />
        </View>
      ),
    });
  }, [navigation]);

  // 4) Render loading / error / empty states
  if (isLoading) {
    return <Text style={styles.message}>Loading…</Text>;
  }
  if (isError) {
    return <Text style={styles.message}>Error fetching groups.</Text>;
  }

  // 5) Render the actual list of groups (only those the user belongs to)
  return (
    <View style={styles.container}>
      <FlatList
        data={groups}                       // “groups” is an array of { id, name, members, invite_code }
        keyExtractor={g => String(g.id)}
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
        ListEmptyComponent={
          <Text style={styles.message}>No groups yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  item: {
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    color: '#333',
  },
  message: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 8,
  },
});
