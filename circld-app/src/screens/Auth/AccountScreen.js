// src/screens/Auth/AccountScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { client } from '../../api/client';

export default function AccountScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [avatarUri, setAvatarUri] = useState('placeholder');
  const [saving,    setSaving]    = useState(false);

  const [hasLibraryPermission, setHasLibraryPermission] = useState(false);


  // fetch profile from API
  async function fetchProfile() {
    try {
      const { data } = await client.get('profile/');
      setProfile(data);
      setFirstName(data.first_name);
      setLastName(data.last_name);
      setEmail(data.email);
      setAvatarUri(data.avatar);
    } catch {
      Alert.alert('Error', 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      // ask photo-permissions once
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasLibraryPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Circld needs access to your photos to change your profile picture.'
        );
      }
      // load the profile
      fetchProfile();
    })();
  }, []);

  // open photo picker
  async function pickImage() {
    try {
      const mediaTypes =
        ImagePicker.MediaType?.Images
        ?? ImagePicker.MediaTypeOptions?.Images
        ?? ImagePicker.MediaTypeOptions.Images;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        quality: 0.5,
      });

      if (result.canceled || !result.assets?.length) return;
      setAvatarUri(result.assets[0].uri);
    } catch (err) {
      console.error('ImagePicker error', err);
      Alert.alert('Error', 'Could not open photo library.');
    }
  }

  // save changes (or trigger email‐change flow)
  const handleSave = async () => {
    if (email !== profile.email) {
      try {
        const { data } = await client.post(
          'profile/request-email-change/',
          { email }
        );
        return Alert.alert(
          'Verify New Email',
          data.message,
          [{
            text: 'OK',
            onPress: () =>
              navigation.navigate('VerifyEmailChange', { from: 'Account' })
          }]
        );
      } catch (err) {
        return Alert.alert(
          'Error',
          err.response?.data?.email?.join(' ') || 'Could not send code.'
        );
      }
    }
  
    setSaving(true);
    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('email', email);
  
    // ✅ New logic here
    const finalAvatarUri = avatarUri === 'placeholder' ? null : avatarUri;
  
    // ✅ Only attach image if it's picked from device
    if (finalAvatarUri?.startsWith('file://')) {
      const name = finalAvatarUri.split('/').pop();
      const ext  = name.split('.').pop();
      formData.append('avatar', {
        uri:  finalAvatarUri,
        name,
        type: `image/${ext}`,
      });
    }
  
    try {
      const { data } = await client.put('profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Saved', 'Your profile has been updated.');
      setAvatarUri(data.avatar); // will be full URL now
      setProfile(data);
    } catch (err) {
      Alert.alert('Error', JSON.stringify(err.response?.data || err.message));
    } finally {
      setSaving(false);
    }
  };
  

  // delete account completely
  const deleteAccount = async () => {
    try {
      await client.delete('profile/delete/');
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      navigation.replace('Login');
    } catch {
      Alert.alert('Error', 'Could not delete account.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account?',
      'This cannot be undone.',
      [
        { text: 'Cancel',  style: 'cancel' },
        { text: 'Delete',  style: 'destructive', onPress: deleteAccount },
      ]
    );
  };

  // logout (move here from Groups!)
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    navigation.replace('Welcome');
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with Logout */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container}>
            {avatarUri === 'placeholder' ? (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle" size={100} color="#bbb" />
              </View>
            ) : (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            )}

            <TouchableOpacity onPress={pickImage}>
              <Text style={styles.changePhoto}>Change Photo</Text>
            </TouchableOpacity>

            {!hasLibraryPermission && (
              <Text style={styles.hint}>
                Tap again to select from your photos.
              </Text>
            )}

            <Text style={styles.label}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
            />

            {/* Save Button */}
            {saving ? (
              <ActivityIndicator
                style={{ marginTop: 24 }}
                size="large"
                color="#E91E63"
              />
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSave}
              >
                <Text style={styles.primaryText}>Save</Text>
              </TouchableOpacity>
            )}

            {/* Delete Account */}
            <TouchableOpacity
              style={styles.destructiveButton}
              onPress={handleDelete}
            >
              <Text style={styles.destructiveText}>Delete Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // — Header —
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  logoutText: {
    color: '#E91E63',
    fontSize: 16,
    fontWeight: '500',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },

  changePhoto: {
    alignSelf: 'center',
    color: '#1976D2',
    fontSize: 16,
    marginBottom: 12,
  },
  hint: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  input: {
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },

  primaryButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  destructiveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'red',
  },
  destructiveText: {
    color: 'red',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});
