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
            className="bg-accent/10 px-3 py-1.5 rounded-full flex-row items-center"
          >
            <FontAwesome6 name="globe" size={14} color="#6366F1" />
            <Text className="text-accent text-sm ml-1.5 font-medium">
              {language === 'zh' ? 'EN' : '中'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View className="px-4 pb-4">
          <Text className="text-2xl font-bold text-foreground">
            {language === 'zh' ? '网球课程' : 'Tennis Course'}
          </Text>
          <Text className="text-sm text-muted mt-1">
            {language === 'zh' ? '课时统计' : 'Lesson Statistics'}
          </Text>
        </View>

        {/* Main Stats Card */}
        <View className="px-4 pb-4">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">
                {language === 'zh' ? '剩余课时' : 'Remaining Lessons'}
              </Text>
              <View className="bg-accent/10 px-3 py-1 rounded-full">
                <Text className="text-accent font-medium text-sm">{remainingPercent}%</Text>
              </View>
            </View>
            
            <View className="flex-row items-end mb-4">
              <Text className="text-5xl font-bold text-accent">{stats?.remaining_lessons || 0}</Text>
              <Text className="text-lg text-muted ml-2 mb-2">
                / {stats?.total_lessons || 0} {language === 'zh' ? '课时' : 'lessons'}
              </Text>
            </View>

            {/* Progress Bar */}
            <View className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <View 
                className="h-full bg-accent rounded-full"
                style={{ width: `${remainingPercent}%` }}
              />
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-500">{stats?.used_lessons || 0}</Text>
                <Text className="text-xs text-muted mt-1">
                  {language === 'zh' ? '已上课时' : 'Used'}
                </Text>
              </View>
              <View className="w-px bg-gray-200 dark:bg-gray-700" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-orange-500">{stats?.total_records || 0}</Text>
                <Text className="text-xs text-muted mt-1">
                  {language === 'zh' ? '上课次数' : 'Sessions'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Course Schedule Card */}
        <View className="px-4 pb-6">
          <View className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-lg">
            <View className="flex-row items-center mb-3">
              <View className="bg-white/20 p-2 rounded-lg mr-3">
                <FontAwesome6 name="calendar-alt" size={20} color="white" />
              </View>
              <Text className="text-xl font-bold text-white">
                {language === 'zh' ? '课程计划' : 'Course Schedule'}
              </Text>
            </View>
            
            {/* Date Display */}
            <View className="bg-white/10 rounded-xl p-4 mb-3">
              <Text className="text-white/80 text-sm mb-1">
                {language === 'zh' ? '下一节课' : 'Next Lesson'}
              </Text>
              <Text className="text-white text-2xl font-bold">
                {dayName} {formattedDate}
              </Text>
              <Text className="text-white/90 text-lg mt-1">
                10:00 - 12:00
              </Text>
            </View>

            {/* Info Row */}
            <View className="flex-row justify-between">
              <View className="flex-row items-center">
                <FontAwesome6 name="user-tie" size={14} color="white" />
                <Text className="text-white/90 text-sm ml-2">
                  {language === 'zh' ? '教练' : 'Coach'}: Hany
                </Text>
              </View>
              <View className="flex-row items-center">
                <FontAwesome6 name="book" size={14} color="white" />
                <Text className="text-white/90 text-sm ml-2">
                  {language === 'zh' ? '学生' : 'Student'}: Book
                </Text>
              </View>
              <View className="bg-white/20 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-medium">
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
