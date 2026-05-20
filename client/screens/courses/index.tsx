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
    <View className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-5 mb-4 shadow-lg border border-violet-100">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View className="bg-gradient-to-br from-violet-400 to-purple-500 p-2 rounded-xl mr-3">
              <FontAwesome6 name="book" size={18} color="white" />
            </View>
            <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
          </View>
          <View className="flex-row items-center">
            <View className="bg-white/70 px-3 py-1.5 rounded-full mr-2">
              <Text className="text-xs text-violet-600 font-medium flex-row items-center">
                <FontAwesome6 name="user-tie" size={10} color="#8b5cf6" /> {getTeacherName(item.teacher_id)}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-center">
          <View className="bg-gradient-to-br from-violet-400 to-purple-500 px-4 py-2 rounded-2xl shadow-md">
            <Text className="text-3xl font-black text-white">{item.total_lessons}</Text>
          </View>
          <Text className="text-xs text-gray-500 mt-1 font-medium">{language === 'zh' ? '总课时' : 'Total'}</Text>
        </View>
      </View>

      {/* 有效期 */}
      {item.start_date && (
        <View className="mt-4 pt-3 border-t border-violet-100">
          <View className="flex-row items-center bg-white/50 px-3 py-2 rounded-xl">
            <FontAwesome6 name="calendar-days" size={14} color="#8b5cf6" />
            <Text className="text-sm text-gray-600 ml-2 font-medium">
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
          <View className="flex-row items-center">
            <View className="bg-gradient-to-br from-violet-400 to-purple-500 p-2.5 rounded-xl mr-3">
              <FontAwesome6 name="book" size={22} color="white" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-gray-800">{t('courses.title')}</Text>
              <Text className="text-sm text-violet-500 mt-0.5">
                {language === 'zh' ? '查看课程包信息' : 'View course packages'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={toggleLanguage}
            className="bg-gradient-to-r from-violet-400 to-purple-500 px-4 py-2 rounded-full shadow-md"
          >
            <Text className="text-white text-sm font-semibold">
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
              <View className="bg-violet-100 p-4 rounded-full mb-3">
                <FontAwesome6 name="folder-open" size={32} color="#8b5cf6" />
              </View>
              <Text className="text-gray-600 font-medium">{language === 'zh' ? '暂无课程包' : 'No courses'}</Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
