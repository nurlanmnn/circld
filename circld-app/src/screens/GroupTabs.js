import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

import MembersScreen from './MembersScreen';
import ExpensesScreen from './ExpensesScreen';
import ChatScreen from './ChatScreen';
import GroupSettings from './GroupSettings';

const Tab = createMaterialTopTabNavigator();

export default function GroupTabs({ navigation, route }) {
  const { groupId } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // hides the "groups and account" footer inside a group
  useFocusEffect(
    React.useCallback(() => {
      // hide when focused:
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });
      return () => {
        // re-show when leaving:
        navigation.getParent()?.setOptions({
          tabBarStyle: undefined
        });
      };
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top - 42 }]}>
      {/* ← Back button */}
      <View style={styles.backContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
      </View>
    <Tab.Navigator
      initialRouteName="Members"
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarIndicatorStyle: { backgroundColor: colors.primary },
        tabBarStyle: {
          backgroundColor: colors.background,
          paddingTop: insets.top,        // ← push below notch
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        initialParams={{ groupId }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        initialParams={{ groupId }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        initialParams={{ groupId }}
      />
      <Tab.Screen
        name="Settings"
        component={GroupSettings}
        initialParams={{ groupId }}
      />
    </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({ 
  container: {
    flex: 1
  },
  backContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    zIndex: 10,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600'
  },
})