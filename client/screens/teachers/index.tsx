import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { Screen } from '@/components/Screen';
import { teachersApi, type Teacher } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { FontAwesome6 } from '@expo/vector-icons';

export default function TeachersScreen() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', remark: '' });
  const [saving, setSaving] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      const data = await teachersApi.getAll();
      setTeachers(data);
    } catch (error) {
      console.error('获取老师列表失败:', error);
      Toast.show({ type: 'error', text1: '获取老师列表失败' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
      '确认删除',
      `确定要删除教练「${teacher.name}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await teachersApi.delete(teacher.id);
              Toast.show({ type: 'success', text1: '删除成功' });
              fetchTeachers();
            } catch (error) {
              Toast.show({ type: 'error', text1: '删除失败' });
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Toast.show({ type: 'error', text1: '请输入教练姓名' });
      return;
    }

    setSaving(true);
    try {
      if (editingTeacher) {
        await teachersApi.update(editingTeacher.id, formData);
        Toast.show({ type: 'success', text1: '更新成功' });
      } else {
        await teachersApi.create(formData);
        Toast.show({ type: 'success', text1: '添加成功' });
      }
      setModalVisible(false);
      fetchTeachers();
    } catch (error) {
      Toast.show({ type: 'error', text1: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Teacher }) => (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-center">
        <View className="w-12 h-12 bg-accent/10 rounded-full items-center justify-center">
          <FontAwesome6 name="user-tie" size={24} color="#4F46E5" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-base font-medium text-foreground">{item.name}</Text>
          {item.phone && (
            <Text className="text-sm text-muted mt-1">{item.phone}</Text>
          )}
          {item.remark && (
            <Text className="text-sm text-muted mt-1" numberOfLines={2}>{item.remark}</Text>
          )}
        </View>
        <View className="flex-row">
          <TouchableOpacity 
            className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mr-2"
            onPress={() => handleEdit(item)}
          >
            <FontAwesome6 name="pencil" size={16} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center"
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
          <View>
            <Text className="text-2xl font-bold text-foreground">教练管理</Text>
            <Text className="text-sm text-muted mt-1">管理网球教练信息</Text>
          </View>
          <TouchableOpacity 
            className="bg-accent px-4 py-2 rounded-full"
            onPress={handleAdd}
          >
            <Text className="text-white font-medium">+ 添加</Text>
          </TouchableOpacity>
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
                <Text className="text-muted">暂无教练信息</Text>
                <Text className="text-sm text-muted mt-1">点击右上角添加教练</Text>
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
            <View className="bg-white dark:bg-gray-800 rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-foreground">
                  {editingTeacher ? '编辑教练' : '添加教练'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text className="text-2xl text-muted">×</Text>
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">姓名 *</Text>
                  <TextInput
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-foreground"
                    placeholder="请输入教练姓名"
                    placeholderTextColor="#9CA3AF"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">联系电话</Text>
                  <TextInput
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-foreground"
                    placeholder="请输入联系电话"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">备注</Text>
                  <TextInput
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-foreground"
                    placeholder="请输入备注信息"
                    placeholderTextColor="#9CA3AF"
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
                    {saving ? '保存中...' : '保存'}
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

import { TouchableWithoutFeedback } from 'react-native';
