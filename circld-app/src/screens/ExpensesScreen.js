import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';

export default function ExpensesScreen({ route, navigation }) {
  const { groupId, name } = route.params;
  const queryClient      = useQueryClient();
  const insets           = useSafeAreaInsets();                    // ← call

  const [amount, setAmount] = useState('');
  const [note, setNote]     = useState('');
  const [loading, setLoading] = useState(false);

  // 1) Fetch expenses for this group
  const {
    data: expenses,
    isLoading: loadingExp,
    error: expenseError,
  } = useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => client.get(`expenses/?group=${groupId}`).then(res => res.data),
  });

  // 2) Mutation to add a new expense
  const addExpense = useMutation({
    mutationFn: newExp => client.post('expenses/', newExp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      setAmount('');
      setNote('');
    },
  });

  const handleAdd = () => {
    if (!amount.trim()) {
      Alert.alert('Validation', 'Amount is required.');
      return;
    }
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      Alert.alert('Validation', 'Enter a valid positive number.');
      return;
    }
    setLoading(true);

    addExpense.mutate(
      { group: groupId, amount: amtNum, note },
      {
        onError: err => {
          setLoading(false);
          if (err.response?.data) {
            let msg = '';
            Object.keys(err.response.data).forEach(field => {
              msg += `${field}: ${err.response.data[field].join(' ')}\n`;
            });
            Alert.alert('Add Expense Failed', msg.trim());
          } else {
            Alert.alert('Add Expense Failed', 'Please try again.');
          }
        },
        onSettled: () => setLoading(false),
      }
    );
  };

  if (loadingExp) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }
  if (expenseError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Failed to load expenses.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Text style={styles.heading}>{name} • Expenses</Text>

      <FlatList
        data={expenses}
        keyExtractor={e => String(e.id)}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <Text style={styles.expenseText}>
              {item.paid_by_username} paid ${parseFloat(item.amount).toFixed(2)}
              {item.note ? ` – ${item.note}` : ''}
            </Text>
            <Text style={styles.expenseDate}>
              {new Date(item.created).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.message}>No expenses yet.</Text>}
        // ↑ make room for the form + safe area at the bottom
        style={{ marginBottom: 20 + insets.bottom }}
      />

      <View style={[styles.form, { paddingBottom: insets.bottom }]}>
        <TextInput
          placeholder="Amount (e.g. 12.50)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          placeholder="Note (optional)"
          value={note}
          onChangeText={setNote}
          style={styles.input}
        />
        {loading ? (
          <ActivityIndicator size="small" color="#E91E63" />
        ) : (
          <Button title="Add Expense" onPress={handleAdd} color="#E91E63" />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff', padding: 16 },
  heading:      { fontSize: 20, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  expenseItem:  { paddingVertical: 8, borderBottomColor: '#eee', borderBottomWidth: 1 },
  expenseText:  { fontSize: 16 },
  expenseDate:  { fontSize: 12, color: '#999' },
  form: {
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    paddingTop: 12,
    // bottom padding is now added dynamically via insets
  },
  input: {
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  message: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
});
