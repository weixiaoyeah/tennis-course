import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/Screen';
import { statsApi, type Stats } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

// 获取下一个周六的日期
function getNextSaturday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek);
  const nextSat = new Date(today);
  nextSat.setDate(today.getDate() + daysUntilSaturday);
  return nextSat;
}

// 格式化日期
function formatDate(date: Date, language: 'zh' | 'en'): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (language === 'zh') {
    return `${year}年${month}月${day}日`;
  }
  return `${month}/${day}/${year}`;
}

// 获取星期几
function getDayName(language: 'zh' | 'en'): string {
  return language === 'zh' ? '周六' : 'Saturday';
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t, language, toggleLanguage } = useTranslation();

  const fetchStats = useCallback(async () => {
    try {
      const data = await statsApi.getAll();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{language === 'zh' ? '加载中...' : 'Loading...'}</Text>
        </View>
      </Screen>
    );
  }

  const remainingPercent = stats && stats.total_lessons > 0 
    ? Math.round((stats.remaining_lessons / stats.total_lessons) * 100) 
    : 0;

  // 计算下一个周六
  const nextSaturday = getNextSaturday();
  const formattedDate = formatDate(nextSaturday, language);
  const dayName = getDayName(language);

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Language Switcher */}
        <View className="px-4 pt-4 flex-row justify-end">
          <TouchableOpacity 
            onPress={toggleLanguage}
            className="bg-gradient-to-r from-orange-400 to-amber-400 px-4 py-2 rounded-full flex-row items-center shadow-md"
          >
            <FontAwesome6 name="globe" size={14} color="white" />
            <Text className="text-white text-sm ml-2 font-semibold">
              {language === 'zh' ? 'EN' : '中'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header with tennis icon */}
        <View className="px-4 pb-4 flex-row items-center">
          <View className="bg-gradient-to-br from-orange-400 to-amber-400 p-3 rounded-xl mr-3">
            <FontAwesome6 name="table-cells" size={24} color="white" />
          </View>
          <View>
            <Text className="text-2xl font-bold text-foreground">
              {language === 'zh' ? '网球课程' : 'Tennis Course'}
            </Text>
            <Text className="text-sm text-orange-500 mt-0.5">
              {language === 'zh' ? '课时统计' : 'Lesson Statistics'}
            </Text>
          </View>
        </View>

        {/* Main Stats Card - 活泼渐变风格 */}
        <View className="px-4 pb-4">
          <View className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 shadow-lg border border-orange-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-800">
                {language === 'zh' ? '剩余课时' : 'Remaining Lessons'}
              </Text>
              <View className="bg-gradient-to-r from-orange-400 to-amber-400 px-3 py-1 rounded-full">
                <Text className="text-white font-bold text-sm">{remainingPercent}%</Text>
              </View>
            </View>
            
            <View className="flex-row items-end mb-4">
              <Text className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">{stats?.remaining_lessons || 0}</Text>
              <Text className="text-lg text-gray-500 ml-2 mb-2">
                / {stats?.total_lessons || 0} {language === 'zh' ? '课时' : 'lessons'}
              </Text>
            </View>

            {/* Progress Bar - 活泼渐变 */}
            <View className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
              <View 
                className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 rounded-full"
                style={{ width: `${remainingPercent}%` }}
              />
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-between mt-5 pt-4 border-t border-orange-100">
              <View className="items-center flex-1">
                <View className="bg-green-100 p-2 rounded-xl mb-1">
                  <FontAwesome6 name="circle-check" size={20} color="#22c55e" />
                </View>
                <Text className="text-2xl font-bold text-green-600">{stats?.used_lessons || 0}</Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {language === 'zh' ? '已上课时' : 'Used'}
                </Text>
              </View>
              <View className="w-12" />
              <View className="items-center flex-1">
                <View className="bg-blue-100 p-2 rounded-xl mb-1">
                  <FontAwesome6 name="calendar-check" size={20} color="#3b82f6" />
                </View>
                <Text className="text-2xl font-bold text-blue-600">{stats?.total_records || 0}</Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {language === 'zh' ? '上课次数' : 'Sessions'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Course Schedule Card - 活泼紫色渐变 */}
        <View className="px-4 pb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3 flex-row items-center">
            <FontAwesome6 name="calendar-days" size={16} color="#8b5cf6" />
            {language === 'zh' ? '下次课程' : 'Next Lesson'}
          </Text>
          <View className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-3xl p-5 shadow-xl">
            <View className="flex-row items-center mb-4">
              <View className="bg-white/25 p-2.5 rounded-xl mr-3">
                <FontAwesome6 name="calendar" size={22} color="white" />
              </View>
              <Text className="text-xl font-bold text-white">
                {language === 'zh' ? '课程计划' : 'Course Schedule'}
              </Text>
            </View>
            
            {/* Date Display */}
            <View className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mb-4">
              <Text className="text-white/70 text-sm mb-1">
                {language === 'zh' ? '上课时间' : 'Lesson Time'}
              </Text>
              <Text className="text-white text-2xl font-bold">
                {dayName} {formattedDate}
              </Text>
              <Text className="text-white/90 text-lg mt-1">
                10:00 - 12:00
              </Text>
            </View>

            {/* Info Row - 活泼卡片 */}
            <View className="flex-row justify-between">
              <View className="flex-row items-center bg-white/15 px-3 py-2 rounded-xl flex-1 mr-2">
                <FontAwesome6 name="user-tie" size={14} color="white" />
                <Text className="text-white/90 text-sm ml-2">
                  {language === 'zh' ? '教练' : 'Coach'}: Hany
                </Text>
              </View>
              <View className="flex-row items-center bg-white/15 px-3 py-2 rounded-xl flex-1 ml-2">
                <FontAwesome6 name="book" size={14} color="white" />
                <Text className="text-white/90 text-sm ml-2">
                  {language === 'zh' ? '学生' : 'Student'}: Book
                </Text>
              </View>
            </View>
            <View className="flex-row justify-center mt-3">
              <View className="bg-yellow-400 px-3 py-1.5 rounded-full">
                <Text className="text-gray-900 text-xs font-bold">
                  2 {language === 'zh' ? '课时' : 'lessons'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
