import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
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
    <View className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 mb-2 shadow-sm border border-green-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-lg mr-2.5">
            <FontAwesome6 name="circle-check" size={16} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-800">{item.lesson_date}</Text>
            <Text className="text-xs text-gray-500 mt-0.5 flex-row items-center">
              <FontAwesome6 name="user-tie" size={10} color="#9ca3af" /> {language === 'zh' ? '教练' : 'Coach'}: {getTeacherName(item.teacher_id)}
            </Text>
          </View>
        </View>
        <View className="bg-gradient-to-r from-green-400 to-emerald-500 px-2.5 py-1 rounded-lg">
          <Text className="text-white font-bold text-xs">
            {item.duration} {language === 'zh' ? '课时' : 'less'}
          </Text>
        </View>
      </View>
      {item.remark && (
        <Text className="text-xs text-gray-500 mt-2 px-2">{item.remark}</Text>
      )}
    </View>
  );

  return (
    <Screen>
      <View className="flex-1">
        {/* Header */}
        <View className="px-3 pt-2 pb-1.5 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-xl mr-2.5">
              <FontAwesome6 name="clipboard-list" size={18} color="white" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-800">{t('records.title')}</Text>
              <Text className="text-xs text-green-500">
                {language === 'zh' ? '上课记录' : 'Lesson records'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={toggleLanguage}
            className="bg-gradient-to-r from-green-400 to-emerald-500 px-2.5 py-1.5 rounded-full"
          >
            <Text className="text-white text-xs font-semibold">
              {language === 'zh' ? 'EN' : '中'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="px-3 pt-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <View className="bg-green-100 p-3 rounded-full mb-2.5">
                <FontAwesome6 name="clipboard-list" size={28} color="#10b981" />
              </View>
              <Text className="text-gray-600 font-medium text-sm">{language === 'zh' ? '暂无上课记录' : 'No records'}</Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
