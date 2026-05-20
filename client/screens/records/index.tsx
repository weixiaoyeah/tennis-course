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
    <View className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 mb-3 shadow-md border border-green-100">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center flex-1">
          <View className="bg-gradient-to-br from-green-400 to-emerald-500 p-2.5 rounded-xl mr-3 shadow-md">
            <FontAwesome6 name="circle-check" size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800">{item.lesson_date}</Text>
            <Text className="text-sm text-gray-500 mt-1 flex-row items-center">
              <FontAwesome6 name="user-tie" size={12} color="#9ca3af" /> {language === 'zh' ? '教练' : 'Coach'}: {getTeacherName(item.teacher_id)}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <View className="bg-gradient-to-r from-green-400 to-emerald-500 px-3 py-1.5 rounded-full shadow-sm">
            <Text className="text-white font-bold text-sm">
              {item.duration} {language === 'zh' ? '课时' : 'lessons'}
            </Text>
          </View>
        </View>
      </View>
      {item.remark && (
        <View className="mt-3 pt-3 border-t border-green-100">
          <Text className="text-sm text-gray-500 bg-white/50 px-3 py-2 rounded-xl">{item.remark}</Text>
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
            <View className="bg-gradient-to-br from-green-400 to-emerald-500 p-2.5 rounded-xl mr-3">
              <FontAwesome6 name="clipboard-list" size={22} color="white" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-gray-800">{t('records.title')}</Text>
              <Text className="text-sm text-green-500 mt-0.5">
                {language === 'zh' ? '已完成的上课记录' : 'Completed lesson records'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={toggleLanguage}
            className="bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-2 rounded-full shadow-md"
          >
            <Text className="text-white text-sm font-semibold">
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
              <View className="bg-green-100 p-4 rounded-full mb-3">
                <FontAwesome6 name="clipboard-list" size={32} color="#22c55e" />
              </View>
              <Text className="text-gray-600 font-medium">{language === 'zh' ? '暂无上课记录' : 'No records'}</Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
