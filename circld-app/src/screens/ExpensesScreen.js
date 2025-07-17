import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { client } from '../api/client';

export default function ExpensesScreen({ route }) {
  const { groupId } = route.params;
  const insets      = useSafeAreaInsets();
  const qc          = useQueryClient();
  const { colors } = useTheme();

  // 1) fetch existing expenses
  const { data: expenses = [], isLoading: loadingExp } = useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => client.get(`expenses/?group=${groupId}`).then(r => r.data),
  });

  // 2) fetch members so we can pick paidBy & splitBetween
  const { data: members = [], isLoading: loadingMem } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => client.get(`groups/${groupId}/members/`).then(r => r.data),
  });

  // 3) finding the current user
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => client.get('profile/').then(r => r.data),
  });

  // modal visibility & form state
  const [showAdd,   setShowAdd]   = useState(false);
  const [amount,    setAmount]    = useState('');
  const [note,      setNote]      = useState('');
  const [category,  setCategory]  = useState('General');
  const [paidBy, setPaidBy] = useState(me?.user_id);
  const [split,     setSplit]     = useState([]);
  const [showCatPicker, setShowCatPicker] = useState(false);

  // 3) mutation to create
  const addExp = useMutation({
    mutationFn: newExp => client.post('expenses/', newExp),
    onSuccess: () => {
      qc.invalidateQueries(['expenses', groupId]);
      resetForm();
      setShowAdd(false);
    },
    onError: err => {
      Alert.alert('Add failed', 'Please try again.');
    }
  });

  function resetForm() {
    setAmount(''); setNote('');
    setCategory('General');
    setPaidBy(null);
    setSplit(members.map(m => m.id)); // default: split among all
  }

  function handleSave() {
    const numeric = parseFloat(amount);

    if (!amount || isNaN(parseFloat(amount))) {
      return Alert.alert('Validation', 'Enter a valid amount.');
    }
    
    // 1a) amount > 0
    if (numeric <= 0) {
      return Alert.alert('Validation', 'Amount must be greater than zero.');
    }

    if (split.length === 0) {
      return Alert.alert(
        'Validation',
        'Select at least one member to split this expense between.'
      );
    }
    addExp.mutate({
      group:     groupId,
      amount:    parseFloat(amount),
      note,
      category,
      paid_by:   paidBy,
      split_between: split,
    });
  }

  if (loadingExp || loadingMem) {
    return <View style={styles.centered}><ActivityIndicator/></View>;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
        // footer = your big blue button
        ListFooterComponent={() => (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setShowAdd(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addText}>Add Expense</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* ——————— ADD EXPENSE MODAL ——————— */}
      <Modal visible={showAdd} animationType="slide">
        <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => setShowAdd(false)}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Expense</Text>
          <View style={{ width: 28 }} /> 
        </View>

        <View style={styles.modalBody}>
          <TextInput
            placeholder="Amount (e.g. 12.50)"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
          />

          <TextInput
            placeholder="Note (optional)"
            value={note}
            onChangeText={setNote}
            style={styles.input}
          />

          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowCatPicker(true)}
          >
            <Text style={styles.dropdownText}>
              {category || 'Category'}
            </Text>
            <Ionicons
              name={showCatPicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          {showCatPicker && (
            <Modal
              transparent
              animationType="slide"
              onRequestClose={() => setShowCatPicker(false)}
            >
              {/* darkened backdrop: tapping it closes picker */}
              <TouchableWithoutFeedback onPress={() => setShowCatPicker(false)}>
                <View style={styles.modalOverlay} />
              </TouchableWithoutFeedback>

              {/* picker container */}
              <View style={styles.modalPickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={value => {
                    setCategory(value);
                    setShowCatPicker(false);
                  }}
                >
                  <Picker.Item label="General" value="General" />
                  <Picker.Item label="Food" value="Food" />
                  <Picker.Item label="Travel" value="Travel" />
                  <Picker.Item label="Fun" value="Fun" />
                  <Picker.Item label="Gas" value="Gas" />
                  {/* …etc */}
                </Picker>
              </View>
            </Modal>
          )}


          <Text style={styles.label}>Paid by</Text>
                <Text style={styles.selector}>
                  {me.first_name} {me.last_name}
                </Text>

          <Text style={styles.label}>Split between</Text>
          {members.map(u => (
            <TouchableOpacity
              key={u.id}
              style={styles.checkboxRow}
              onPress={() => {
                setSplit(s => 
                  s.includes(u.id)
                    ? s.filter(x => x!==u.id)
                    : [...s, u.id]
                );
              }}
            >
              <Text style={styles.checkboxText}>
                {split.includes(u.id) ? '☑' : '☐'} {u.first_name} {u.last_name}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={addExp.isLoading}
          >
            {addExp.isLoading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  expenseItem:  { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  expenseText:  { fontSize: 16 },
  expenseDate:  { fontSize: 12, color: '#999', marginTop: 4 },
  message:      { textAlign: 'center', marginTop: 40, color: '#666' },
  addButton:    {
    margin: 16, backgroundColor: '#E91E63',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 12,
    borderRadius: 8,
  },
  addText:      { color: '#fff', fontSize: 16, marginLeft: 8 },

  /* modal */
  modalHeader:  {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    padding: 12,
    backgroundColor: '#fff',
  },
  modalTitle:   { fontSize: 18, fontWeight: '600' },
  modalBody:    { padding: 16, backgroundColor: '#f7f8fa', flex: 1 },
  input:        {
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  label:        { 
    marginTop: 12, 
    marginBottom: 6, 
    fontWeight: '700' 
  },

  pickerWrapper:{ 
    backgroundColor: '#fff', 
    borderRadius: 6, 
    marginBottom: 12 
  },

  radioRow:     {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginBottom: 6,
  },
  radioRowSelected: { backgroundColor: '#e0f7fa' },
  radioText:    { fontSize: 16 },
  checkboxRow:  { flexDirection: 'row', padding: 8, alignItems: 'center' },
  checkboxText: { fontSize: 16 },
  saveBtn:      {
    marginTop: 24,
    backgroundColor: '#E91E63',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },

  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFEFF4',
    borderRadius: 8,
    padding: 12,
  },
  


  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalPickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 10,
  },
});
