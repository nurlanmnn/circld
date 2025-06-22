// src/screens/MembersScreen.js
import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { client } from '../api/client';

export default function MembersScreen({ route }) {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const {
    data: members = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () =>
      client
        .get(`groups/${groupId}/members/`)
        .then(res => res.data),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={{ color: theme.colors.text }}>
          Could not load members.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top - 45}]}>
      <FlatList
        data={members}
        keyExtractor={item => item.id.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <View style={styles.info}>
              <Text style={styles.name}>
                {item.first_name} {item.last_name}
              </Text>
              <Text style={styles.role}>
                {item.is_admin ? 'Admin' : 'Member'}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#eee',
  },
  info: {
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  role: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 76, // align with text, assuming avatar + marginLeft
  },
});
