import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, TouchableWithoutFeedback } from 'react-native';
import { Screen } from '@/components/Screen';
import { teachersApi, type Teacher } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

export default function TeachersScreen() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', remark: '' });
  const [saving, setSaving] = useState(false);
  const { t, language, toggleLanguage } = useTranslation();

  const fetchTeachers = useCallback(async () => {
    try {
      const data = await teachersApi.getAll();
      setTeachers(data);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      Toast.show({ type: 'error', text1: t('messages.error') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchTeachers();
    }, [fetchTeachers])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeachers();
  }, [fetchTeachers]);

  const handleAdd = () => {
    setEditingTeacher(null);
    setFormData({ name: '', phone: '', remark: '' });
    setModalVisible(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({ name: teacher.name, phone: teacher.phone || '', remark: teacher.remark || '' });
    setModalVisible(true);
  };

  const handleDelete = (teacher: Teacher) => {
    Alert.alert(
      t('buttons.confirm'),
      t('teachers.deleteConfirm'),
      [
        { text: t('buttons.cancel'), style: 'cancel' },
        {
          text: t('buttons.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await teachersApi.delete(teacher.id);
              Toast.show({ type: 'success', text1: t('messages.deleteSuccess') });
              fetchTeachers();
            } catch (error) {
              Toast.show({ type: 'error', text1: t('messages.error') });
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Toast.show({ type: 'error', text1: t('validation.required') });
      return;
    }

    setSaving(true);
    try {
      if (editingTeacher) {
        await teachersApi.update(editingTeacher.id, formData);
        Toast.show({ type: 'success', text1: t('messages.updateSuccess') });
      } else {
        await teachersApi.create(formData);
        Toast.show({ type: 'success', text1: t('messages.addSuccess') });
      }
      setModalVisible(false);
      fetchTeachers();
    } catch (error) {
      Toast.show({ type: 'error', text1: t('messages.error') });
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Teacher }) => (
    <View className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 mb-3 shadow-md border border-orange-100">
      <View className="flex-row items-center">
        <View className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl items-center justify-center shadow-md">
          <FontAwesome6 name="user-tie" size={24} color="white" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
          {item.phone && (
            <Text className="text-sm text-gray-500 mt-1 flex-row items-center">
              <FontAwesome6 name="phone" size={12} color="#9ca3af" /> {item.phone}
            </Text>
          )}
          {item.remark && (
            <Text className="text-sm text-gray-400 mt-1" numberOfLines={2}>{item.remark}</Text>
          )}
        </View>
        <View className="flex-row">
          <TouchableOpacity 
            className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-2 shadow-sm"
            onPress={() => handleEdit(item)}
          >
            <FontAwesome6 name="pencil" size={16} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="w-10 h-10 bg-red-100 rounded-xl items-center justify-center shadow-sm"
            onPress={() => handleDelete(item)}
          >
            <FontAwesome6 name="trash" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Screen>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="bg-gradient-to-br from-orange-400 to-amber-400 p-2.5 rounded-xl mr-3">
              <FontAwesome6 name="user-tie" size={22} color="white" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-gray-800">{t('teachers.title')}</Text>
              <Text className="text-sm text-orange-500 mt-0.5">
                {language === 'zh' ? '管理网球教练信息' : 'Manage tennis coach info'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity 
              onPress={toggleLanguage}
              className="bg-gradient-to-r from-orange-400 to-amber-400 px-4 py-2 rounded-full shadow-md"
            >
              <Text className="text-white text-sm font-semibold">
                {language === 'zh' ? 'EN' : '中'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 rounded-full shadow-lg"
              onPress={handleAdd}
            >
              <Text className="text-white font-bold">+ {t('buttons.add')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        <FlatList
          className="flex-1 px-4 pt-2"
          data={teachers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            loading ? null : (
              <View className="items-center pt-20">
                <View className="bg-orange-100 p-4 rounded-full mb-3">
                  <FontAwesome6 name="user-tie" size={32} color="#f97316" />
                </View>
                <Text className="text-gray-600 font-medium">{t('teachers.noTeachers')}</Text>
                <Text className="text-sm text-gray-400 mt-1">
                  {language === 'zh' ? '点击右上角添加教练' : 'Tap top right to add teacher'}
                </Text>
              </View>
            )
          }
          contentContainerStyle={teachers.length === 0 ? { flex: 1 } : undefined}
        />

        {/* Add/Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View className="flex-1" />
            </TouchableWithoutFeedback>
            <View className="bg-gradient-to-t from-white to-orange-50 rounded-t-3xl p-6 shadow-2xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800">
                  {editingTeacher ? t('teachers.editTeacher') : t('teachers.addTeacher')}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <View className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center">
                    <Text className="text-gray-500 text-xl">×</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">{t('teachers.name')} *</Text>
                  <TextInput
                    className="bg-white border-2 border-orange-100 rounded-xl px-4 py-3 text-gray-800 shadow-sm"
                    placeholder={t('teachers.placeholder.name')}
                    placeholderTextColor="#9CA3AF"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">{t('teachers.phone')}</Text>
                  <TextInput
                    className="bg-white border-2 border-orange-100 rounded-xl px-4 py-3 text-gray-800 shadow-sm"
                    placeholder={t('teachers.placeholder.phone')}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">{t('teachers.remark')}</Text>
                  <TextInput
                    className="bg-white border-2 border-orange-100 rounded-xl px-4 py-3 text-gray-800 shadow-sm"
                    multiline
                    numberOfLines={3}
                    value={formData.remark}
                    onChangeText={(text) => setFormData({ ...formData, remark: text })}
                  />
                </View>

                <TouchableOpacity
                  className={`bg-accent rounded-xl py-4 mt-4 ${saving ? 'opacity-50' : ''}`}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text className="text-white font-semibold text-center">
                    {saving ? (language === 'zh' ? '保存中...' : 'Saving...') : t('buttons.save')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
