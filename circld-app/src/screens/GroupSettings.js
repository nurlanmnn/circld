import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

export default function GroupSettings() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params;
  const qc = useQueryClient();

  // fetch group
  const { data: group, isLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => client.get(`groups/${groupId}/`).then(r => r.data),
  });

  const leaveMutation = useMutation({
    mutationFn: () =>
      client.post(`groups/${groupId}/leave/`),
    onSuccess: () => {
      // invalidate lists and go back to your groups list
      qc.invalidateQueries({ queryKey: ['groups'] });
      navigation.navigate('Groups');
      Alert.alert('Left Group', 'You have successfully left the group.');
    },
    onError: () => {
      Alert.alert('Error', 'Unable to leave group. Please try again.');
    },
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () =>
      client
        .get(`groups/${groupId}/members/`)
        .then(res => res.data),
  });

  // rename mutation
  const renameMutation = useMutation({
    mutationFn: newName =>
      client.patch(`groups/${groupId}/`, { name: newName }),
    onSuccess: () => qc.invalidateQueries(['group', groupId]),
  });

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const copyCode = async () => {
    if (!group?.invite_code) return;
    try {
      await Clipboard.setStringAsync(group.invite_code);
      Alert.alert('Copied!', 'Invite code copied to clipboard.');
    } catch (err) {
      Alert.alert('Error', 'Could not copy invite code.');
    }
  };

  // leave group
  const leaveGroup = () => {
    // call your leave endpoint...
    Alert.alert('Left', 'You have left the group.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Title + Change Name */}
      <View style={styles.row}>
        {editing ? (
          <>
            <TextInput
              style={[styles.input, { borderColor: colors.primary }]}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="New group name"
              placeholderTextColor={colors.text + '88'}
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                const nm = draftName.trim();
                if (!nm) return Alert.alert('Error','Name cannot be empty.');
                renameMutation.mutate(nm, {
                  onSuccess: () => setEditing(false),
                });
              }}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Text style={[styles.cancelText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              {group.name}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setDraftName(group.name);
                setEditing(true);
              }}
            >
              <Text style={[styles.changeLink, { color: colors.primary }]}>
                Change Name
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Invite code */}
      <View style={styles.section}>
        <Text style={styles.label}>Invite Code</Text>
        <View style={styles.inviteRow}>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{group.invite_code}</Text>
          </View>
          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: colors.primary }]}
            onPress={copyCode}
          >
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.name}>Members</Text>
      {/* Members list */}
      <FlatList
        data={members}
        keyExtractor={m => m.id.toString()}
        renderItem={({item}) => (
          <View style={styles.memberRow}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <View>
              <Text style={styles.name}>
                {item.first_name} {item.last_name}
              </Text>
              <Text style={styles.role}>
                {item.id === group.owner_id ? 'Admin' : 'Member'}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      {/* Leave group */}
      <TouchableOpacity
        style={[styles.leaveBtn, { borderColor: colors.notification }]}
        onPress={() => leaveMutation.mutate()}
        disabled={leaveMutation.isLoading}
      >
        {leaveMutation.isLoading
         ? <ActivityIndicator color={colors.notification} />
         : <Text style={styles.leaveText}>Leave Group</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  back: { 
    position: 'absolute', 
    top: 16, 
    left: 16, 
    zIndex: 10 
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: '600', flex: 1 },
  changeLink: { marginLeft: 12, fontSize: 16 },

  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 44,
  },
  saveBtn: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  saveText: { color: '#fff', fontWeight: '600' },
  cancelText: { marginLeft: 12, fontSize: 16 },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  inviteRow: { flexDirection: 'row', alignItems: 'center' },
  codeBox: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 6,
  },
  codeText: { fontSize: 16 },
  copyBtn: { 
    marginLeft: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 6
  },
  copyText: { color: '#fff', fontWeight: '600' },

  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#ddd' },
  name: { fontSize: 16, fontWeight: '500' },
  role: { fontSize: 14, color: '#666' },
  sep: { height: 1, backgroundColor: '#eee', marginLeft: 68 },

  leaveBtn: {
    margin: 30,
    borderWidth: 1,
    backgroundColor: '#E91E63',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  leaveText: { 
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
   },
});