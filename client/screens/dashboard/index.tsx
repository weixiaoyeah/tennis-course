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
    return `${month}月${day}日`;
  }
  return `${month}/${day}`;
}

// 获取星期几
function getDayName(language: 'zh' | 'en'): string {
  return language === 'zh' ? '周六' : 'Sat';
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
        <View className="px-3 pt-2 flex-row justify-end">
          <TouchableOpacity 
            onPress={toggleLanguage}
            className="bg-gradient-to-r from-orange-400 to-amber-400 px-3 py-1.5 rounded-full flex-row items-center shadow-sm"
          >
            <FontAwesome6 name="globe" size={12} color="white" />
            <Text className="text-white text-xs ml-1.5 font-semibold">
              {language === 'zh' ? 'EN' : '中'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View className="px-3 pb-3 flex-row items-center">
          <View className="bg-gradient-to-br from-orange-400 to-amber-400 p-2 rounded-xl mr-2.5">
            <FontAwesome6 name="table-cells" size={18} color="white" />
          </View>
          <View>
            <Text className="text-xl font-bold text-foreground">
              {language === 'zh' ? '网球课程' : 'Tennis'}
            </Text>
            <Text className="text-xs text-orange-500">
              {language === 'zh' ? '课时统计' : 'Statistics'}
            </Text>
          </View>
        </View>

        {/* Main Stats Card */}
        <View className="px-3 pb-3">
          <View className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 shadow-md border border-orange-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-semibold text-gray-700">
                {language === 'zh' ? '剩余课时' : 'Remaining'}
              </Text>
              <View className="bg-gradient-to-r from-orange-400 to-amber-400 px-2.5 py-0.5 rounded-full">
                <Text className="text-white font-bold text-xs">{remainingPercent}%</Text>
              </View>
            </View>
            
            <View className="flex-row items-end mb-3">
              <Text className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">{stats?.remaining_lessons || 0}</Text>
              <Text className="text-sm text-gray-500 ml-1.5 mb-1.5">
                / {stats?.total_lessons || 0}
              </Text>
            </View>

            {/* Progress Bar */}
            <View className="h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
              <View 
                className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"
                style={{ width: `${remainingPercent}%` }}
              />
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-between mt-4 pt-3 border-t border-orange-100">
              <View className="items-center flex-1">
                <View className="bg-green-100 p-1.5 rounded-lg mb-1">
                  <FontAwesome6 name="circle-check" size={16} color="#22c55e" />
                </View>
                <Text className="text-xl font-bold text-green-600">{stats?.used_lessons || 0}</Text>
                <Text className="text-xs text-gray-500">
                  {language === 'zh' ? '已上课时' : 'Used'}
                </Text>
              </View>
              <View className="w-8" />
              <View className="items-center flex-1">
                <View className="bg-blue-100 p-1.5 rounded-lg mb-1">
                  <FontAwesome6 name="calendar-check" size={16} color="#3b82f6" />
                </View>
                <Text className="text-xl font-bold text-blue-600">{stats?.total_records || 0}</Text>
                <Text className="text-xs text-gray-500">
                  {language === 'zh' ? '上课次数' : 'Sessions'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Course Schedule Card */}
        <View className="px-3 pb-4">
          <View className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-4 shadow-md">
            <View className="flex-row items-center mb-3">
              <View className="bg-white/25 p-2 rounded-lg mr-2.5">
                <FontAwesome6 name="calendar" size={18} color="white" />
              </View>
              <Text className="text-base font-bold text-white">
                {language === 'zh' ? '下次课程' : 'Next Lesson'}
              </Text>
            </View>
            
            {/* Date Display */}
            <View className="bg-white/15 rounded-xl p-3 mb-2.5">
              <Text className="text-white/70 text-xs mb-0.5">
                {language === 'zh' ? '上课时间' : 'Time'}
              </Text>
              <Text className="text-white text-lg font-bold">
                {dayName} {formattedDate} 10:00-12:00
              </Text>
            </View>

            {/* Info Row */}
            <View className="flex-row justify-between">
              <View className="flex-row items-center bg-white/15 px-2.5 py-1.5 rounded-lg flex-1 mr-2">
                <FontAwesome6 name="user-tie" size={12} color="white" />
                <Text className="text-white/90 text-xs ml-1.5">
                  {language === 'zh' ? '教练' : 'Coach'}: Hany
                </Text>
              </View>
              <View className="flex-row items-center bg-white/15 px-2.5 py-1.5 rounded-lg flex-1 ml-2">
                <FontAwesome6 name="book" size={12} color="white" />
                <Text className="text-white/90 text-xs ml-1.5">
                  {language === 'zh' ? '学生' : 'Student'}: Book
                </Text>
              </View>
            </View>
            <View className="flex-row justify-center mt-2.5">
              <View className="bg-yellow-400 px-2.5 py-1 rounded-full">
                <Text className="text-gray-900 text-xs font-bold">2 {language === 'zh' ? '课时' : 'lessons'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
