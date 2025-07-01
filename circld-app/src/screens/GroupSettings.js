// src/screens/GroupSettings.js
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { client } from '../api/client';

export default function GroupSettings() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { groupId } = useRoute().params;
  const qc = useQueryClient();

  // Fetch group detail
  const { data: group, isLoading: loadingGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => client.get(`groups/${groupId}/`).then(r => r.data),
  });

  // Fetch members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => client.get(`groups/${groupId}/members/`).then(r => r.data),
  });

  // Leave group mutation
  const leaveMutation = useMutation({
    mutationFn: () => client.post(`groups/${groupId}/leave/`),
    onSuccess: () => {
      qc.invalidateQueries(['groups']);
      navigation.navigate('Groups');
      Alert.alert('Left Group', 'You have successfully left the group.');
    },
    onError: () => Alert.alert('Error', 'Could not leave group.'),
  });

  // Rename group mutation
  const renameMutation = useMutation({
    mutationFn: newName => client.patch(`groups/${groupId}/`, { name: newName }),
    onSuccess: () => {
      qc.invalidateQueries(['group', groupId]);
      setEditing(false);
    },
    onError: () => Alert.alert('Error', 'Could not rename group.'),
  });

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  if (loadingGroup) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const copyCode = async () => {
    await Clipboard.setStringAsync(group.invite_code);
    Alert.alert('Copied!', 'Invite code copied to clipboard.');
  };

  // Header for FlatList: group info + invite code
  const ListHeader = () => (
    <View style={{ paddingTop: insets.top, backgroundColor: '#F3F4F6' }}>
      <View style={styles.card}>
        <View style={styles.header}>
          {editing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[
                  styles.editInput, 
                  { 
                    borderColor: colors.primary, 
                    color: colors.text,
                    backgroundColor: colors.card + '20' // Slightly transparent version of card color
                  }
                ]}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Enter group name"
                placeholderTextColor={colors.text + '66'}
                autoFocus
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[
                    styles.actionButton,
                    styles.cancelBtn, 
                    { 
                      borderColor: colors.text + '33',
                      backgroundColor: colors.card
                    }
                  ]}
                  onPress={() => setEditing(false)}
                >
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.saveBtn, 
                    { 
                      backgroundColor: colors.primary,
                      opacity: draftName.trim() ? 1 : 0.6
                    }
                  ]}
                  onPress={() => {
                    const nm = draftName.trim();
                    if (!nm) return;
                    renameMutation.mutate(nm);
                  }}
                  disabled={!draftName.trim()}
                >
                  {renameMutation.isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.actionButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
                <Text style={[styles.changeText, { color: colors.primary, marginTop: 4 }]}>
                  Change Name
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Members</Text>
      </View>
    </View>
  );

  // Footer for FlatList: Add Member + Leave
  const ListFooter = () => (
    <View>
      <TouchableOpacity
        style={[styles.addBtn, { borderColor: colors.primary }]}
        onPress={() => Alert.alert('Coming soon!', 'Add member flow is not implemented yet')}
      >
        <Ionicons name="person-add-outline" size={18} color={colors.primary} />
        <Text style={[styles.addText, { color: colors.primary }]}>
          Add Member
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.leaveBtn, { backgroundColor: colors.notification }]}
        onPress={() => leaveMutation.mutate()}
        disabled={leaveMutation.isLoading}
      >
        {leaveMutation.isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.leaveText}>Leave Group</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
    data={members}
    keyExtractor={m => m.id.toString()}
    ListHeaderComponent={ListHeader}
    ListFooterComponent={ListFooter}
      renderItem={({ item }) => (
        <View style={styles.memberRow}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={styles.memberRole}>
              {item.id === group.owner_id ? 'Admin' : 'Member'}
            </Text>
          </View>
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 32, backgroundColor: '#F3F4F6' }}
      ListEmptyComponent={() =>
        loadingMembers ? null : (
          <View style={styles.center}>
            <Text style={{ color: colors.text }}>No members found.</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', marginTop: 20 },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 24, 
    fontWeight: '600', 
    textAlign: 'center',
    marginBottom: 8
  },

  changeText: { 
    fontSize: 16, 
    fontWeight: '500',
   },

  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
  },
  section: { marginTop: 16 },

  label: { 
    fontSize: 14, 
    fontWeight: '500',
    marginBottom: 8 ,
  },
  inviteRow: { flexDirection: 'row', alignItems: 'center' },
  codeBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 7,
  },
  codeText: { fontSize: 17 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  copyText: { color: '#fff', fontWeight: '600', marginLeft: 3 },

  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24 },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#DDD' },
  memberName: { fontSize: 16, fontWeight: '500' },
  memberRole: { fontSize: 14, color: '#666' },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addText: { marginLeft: 6, fontSize: 14, fontWeight: '500' },

  leaveBtn: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  editContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  editInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,

  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: "#fff",

  },
  cancelBtn: {
    borderWidth: 1,
  },
  saveBtn: {
    borderWidth: 0,
  },
});