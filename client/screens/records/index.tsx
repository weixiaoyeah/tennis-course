import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, ScrollView } from 'react-native';
import { Screen } from '@/components/Screen';
import { lessonsApi, coursesApi, teachersApi, type LessonRecord, type CoursePackage, type Teacher } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { FontAwesome6 } from '@expo/vector-icons';

export default function RecordsScreen() {
  const [records, setRecords] = useState<LessonRecord[]>([]);
  const [courses, setCourses] = useState<CoursePackage[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LessonRecord | null>(null);
  const [formData, setFormData] = useState({ 
    course_package_id: undefined as number | undefined, 
    teacher_id: undefined as number | undefined,
    lesson_date: '', 
    duration: '1', 
    remark: '' 
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [recordsData, coursesData, teachersData] = await Promise.all([
        lessonsApi.getAll(),
        coursesApi.getAll(),
        teachersApi.getAll(),
      ]);
      setRecords(recordsData);
      setCourses(coursesData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('获取数据失败:', error);
      Toast.show({ type: 'error', text1: '获取数据失败' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingRecord(null);
    setFormData({ 
      course_package_id: courses.length > 0 ? courses[0].id : undefined, 
      teacher_id: undefined,
      lesson_date: new Date().toISOString().split('T')[0], 
      duration: '1', 
      remark: '' 
    });
    setModalVisible(true);
  };

  const handleEdit = (record: LessonRecord) => {
    setEditingRecord(record);
    setFormData({ 
      course_package_id: record.course_package_id, 
      teacher_id: record.teacher_id,
      lesson_date: record.lesson_date, 
      duration: record.duration.toString(), 
      remark: record.remark || ''
    });
    setModalVisible(true);
  };

  const handleDelete = (record: LessonRecord) => {
    Alert.alert(
      '确认删除',
      `确定要删除此上课记录吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await lessonsApi.delete(record.id);
              Toast.show({ type: 'success', text1: '删除成功' });
              fetchData();
            } catch (error) {
              Toast.show({ type: 'error', text1: '删除失败' });
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.course_package_id) {
      Toast.show({ type: 'error', text1: '请选择课程' });
      return;
    }
    if (!formData.lesson_date.trim()) {
      Toast.show({ type: 'error', text1: '请输入上课日期' });
      return;
    }
    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration <= 0) {
      Toast.show({ type: 'error', text1: '请输入有效的课时数' });
      return;
    }

    setSaving(true);
    try {
      const data = {
        course_package_id: formData.course_package_id,
        teacher_id: formData.teacher_id,
        lesson_date: formData.lesson_date,
        duration: duration,
        remark: formData.remark || undefined,
      };
      
      if (editingRecord) {
        await lessonsApi.update(editingRecord.id, data);
        Toast.show({ type: 'success', text1: '更新成功' });
      } else {
        await lessonsApi.create(data);
        Toast.show({ type: 'success', text1: '记录成功' });
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      Toast.show({ type: 'error', text1: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const getCourseName = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    return course?.name || '未知课程';
  };

  const getTeacherName = (teacherId?: number) => {
    if (!teacherId) return '-';
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.name || '未知';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' });
    } catch {
      return dateStr;
    }
  };

  const renderItem = ({ item }: { item: LessonRecord }) => (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-start">
        <View className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center">
          <FontAwesome6 name="volleyball" size={20} color="#22C55E" />
        </View>
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-base font-medium text-foreground">
                {getCourseName(item.course_package_id)}
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-sm text-muted">{formatDate(item.lesson_date)}</Text>
                <View className="w-1 h-1 bg-muted rounded-full mx-2" />
                <Text className="text-sm text-muted">教练: {getTeacherName(item.teacher_id)}</Text>
              </View>
            </View>
            <View className="bg-accent/10 px-3 py-1 rounded-full">
              <Text className="text-accent font-medium text-sm">{item.duration}课时</Text>
            </View>
          </View>
          {item.remark && (
            <Text className="text-sm text-muted mt-2" numberOfLines={2}>{item.remark}</Text>
          )}
        </View>
      </View>
      
      <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <TouchableOpacity 
          className="px-4 py-2"
          onPress={() => handleEdit(item)}
        >
          <Text className="text-blue-500">编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="px-4 py-2"
          onPress={() => handleDelete(item)}
        >
          <Text className="text-red-500">删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-foreground">上课记录</Text>
            <Text className="text-sm text-muted mt-1">记录每次网球课</Text>
          </View>
          <TouchableOpacity 
            className="bg-accent px-4 py-2 rounded-full"
            onPress={handleAdd}
            disabled={courses.length === 0}
          >
            <Text className="text-white font-medium">+ 记录</Text>
          </TouchableOpacity>
        </View>

        {courses.length === 0 && !loading && (
          <View className="px-4 py-2">
            <View className="bg-yellow-100 dark:bg-yellow-900/20 rounded-xl p-3">
              <Text className="text-yellow-800 dark:text-yellow-200 text-sm">
                请先在「课程」中添加课程包后再记录上课
              </Text>
            </View>
          </View>
        )}

        {/* List */}
        <FlatList
          className="flex-1 px-4 pt-2"
          data={records}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            loading ? null : (
              <View className="items-center pt-20">
                <Text className="text-muted">暂无上课记录</Text>
                <Text className="text-sm text-muted mt-1">点击右上角记录上课</Text>
              </View>
            )
          }
          contentContainerStyle={records.length === 0 ? { flex: 1 } : undefined}
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
            <View className="bg-white dark:bg-gray-800 rounded-t-3xl p-6 max-h-screen-2/3">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-foreground">
                  {editingRecord ? '编辑记录' : '记录上课'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text className="text-2xl text-muted">×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="space-y-4 pb-6">
                  <View>
                    <Text className="text-sm font-medium text-foreground mb-2">选择课程 *</Text>
                    <View className="flex-row flex-wrap">
                      {courses.map((course) => (
                        <TouchableOpacity
                          key={course.id}
                          className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                            formData.course_package_id === course.id 
                              ? 'bg-accent' 
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                          onPress={() => setFormData({ ...formData, course_package_id: course.id })}
                        >
                          <Text className={formData.course_package_id === course.id ? 'text-white' : 'text-foreground'}>
                            {course.name} ({course.total_lessons}课时)
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-foreground mb-2">上课日期 *</Text>
                    <TextInput
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-foreground"
                      placeholder="如：2024-01-15"
                      placeholderTextColor="#9CA3AF"
                      value={formData.lesson_date}
                      onChangeText={(text) => setFormData({ ...formData, lesson_date: text })}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-foreground mb-2">课时数 *</Text>
                    <View className="flex-row items-center">
                      {[1, 1.5, 2].map((d) => (
                        <TouchableOpacity
                          key={d}
                          className={`px-6 py-3 rounded-xl mr-3 ${
                            formData.duration === d.toString() 
                              ? 'bg-accent' 
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                          onPress={() => setFormData({ ...formData, duration: d.toString() })}
                        >
                          <Text className={formData.duration === d.toString() ? 'text-white' : 'text-foreground'}>
                            {d}课时
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-foreground mb-2">教练</Text>
                    <View className="flex-row flex-wrap">
                      <TouchableOpacity
                        className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                          !formData.teacher_id 
                            ? 'bg-accent' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                        onPress={() => setFormData({ ...formData, teacher_id: undefined })}
                      >
                        <Text className={!formData.teacher_id ? 'text-white' : 'text-foreground'}>
                          不指定
                        </Text>
                      </TouchableOpacity>
                      {teachers.map((teacher) => (
                        <TouchableOpacity
                          key={teacher.id}
                          className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                            formData.teacher_id === teacher.id 
                              ? 'bg-accent' 
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                          onPress={() => setFormData({ ...formData, teacher_id: teacher.id })}
                        >
                          <Text className={formData.teacher_id === teacher.id ? 'text-white' : 'text-foreground'}>
                            {teacher.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-foreground mb-2">备注</Text>
                    <TextInput
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-foreground"
                      placeholder="如：今天学会了正手击球"
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
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}

import { TouchableWithoutFeedback } from 'react-native';
