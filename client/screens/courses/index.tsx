import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
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
  const { language, toggleLanguage } = useTranslation();

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
    <View className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3.5 mb-2.5 shadow-sm border border-violet-100">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 flex-row items-center">
          <View className="bg-gradient-to-br from-violet-400 to-purple-500 p-2 rounded-lg mr-2.5">
            <FontAwesome6 name="book" size={16} color="white" />
          </View>
          <Text className="text-base font-bold text-gray-800">{item.name}</Text>
        </View>
        <View className="bg-gradient-to-br from-violet-400 to-purple-500 px-3 py-1.5 rounded-lg">
          <Text className="text-2xl font-black text-white">{item.total_lessons}</Text>
        </View>
      </View>

      <View className="flex-row items-center mt-2.5 gap-2">
        <View className="bg-white/70 px-2.5 py-1 rounded-lg flex-row items-center">
          <FontAwesome6 name="user-tie" size={10} color="#8b5cf6" />
          <Text className="text-xs text-violet-600 font-medium ml-1.5">{getTeacherName(item.teacher_id)}</Text>
        </View>
        {item.start_date && (
          <View className="bg-white/70 px-2.5 py-1 rounded-lg flex-row items-center">
            <FontAwesome6 name="calendar-days" size={10} color="#8b5cf6" />
            <Text className="text-xs text-violet-600 font-medium ml-1.5">
              {language === 'zh' ? '有效期' : 'Valid'} {item.start_date} - 2027.4.1
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Screen>
      <View className="flex-1">
        {/* Header */}
        <View className="px-3 pt-2 pb-1.5 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="bg-gradient-to-br from-violet-400 to-purple-500 p-2 rounded-xl mr-2.5">
              <FontAwesome6 name="book" size={18} color="white" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-800">{language === 'zh' ? '课程包' : 'Courses'}</Text>
              <Text className="text-xs text-violet-500">
                {language === 'zh' ? '课程信息' : 'Course info'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={toggleLanguage}
            className="bg-gradient-to-r from-violet-400 to-purple-500 px-2.5 py-1.5 rounded-full"
          >
            <Text className="text-white text-xs font-semibold">
              {language === 'zh' ? 'EN' : '中'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={courses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="px-3 pt-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <View className="bg-violet-100 p-3 rounded-full mb-2.5">
                <FontAwesome6 name="folder-open" size={28} color="#8b5cf6" />
              </View>
              <Text className="text-gray-600 font-medium text-sm">{language === 'zh' ? '暂无课程包' : 'No courses'}</Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
