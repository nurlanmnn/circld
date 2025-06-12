// src/screens/Auth/AccountScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { client } from '../../api/client';

export default function AccountScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // form fields
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [saving,    setSaving]    = useState(false);

  const [hasLibraryPermission, setHasLibraryPermission] = useState(false);

  // 1) fetchProfile must be declared before useEffect so we can call it
  async function fetchProfile() {
    try {
      const { data } = await client.get('profile/');
      setProfile(data);
      setFirstName(data.first_name);
      setLastName(data.last_name);
      setEmail(data.email);
      setAvatarUri(data.avatar);
    } catch {
      Alert.alert('Error','Could not load profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      // ask once on mount
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const granted = status === 'granted';
      setHasLibraryPermission(granted);
      if (!granted) {
        Alert.alert(
          'Permission Needed',
          'Circld needs access to your photos to change your profile picture.'
        );
      }
      // now load profile
      fetchProfile();
    })();
  }, []);

  async function pickImage() {
    try {
      // choose correct enum for this SDK
      const mediaTypes =
      // new API (SDK 56+)
      ImagePicker.MediaType?.Images
      // fallback for older versions
      ?? ImagePicker.MediaTypeOptions?.Images
      // last-ditch default
      ?? ImagePicker.MediaTypeOptions.Images;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        quality: 0.5,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }
      setAvatarUri(result.assets[0].uri);
    } catch (err) {
      console.error('ImagePicker error', err);
      Alert.alert('Error', 'Could not open photo library.');
    }
  }

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name',  lastName);
    formData.append('email',      email);
    if (avatarUri?.startsWith('file://')) {
      const name = avatarUri.split('/').pop();
      const ext  = name.split('.').pop();
      formData.append('avatar', {
        uri:  avatarUri,
        name,
        type: `image/${ext}`,
      });
    }
    try {
      const { data } = await client.put('profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Saved','Your profile has been updated.');
      setAvatarUri(data.avatar);
    } catch (err) {
      Alert.alert('Error', JSON.stringify(err.response?.data || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete account?',
      'This is irreversible.',
      [
        { text:'Cancel', style:'cancel' },
        { text:'Delete', style:'destructive', onPress: deleteAccount }
      ]
    );
  };

  const deleteAccount = async () => {
    try {
      await client.delete('profile/delete/');
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      navigation.replace('Login');
    } catch {
      Alert.alert('Error','Could not delete account.');
    }
  };

  if (loading) {
    return <ActivityIndicator style={{flex:1}} size="large" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar}/>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text>No Photo</Text>
            </View>
          )}
          <Button title="Change Photo" onPress={pickImage} />
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

          <View style={styles.button}>
            <Button
              title={saving ? 'Saving...' : 'Save'}
              onPress={handleSave}
              disabled={saving}
            />
          </View>

          <View style={styles.button}>
            <Button
              title="Delete Account"
              onPress={handleDelete}
              color="red"
            />
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow:1, padding:20, backgroundColor:'#fff' },
  avatar:    { width:100, height:100, borderRadius:50, alignSelf:'center', marginBottom:16 },
  avatarPlaceholder: {
    width:100, height:100, borderRadius:50,
    backgroundColor:'#eee', alignItems:'center', justifyContent:'center',
    alignSelf:'center', marginBottom:16
  },
  hint:      { textAlign:'center', marginVertical:8, color:'#666' },
  label:     { marginTop:12, fontWeight:'600' },
  input:     {
    height:40, borderColor:'#ccc', borderWidth:1, borderRadius:4,
    paddingHorizontal:8, marginTop:4
  },
  button:    { marginTop:20 }
});
