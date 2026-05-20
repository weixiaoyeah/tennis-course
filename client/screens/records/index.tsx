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

  // 计算课时统计
  // 只统计已确认的课时（未上课不扣课时）
  const totalLessons = courses.reduce((sum, c) => sum + (c.total_lessons || 0), 0);
  const usedLessons = records.reduce((sum, r) => {
    if (r.confirmed_by) {
      return sum + (r.duration || 0);
    }
    return sum;
  }, 0);
  const remainingLessons = totalLessons - usedLessons;
  const progressPercent = totalLessons > 0 ? Math.round((usedLessons / totalLessons) * 100) : 0;

  const getConfirmBadge = (confirmed_by?: string) => {
    // 未上课显示灰色标签
    if (!confirmed_by) {
      return (
        <View className="flex-row items-center bg-gray-300 px-2 py-0.5 rounded-full shadow-sm">
          <FontAwesome6 
            name="ban" 
            size={9} 
            color="white" 
          />
          <Text className="text-white text-xs ml-1 font-semibold">
            {language === 'zh' ? '未上课' : 'Absent'}
          </Text>
        </View>
      );
    }
    
    const isCoach = confirmed_by === 'coach';
    return (
      <View className={`flex-row items-center ${isCoach 
        ? 'bg-gradient-to-r from-violet-500 to-purple-500' 
        : 'bg-gradient-to-r from-blue-500 to-cyan-500'} px-2 py-0.5 rounded-full shadow-sm`}>
        <FontAwesome6 
          name={isCoach ? 'user-tie' : 'graduation-cap'} 
          size={9} 
          color="white" 
        />
        <Text className="text-white text-xs ml-1 font-semibold">
          {isCoach 
            ? (language === 'zh' ? '教练确认' : 'Coach') 
            : (language === 'zh' ? '学生确认' : 'Student')
          }
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: LessonRecord }) => {
    const isAbsent = !item.confirmed_by;
    
    return (
    <View className={`rounded-xl p-3 mb-2 shadow-sm border ${isAbsent ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className={`p-2 rounded-lg mr-2.5 ${isAbsent ? 'bg-gray-200' : 'bg-gradient-to-br from-green-400 to-emerald-500'}`}>
            <FontAwesome6 name={isAbsent ? "circle-xmark" : "circle-check"} size={16} color="white" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center flex-wrap gap-1.5">
              <Text className={`text-sm font-bold ${isAbsent ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {item.lesson_date}
              </Text>
              {isAbsent ? (
                <View className="bg-gray-200 px-1.5 py-0.5 rounded">
                  <Text className="text-gray-500 text-xs">{language === 'zh' ? '未上课' : 'Absent'}</Text>
                </View>
              ) : (
                getConfirmBadge(item.confirmed_by)
              )}
            </View>
            <Text className="text-xs text-gray-500 mt-0.5 flex-row items-center">
              <FontAwesome6 name="user-tie" size={10} color="#9ca3af" /> {language === 'zh' ? '教练' : 'Coach'}: {getTeacherName(item.teacher_id)}
            </Text>
          </View>
        </View>
        <View className={`px-2.5 py-1 rounded-lg ${isAbsent ? 'bg-gray-200' : 'bg-gradient-to-r from-green-400 to-emerald-500'}`}>
          <Text className={`font-bold text-xs ${isAbsent ? 'text-gray-400 line-through' : 'text-white'}`}>
            {item.duration} {language === 'zh' ? '课时' : 'less'}
          </Text>
        </View>
      </View>
      {item.remark && (
        <Text className="text-xs text-gray-500 mt-2 px-2">{item.remark}</Text>
      )}
    </View>
  );
  };

  return (
    <Screen>
      <View className="flex-1">
        {/* Header */}
        <View className="px-3 pt-2 pb-1.5">
          <View className="flex-row items-center">
            <View className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-xl mr-2.5">
              <FontAwesome6 name="clipboard-list" size={18} color="white" />
            </View>
            <Text className="text-lg font-bold text-gray-800">{t('records.title')}</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View className="px-3 pt-1 pb-2">
          <View className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-4 shadow-lg">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-bold text-sm">
                {language === 'zh' ? '课时进度' : 'Progress'}
              </Text>
              <Text className="text-white/80 text-xs">
                {usedLessons}/{totalLessons} {language === 'zh' ? '课时' : 'lessons'}
              </Text>
            </View>
            <View className="bg-white/30 rounded-full h-3 mb-2">
              <View 
                className="bg-white rounded-full h-3" 
                style={{ width: `${progressPercent}%` }} 
              />
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-white/90 text-xs">
                {language === 'zh' ? '已完成' : 'Completed'}: {usedLessons}
              </Text>
              <Text className="text-white font-bold text-lg">
                {remainingLessons}
              </Text>
              <Text className="text-white/90 text-xs">
                {language === 'zh' ? '剩余课时' : 'Remaining'}
              </Text>
            </View>
          </View>
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
