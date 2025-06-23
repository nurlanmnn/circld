// src/screens/GroupSettings.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Clipboard,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { client } from '../api/client';

export default function GroupSettings({ route }) {
  const { groupId } = route.params;
  const { colors } = useTheme();
  const PINK = colors.primary;

  // 1) Fetch full group info (including members & invite_code)
  const {
    data: group,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['groupSettings', groupId],
    queryFn: () =>
      client.get(`groups/${groupId}/`).then(res => res.data),
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load group settings.');
    }
  }, [error]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={PINK} />
      </View>
    );
  }

  // 2) Guard against missing data
  const inviteCode = group?.invite_code ?? '—';
  const members = Array.isArray(group?.members) ? group.members : [];

  const copyCode = async () => {
    await Clipboard.setString(inviteCode);
    Alert.alert('Copied!', 'Invite code copied to clipboard.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Invite Code */}
      <Text style={[styles.label, { color: colors.text }]}>
        Invite Code:
      </Text>
      <View style={styles.codeRow}>
        <View style={styles.codeBox}>
          <Text style={[styles.codeText, { color: colors.text }]}>
            {inviteCode}
          </Text>
        </View>
        <TouchableOpacity
          onPress={copyCode}
          style={[styles.copyBtn, { backgroundColor: PINK }]}
        >
          <Text style={styles.copyTxt}>Copy</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  codeBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '500',
  },
  copyBtn: {
    marginLeft: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  copyTxt: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  separator: {
    height: 1,
  },
});
