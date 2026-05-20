import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/Screen';
import { statsApi, type Stats } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

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
        <View className="px-4 pt-2 pb-2">
          <Text className="text-2xl font-bold text-foreground">{t('nav.home') === '首页' ? '网球课程' : 'Tennis Course'}</Text>
          <Text className="text-sm text-muted mt-1">{t('dashboard.title')}</Text>
        </View>

        {/* Main Stats Card */}
        <View className="px-4 py-4">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">{t('dashboard.remainingLessons')}</Text>
              <View className="bg-accent/10 px-3 py-1 rounded-full">
                <Text className="text-accent font-medium text-sm">{remainingPercent}%</Text>
              </View>
            </View>
            
            <View className="flex-row items-end mb-4">
              <Text className="text-5xl font-bold text-accent">{stats?.remaining_lessons || 0}</Text>
              <Text className="text-lg text-muted ml-2 mb-2">/ {stats?.total_lessons || 0} {t('records.lessons')}</Text>
            </View>

            {/* Progress Bar */}
            <View className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <View 
                className="h-full bg-accent rounded-full"
                style={{ width: `${remainingPercent}%` }}
              />
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-4 pb-4">
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 pb-4">
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl items-center justify-center mb-3">
                  <FontAwesome6 name="book" size={20} color="#3B82F6" />
                </View>
                <Text className="text-2xl font-bold text-foreground">{stats?.total_courses || 0}</Text>
                <Text className="text-sm text-muted mt-1">{t('dashboard.totalCourses')}</Text>
              </View>
            </View>

            <View className="w-1/2 px-2 pb-4">
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <View className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl items-center justify-center mb-3">
                  <FontAwesome6 name="check" size={20} color="#22C55E" />
                </View>
                <Text className="text-2xl font-bold text-foreground">{stats?.used_lessons || 0}</Text>
                <Text className="text-sm text-muted mt-1">{t('dashboard.usedLessons')}</Text>
              </View>
            </View>

            <View className="w-1/2 px-2 pb-4">
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <View className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl items-center justify-center mb-3">
                  <FontAwesome6 name="user-tie" size={20} color="#A855F7" />
                </View>
                <Text className="text-2xl font-bold text-foreground">{stats?.total_teachers || 0}</Text>
                <Text className="text-sm text-muted mt-1">{t('nav.teachers')}</Text>
              </View>
            </View>

            <View className="w-1/2 px-2 pb-4">
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <View className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl items-center justify-center mb-3">
                  <FontAwesome6 name="clipboard-list" size={20} color="#F97316" />
                </View>
                <Text className="text-2xl font-bold text-foreground">{stats?.total_records || 0}</Text>
                <Text className="text-sm text-muted mt-1">{t('nav.records')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Course Packages List */}
        <View className="px-4 pb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">{t('dashboard.coursePackages')}</Text>
          
          {(!stats?.package_stats || stats.package_stats.length === 0) ? (
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 items-center">
              <Text className="text-muted">{t('dashboard.noData')}</Text>
              <Text className="text-sm text-muted mt-1">
                {language === 'zh' ? '去「课程」页添加新课程' : 'Go to "Courses" to add new courses'}
              </Text>
            </View>
          ) : (
            stats.package_stats.map((pkg) => {
              const pkgPercent = pkg.total_lessons > 0 
                ? Math.round((pkg.remaining_lessons / pkg.total_lessons) * 100) 
                : 0;
              return (
                <View key={pkg.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-medium text-foreground">{pkg.name}</Text>
                      {pkg.teachers && (
                        <Text className="text-sm text-muted mt-1">{pkg.teachers.name}</Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-accent">{pkg.remaining_lessons}</Text>
                      <Text className="text-xs text-muted">{t('dashboard.remainingLessons')}</Text>
                    </View>
                  </View>
                  
                  <View className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                    <View 
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${pkgPercent}%` }}
                    />
                  </View>
                  
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-muted">{pkg.used_lessons} {t('records.lessons')}</Text>
                    <Text className="text-xs text-muted">{pkg.total_lessons} {t('records.lessons')}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
