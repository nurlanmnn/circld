// src/screens/Auth/WelcomeScreen.js

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/welcome_circld.png')}
        style={styles.image}
        resizeMode="cover"
      />

      <Text style={styles.title}>Welcome to Circld</Text>
      <Text style={styles.subtitle}>
        Connect and share with the people you care about.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.replace('Signup')}
      >
        <Text style={styles.primaryText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.linkText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.55;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  image: {
    width: width - 40,
    height: IMAGE_HEIGHT,
    borderRadius: 12,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  primaryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
  },
});
