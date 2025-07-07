// src/screens/GroupSettings.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Button
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { client } from '../api/client';
import { CommonActions } from '@react-navigation/native';


export default function GroupSettings() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { groupId } = useRoute().params;
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  // 1) get me
  const {
    data: me,
    isLoading: loadingMe,
    isError: errorMe,
  } = useQuery({
    queryKey: ['me'],
    queryFn: () => client.get('profile/').then(res => res.data),
  });

  // 2) fetch group
  const { data: group, isLoading: loadingGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => client.get(`groups/${groupId}/`).then(r => r.data),
  });

  // 3) fetch members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => client.get(`groups/${groupId}/members/`).then(r => r.data),
  });

  // 4) is last member or not
  const myUserId = me?.user_id;
  const isLastMember = 
    !loadingMembers && 
    members.length === 1 && 
    group?.owner_id === myUserId;
    
  // 5) leave/delete mutation
  const leaveMutation = useMutation({
    mutationFn: () => client.post(`groups/${groupId}/leave/`),
    onSuccess: () => {
      // invalidate and reset to Groups list
      qc.invalidateQueries({ queryKey: ['groups'] });
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Groups' }],
        })
      );
      Alert.alert(
        isLastMember ? 'Deleted' : 'Left',
        isLastMember
          ? 'Your group has been deleted.'
          : 'You have successfully left the group.'
      );
    },
    onError: () => Alert.alert('Error', 'Could not leave group. Please try again.'),
  });


  const confirmLeave = () => {
    Alert.alert(
      isLastMember ? 'Delete group?' : 'Leave group?',
      isLastMember
        ? 'You are the only member. Deleting will permanently remove this group.'
        : 'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isLastMember ? 'Delete' : 'Leave',
          style: 'destructive',
          onPress: () => leaveMutation.mutate(),
        }
      ]
    );
  };
  

  // rename mutation
  const renameMutation = useMutation({
    mutationFn: newName => client.patch(`groups/${groupId}/`, { name: newName }),
    onSuccess: () => {
      qc.invalidateQueries(['group', groupId]);
      setEditing(false);
    },
    onError: () => Alert.alert('Error', 'Could not rename group.'),
  });

  // remove member mutation(only for admin)
  const removeMemberMutation = useMutation({
    mutationFn: ({ userId }) =>
      client.post(`groups/${groupId}/remove_member/`, { user_id: userId }),
    onSuccess: () => {
      // refetch the members list (you should be fetching it with a queryKey like ['groupMembers', groupId])
      qc.invalidateQueries(['groupMembers', groupId]);
    },
    onError: () => Alert.alert('Error', 'Could not remove member.'),
  });
  
  // copy invite code
  const copyCode = async () => {
    await Clipboard.setStringAsync(group.invite_code);
    Alert.alert('Copied!', 'Invite code copied to clipboard.');
  };

  if (loadingGroup) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F3F4F6' }}
      contentContainerStyle={{ paddingBottom: 32, paddingTop: insets.top - 40 }}
    >
      {/* — Group Info Card — */}
      <View style={styles.card}>
        {editing ? (
          <>
            <TextInput
              style={[
                styles.editInput,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.card + '20',
                  color: colors.text,
                },
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
                  styles.cancelBtn,
                  { borderColor: colors.text + '33', backgroundColor: colors.card },
                ]}
                onPress={() => setEditing(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.primary, opacity: draftName.trim() ? 1 : 0.6 },
                ]}
                disabled={!draftName.trim() || renameMutation.isLoading}
                onPress={() => renameMutation.mutate(draftName.trim())}
              >
                {renameMutation.isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.text }]}>{group.name}</Text>
            <TouchableOpacity
              onPress={() => {
                setDraftName(group.name);
                setEditing(true);
              }}
            >
              <Text style={[styles.changeText, { color: colors.primary }]}>
                Change Name
              </Text>
            </TouchableOpacity>
          </>
        )}

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
      </View>

      {/* — Members Card — */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Members</Text>
        {loadingMembers ? (
          <ActivityIndicator style={{ marginTop: 16 }} color={colors.primary} />
        ) : (
          members.map(u => {
            const isAdmin      = u.id === group.owner_id;
            const amIOwner     = me.user_id === group.owner_id;
            const isNotMyself  = u.id !== me.user_id;
      
            return (
              <View key={u.id} style={styles.memberRow}>
                {u.avatar ? (
                  <Image source={{ uri: u.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]} />
                )}
      
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>
                    {u.first_name} {u.last_name}
                  </Text>
                </View>
      
                <View
                  style={[
                    styles.roleBadge,
                    isAdmin ? styles.adminBadge : styles.memberBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      isAdmin ? { color: '#fff' } : { color: '#555' },
                    ]}
                  >
                    {isAdmin ? 'Admin' : 'Member'}
                  </Text>
                </View>
      
                { /* only show Remove button if I'm the owner and this is not me */ }
                {amIOwner && isNotMyself && (
                  <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      `Remove ${u.first_name}?`,
                      'This will remove them from the group.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => removeMemberMutation.mutate({ userId: u.id })
                        }
                      ]
                    )
                  }
                  style={styles.removeIconContainer}
                >
                  <Ionicons name="person-remove-outline" size={22} color={colors.notification} />
                </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

      </View>

      {/* — Leave Group — */}
      <TouchableOpacity
        style={[styles.leaveBtnFull, { backgroundColor: colors.notification }]}
        onPress={confirmLeave}
        disabled={leaveMutation.isLoading}
      >
        {leaveMutation.isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.leaveTextFull}>
            {isLastMember ? 'Delete Group' : 'Leave Group'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  // — Group header —
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },

  section: {
    marginTop: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
  },
  codeText: { fontSize: 16 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyText: { color: '#fff', fontWeight: '600', marginLeft: 4 },

  // — Members —
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: { width:  40,	height:  40, borderRadius:  20,marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#DDD' },
  memberName: { fontSize: 16, fontWeight: '500' },

  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#3B82F6',
  },
  memberBadge: {
    backgroundColor: '#E5E7EB',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },

  addBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addTextFull: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },

  leaveBtnFull: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    // marginTop: 150,
  },
  leaveTextFull: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // — Rename inputs —
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // remove member
  removeIconContainer: {
    padding: 8,
    marginLeft: 8,
  },
});
