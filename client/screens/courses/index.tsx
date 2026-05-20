import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Screen } from '@/components/Screen';
import { coursesApi, teachersApi, type CoursePackage, type Teacher } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

export default function CoursesScreen() {
  const [courses, setCourses] = useState<CoursePackage[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const getTeacherName = (teacherId?: number) => {
    if (!teacherId) return '-';
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.name || '-';
  };

  const renderItem = ({ item }: { item: CoursePackage }) => (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-medium text-foreground">{item.name}</Text>
          <View className="flex-row items-center mt-2">
            <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg mr-2">
              <Text className="text-xs text-muted">
                {language === 'zh' ? '教练' : 'Coach'}: {getTeacherName(item.teacher_id)}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-2xl font-bold text-accent">{item.total_lessons}</Text>
          <Text className="text-xs text-muted">{language === 'zh' ? '总课时' : 'Total'}</Text>
        </View>
      </View>

      {/* 有效期 */}
      {item.start_date && (
        <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <View className="flex-row items-center">
            <FontAwesome6 name="calendar" size={14} color="#6B7280" />
            <Text className="text-sm text-muted ml-2">
              {language === 'zh' ? '有效期' : 'Valid Period'}: {item.start_date}
            </Text>
          </View>
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
            <Text className="text-2xl font-bold text-foreground">{t('courses.title')}</Text>
            <Text className="text-sm text-muted mt-1">
              {language === 'zh' ? '查看课程包信息' : 'View course packages'}
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
          data={courses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="p-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <FontAwesome6 name="folder-open" size={48} color="#D1D5DB" />
              <Text className="text-muted mt-4">{language === 'zh' ? '暂无课程包' : 'No courses'}</Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
