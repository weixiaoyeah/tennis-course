import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Screen } from '@/components/Screen';
import { coursesApi, teachersApi, type CoursePackage, type Teacher } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

export default function CoursesScreen() {
  const [courses, setCourses] = useState<CoursePackage[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CoursePackage | null>(null);
  const [formData, setFormData] = useState({ name: '', total_lessons: '10', teacher_id: undefined as number | undefined, start_date: '' });
  const [saving, setSaving] = useState(false);
  const { t, language, toggleLanguage } = useTranslation();

  const fetchData = useCallback(async () => {
    try {
      const [coursesData, teachersData] = await Promise.all([
        coursesApi.getAll(),
        teachersApi.getAll(),
      ]);
      setCourses(coursesData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Toast.show({ type: 'error', text1: t('messages.error') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

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
    setEditingCourse(null);
    setFormData({ name: '', total_lessons: '10', teacher_id: undefined, start_date: '' });
    setModalVisible(true);
  };

  const handleEdit = (course: CoursePackage) => {
    setEditingCourse(course);
    setFormData({ 
      name: course.name, 
      total_lessons: course.total_lessons.toString(), 
      teacher_id: course.teacher_id,
      start_date: course.start_date || '',
    });
    setModalVisible(true);
  };

  const handleDelete = (course: CoursePackage) => {
    Alert.alert(
      t('buttons.confirm'),
      (language === 'zh' ? `确定要删除「${course.name}」吗？\n注意：删除课程包将同时删除所有上课记录` : `Are you sure to delete "${course.name}"?\nNote: Deleting will also remove all lesson records`),
      [
        { text: t('buttons.cancel'), style: 'cancel' },
        {
          text: t('buttons.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await coursesApi.delete(course.id);
              Toast.show({ type: 'success', text1: t('messages.deleteSuccess') });
              fetchData();
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
    const lessons = parseInt(formData.total_lessons);
    if (isNaN(lessons) || lessons <= 0) {
      Toast.show({ type: 'error', text1: language === 'zh' ? '请输入有效的课时数' : 'Please enter valid lesson count' });
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name,
        total_lessons: lessons,
        teacher_id: formData.teacher_id,
        start_date: formData.start_date || undefined,
      };
      
      if (editingCourse) {
        await coursesApi.update(editingCourse.id, data);
        Toast.show({ type: 'success', text1: t('messages.updateSuccess') });
      } else {
        await coursesApi.create(data);
        Toast.show({ type: 'success', text1: t('messages.addSuccess') });
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      Toast.show({ type: 'error', text1: t('messages.error') });
    } finally {
      setSaving(false);
    }
  };

  const getTeacherName = (teacherId?: number) => {
    if (!teacherId) return t('courses.noTeacher');
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.name || 'Unknown';
  };

  const renderItem = ({ item }: { item: CoursePackage }) => (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-medium text-foreground">{item.name}</Text>
          <View className="flex-row items-center mt-2">
            <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg mr-2">
              <Text className="text-xs text-muted">{t('courses.teacher')}: {getTeacherName(item.teacher_id)}</Text>
            </View>
            {item.start_date && (
              <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                <Text className="text-xs text-muted">{item.start_date}</Text>
              </View>
            )}
          </View>
        </View>
        <View className="items-end ml-4">
          <Text className="text-2xl font-bold text-accent">{item.total_lessons}</Text>
          <Text className="text-xs text-muted">{t('courses.totalLessons')}</Text>
        </View>
      </View>
      
      <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <TouchableOpacity 
          className="px-4 py-2"
          onPress={() => handleEdit(item)}
        >
          <Text className="text-blue-500">{t('buttons.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="px-4 py-2"
          onPress={() => handleDelete(item)}
        >
          <Text className="text-red-500">{t('buttons.delete')}</Text>
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
            <Text className="text-2xl font-bold text-foreground">{t('courses.title')}</Text>
            <Text className="text-sm text-muted mt-1">
              {language === 'zh' ? '管理网球课程包' : 'Manage tennis course packages'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity 
              onPress={toggleLanguage}
              className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full mr-2"
            >
              <Text className="text-foreground text-sm font-medium">
                {language === 'zh' ? 'EN' : '中'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-accent px-4 py-2 rounded-full"
              onPress={handleAdd}
            >
              <Text className="text-white font-medium">+ {t('buttons.add')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        <FlatList
          className="flex-1 px-4 pt-2"
          data={courses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            loading ? null : (
              <View className="items-center pt-20">
                <Text className="text-muted">{t('courses.noCourses')}</Text>
                <Text className="text-sm text-muted mt-1">
                  {language === 'zh' ? '点击右上角添加课程' : 'Tap top right to add course'}
                </Text>
              </View>
            )
          }
          contentContainerStyle={courses.length === 0 ? { flex: 1 } : undefined}
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
                  {editingCourse ? t('courses.editCourse') : t('courses.addCourse')}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text className="text-2xl text-muted">×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="space-y-4 pb-6">
                  <View>
                    <Text className="text-sm font-medium text-foreground mb-2">{t('courses.name')} *</Text>
                    <TextInput
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-foreground"
                      placeholder={language === 'zh' ? '如：网球入门课程' : 'e.g. Tennis Beginner Course'}
                      placeholderTextColor="#9CA3AF"
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-foreground mb-2">{t('courses.totalLessons')} *</Text>
                    <TextInput
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-foreground"
                      placeholder={t('courses.placeholder.totalLessons')}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      value={formData.total_lessons}
                      onChangeText={(text) => setFormData({ ...formData, total_lessons: text })}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-foreground mb-2">{t('courses.teacher')}</Text>
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
                          {t('courses.noTeacher')}
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
                    <Text className="text-sm font-medium text-foreground mb-2">{t('courses.startDate')}</Text>
                    <TextInput
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-foreground"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                      value={formData.start_date}
                      onChangeText={(text) => setFormData({ ...formData, start_date: text })}
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
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
