// circld-app/src/screens/GroupDetail.js

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useQuery }   from '@tanstack/react-query';
import * as Clipboard  from 'expo-clipboard';
import { Ionicons }    from '@expo/vector-icons';
import { useTheme }    from '@react-navigation/native';
import { client }      from '../api/client';

export default function GroupDetail({ route, navigation }) {
  const { groupId } = route.params;
  const theme       = useTheme();
  const tint        = theme.colors.primary;
  const { width }   = useWindowDimensions();

  // 1) Fetch the single group (including invite_code)
  const {
    data: group,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['groupDetail', groupId],
    queryFn: () => client.get(`groups/${groupId}/`).then(res => res.data),
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  if (error) {
    if (error.response?.status === 404) {
      Alert.alert(
        'Not Found',
        'You are not authorized to view this group or it does not exist.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return null;
    }
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load group info.</Text>
      </View>
    );
  }

  // 2) Copy invite code to clipboard
  const copyInviteCode = async () => {
    try {
      await Clipboard.setStringAsync(group.invite_code);
      Alert.alert(
        'Invite Code Copied',
        `Code "${group.invite_code}" copied to clipboard.`
      );
    } catch {
      Alert.alert('Error', 'Failed to copy invite code.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Group Name */}
        <Text style={styles.groupName}>{group.name}</Text>

        {/* Invite Code Section */}
        <Text style={styles.label}>Invite Code:</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>{group.invite_code}</Text>
          <TouchableOpacity
            onPress={copyInviteCode}
            style={[styles.copyButton, { backgroundColor: tint }]}
          >
            <Ionicons name="copy-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* …other group detail info… */}
      </ScrollView>

      {/* Footer Bar with Icons */}
      <View style={styles.footer}>
        {/* Expenses Button */}
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() =>
            navigation.navigate('Expenses', {
              groupId,
              name: group.name,
            })
          }
        >
          <Ionicons name="cash-outline" size={28} color={tint} />
          <Text style={[styles.footerLabel, { color: tint }]}>
            Expenses
          </Text>
        </TouchableOpacity>

        {/* Chat Button */}
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() =>
            navigation.navigate('Chat', {
              groupId,
              name: group.name,
            })
          }
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={28}
            color={tint}
          />
          <Text style={[styles.footerLabel, { color: tint }]}>
            Chat
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // leave space for footer
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  codeText: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    color: '#333',
  },
  copyButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  copyButtonText: {
    // no longer used
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: 'row',
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});
