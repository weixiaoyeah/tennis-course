import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Screen } from '@/components/Screen';
import { lessonsApi, coursesApi, teachersApi, type LessonRecord, type CoursePackage, type Teacher } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

export default function RecordsScreen() {
  const [records, setRecords] = useState<LessonRecord[]>([]);
  const [courses, setCourses] = useState<CoursePackage[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t, language, toggleLanguage } = useTranslation();

  const fetchData = useCallback(async () => {
    try {
      const [recordsData, coursesData, teachersData] = await Promise.all([
        lessonsApi.getAll(),
        coursesApi.getAll(),
        teachersApi.getAll(),
      ]);
      setRecords(recordsData || []);
      setCourses(coursesData || []);
      setTeachers(teachersData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setRecords([]);
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

  const getCourseName = (courseId?: number) => {
    if (!courseId) return '-';
    const course = courses.find(c => c.id === courseId);
    return course?.name || '-';
  };

  const getTeacherName = (teacherId?: number) => {
    if (!teacherId) return '-';
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.name || '-';
  };

  const renderItem = ({ item }: { item: LessonRecord }) => (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center">
          <View className="bg-accent/10 p-2 rounded-xl mr-3">
            <FontAwesome6 name="circle-check" size={20} color="#4F46E5" />
          </View>
          <View>
            <Text className="text-base font-medium text-foreground">{item.lesson_date}</Text>
            <Text className="text-sm text-muted mt-1">
              {language === 'zh' ? '教练' : 'Coach'}: {getTeacherName(item.teacher_id)}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <View className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
            <Text className="text-green-600 dark:text-green-400 font-medium text-sm">
              {item.duration} {language === 'zh' ? '课时' : 'lessons'}
            </Text>
          </View>
        </View>
      </View>
      {item.remark && (
        <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Text className="text-sm text-muted">{item.remark}</Text>
        </View>
      )}
    </View>
  );

  return (
    <Screen>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-foreground">{t('records.title')}</Text>
            <Text className="text-sm text-muted mt-1">
              {language === 'zh' ? '已完成的上课记录' : 'Completed lesson records'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={toggleLanguage}
            className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full"
          >
            <Text className="text-foreground text-sm font-medium">
              {language === 'zh' ? 'EN' : '中'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="p-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <FontAwesome6 name="clipboard-list" size={48} color="#D1D5DB" />
              <Text className="text-muted mt-4">{language === 'zh' ? '暂无上课记录' : 'No records'}</Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
