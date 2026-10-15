import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { Screen } from '@/components/Screen';
import { statsApi, lessonsApi, type Stats, type CourseSchedule } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

// 格式化课程日期
function formatScheduleDate(dateStr: string, language: 'zh' | 'en'): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (language === 'zh') {
    return `${month}月${day}日`;
  }
  return `${month}/${day}`;
}

// 获取星期几（根据日期动态计算）
function getDayName(dateStr: string, language: 'zh' | 'en'): string {
  const date = new Date(dateStr);
  const zhWeekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const enWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = date.getDay();
  return language === 'zh' ? zhWeekdays[day] : enWeekdays[day];
}

// 获取确认类型
function getConfirmTypeLabel(type: 'coach' | 'student', language: 'zh' | 'en'): string {
  if (language === 'zh') {
    return type === 'coach' ? '教练确认' : '学生确认';
  }
  return type === 'coach' ? 'Coach Confirm' : 'Student Confirm';
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [isCompleted, setIsCompleted] = useState(true); // 默认已上课
  const [duration, setDuration] = useState(2); // 默认2课时
  const [submitting, setSubmitting] = useState(false);
  const [pendingConfirmRole, setPendingConfirmRole] = useState<'coach' | 'student' | null>(null);
  const [secondConfirmVisible, setSecondConfirmVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<CourseSchedule | null>(null);
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

  const handleConfirmLesson = async (confirmType: 'coach' | 'student') => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      // 如果没有选中的课程计划，提示用户
      if (!selectedSchedule) {
        Alert.alert(
          language === 'zh' ? '无可确认课程' : 'No Schedule',
          language === 'zh' ? '当前没有待确认的课程计划' : 'No pending course schedule'
        );
        setSubmitting(false);
        return;
      }
      
      const confirmRole = confirmType === 'coach' 
        ? (language === 'zh' ? '教练' : 'Coach')
        : (language === 'zh' ? '学生' : 'Student');
      
      // 调用确认API
      await lessonsApi.confirmSchedule({
        schedule_id: selectedSchedule.id,
        confirmed_by: confirmType,
        is_attended: isCompleted,
        duration: duration
      });
      
      // 关闭弹窗并刷新数据
      setSecondConfirmVisible(false);
      setConfirmModalVisible(false);
      setIsCompleted(true);
      setDuration(2);
      fetchStats();
      
      Alert.alert(
        language === 'zh' ? '确认成功' : 'Confirmed',
        language === 'zh' 
          ? isCompleted 
            ? `${confirmRole}确认成功，已上课${duration}课时，课时已扣除`
            : `${confirmRole}确认成功，已记录为未上课`
          : isCompleted
            ? `${confirmRole} confirmed: ${duration} lesson(s) recorded and deducted`
            : `${confirmRole} confirmed: Recorded as absent`
      );
    } catch (error) {
      console.error('Failed to confirm lesson:', error);
      Alert.alert(
        language === 'zh' ? '确认失败' : 'Error',
        language === 'zh' ? '请重试' : 'Please try again'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirmModal = (schedule: CourseSchedule) => {
    setIsCompleted(true);
    setDuration(2);
    setSelectedSchedule(schedule);
    setConfirmModalVisible(true);
  };

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

  const upcomingSchedules = stats?.upcoming_schedules || [];

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
                {language === 'zh' ? '下周课程' : 'Upcoming Lessons'}
              </Text>
            </View>
            
            {/* Upcoming schedules list */}
            {upcomingSchedules.length > 0 ? (
              upcomingSchedules.map((schedule, index) => (
                <View key={schedule.id}>
                  {/* Schedule Item */}
                  <View className="bg-white/15 rounded-xl p-3 mb-2">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-white text-base font-bold">
                        {getDayName(schedule.schedule_date, language)} {formatScheduleDate(schedule.schedule_date, language)} {schedule.schedule_time}
                      </Text>
                      <Text className="text-yellow-400 text-sm font-bold">
                        ({schedule.duration}{language === 'zh' ? '课时' : 'lessons'})
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <View className="flex-row items-center bg-white/15 px-2.5 py-1.5 rounded-lg flex-1 mr-2">
                        <FontAwesome6 name="user-tie" size={12} color="white" />
                        <Text className="text-white/90 text-xs ml-1.5">
                          {language === 'zh' ? '教练' : 'Coach'}: {schedule.teacher?.name || 'Hany'}
                        </Text>
                      </View>
                      <View className="flex-row items-center bg-white/15 px-2.5 py-1.5 rounded-lg flex-1 ml-2">
                        <FontAwesome6 name="book" size={12} color="white" />
                        <Text className="text-white/90 text-xs ml-1.5">
                          {language === 'zh' ? '学生' : 'Student'}: Book
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Confirm Button (only on last item, or per item) */}
                  <TouchableOpacity 
                    onPress={() => openConfirmModal(schedule)}
                    className="bg-white/25 py-2.5 rounded-xl items-center mb-2.5"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-bold text-sm">
                      {language === 'zh' ? `确认 ${getDayName(schedule.schedule_date, language)} 课程` : `Confirm ${getDayName(schedule.schedule_date, language)} Lesson`}
                    </Text>
                  </TouchableOpacity>
                  {index < upcomingSchedules.length - 1 && (
                    <View className="h-px bg-white/20 my-2" />
                  )}
                </View>
              ))
            ) : (
              <Text className="text-white/80 text-sm text-center py-2">
                {language === 'zh' ? '暂无即将开始的课程计划' : 'No upcoming schedules'}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Confirm Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setConfirmModalVisible(false)}
        >
          <TouchableOpacity 
            className="bg-white rounded-2xl p-5 w-full max-w-sm"
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">
                {language === 'zh' ? '课程确认' : 'Lesson Confirmation'}
              </Text>
              <TouchableOpacity 
                onPress={() => setConfirmModalVisible(false)}
                className="p-1"
              >
                <FontAwesome6 name="xmark" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Course Info */}
            <View className="bg-gray-50 rounded-xl p-3 mb-4">
              <Text className="text-sm text-gray-600 mb-1">
                {selectedSchedule 
                  ? `${getDayName(selectedSchedule.schedule_date, language)} ${formatScheduleDate(selectedSchedule.schedule_date, language)} ${selectedSchedule.schedule_time}`
                  : (language === 'zh' ? '暂无课程计划' : 'No Schedule')
                }
              </Text>
              <Text className="text-xs text-gray-400">
                {language === 'zh' ? '教练' : 'Coach'}: {selectedSchedule?.teacher?.name || 'Hany'} | {language === 'zh' ? '学生' : 'Student'}: Book
              </Text>
            </View>

            {/* Completed Status */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                {language === 'zh' ? '是否已上课' : 'Attendance'}
              </Text>
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={() => setIsCompleted(true)}
                  className={`flex-1 py-2.5 rounded-xl items-center mr-2 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-sm' 
                      : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    isCompleted ? 'text-white' : 'text-gray-500'
                  }`}>
                    {language === 'zh' ? '已上课' : 'Attended'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setIsCompleted(false)}
                  className={`flex-1 py-2.5 rounded-xl items-center ml-2 ${
                    !isCompleted 
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 shadow-sm' 
                      : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    !isCompleted ? 'text-white' : 'text-gray-500'
                  }`}>
                    {language === 'zh' ? '未上课' : 'Absent'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Duration */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                {language === 'zh' ? '上课课时' : 'Duration'}
              </Text>
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={() => setDuration(2)}
                  className={`flex-1 py-2.5 rounded-xl items-center mr-2 ${
                    duration === 2 
                      ? 'bg-gradient-to-r from-orange-400 to-amber-500 shadow-sm' 
                      : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    duration === 2 ? 'text-white' : 'text-gray-500'
                  }`}>
                    2 {language === 'zh' ? '课时' : 'lessons'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setDuration(1)}
                  className={`flex-1 py-2.5 rounded-xl items-center ml-2 ${
                    duration === 1 
                      ? 'bg-gradient-to-r from-orange-400 to-amber-500 shadow-sm' 
                      : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    duration === 1 ? 'text-white' : 'text-gray-500'
                  }`}>
                    1 {language === 'zh' ? '课时' : 'lesson'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Buttons */}
            <View className="flex-row">
              <TouchableOpacity 
                onPress={() => {
                  setPendingConfirmRole('coach');
                  setSecondConfirmVisible(true);
                }}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl items-center mr-1.5 bg-gradient-to-r from-violet-500 to-purple-500"
              >
                <Text className="text-white font-bold text-sm">
                  {language === 'zh' ? '教练确认' : 'Coach'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setPendingConfirmRole('student');
                  setSecondConfirmVisible(true);
                }}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl items-center ml-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"
              >
                <Text className="text-white font-bold text-sm">
                  {language === 'zh' ? '学生确认' : 'Student'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={() => setConfirmModalVisible(false)}
              className="mt-3 py-2.5 rounded-xl items-center bg-gray-100"
            >
              <Text className="text-gray-500 text-sm">
                {language === 'zh' ? '取消' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Second Confirm Modal */}
      <Modal
        visible={secondConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSecondConfirmVisible(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setSecondConfirmVisible(false)}
        >
          <TouchableOpacity 
            className="bg-white rounded-2xl p-5 w-full max-w-sm"
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <View className="items-center mb-4">
              <View className="bg-amber-100 p-3 rounded-full mb-2">
                <FontAwesome6 name="circle-exclamation" size={28} color="#f59e0b" />
              </View>
              <Text className="text-lg font-bold text-gray-900">
                {language === 'zh' ? '确认上课记录' : 'Confirm Attendance'}
              </Text>
            </View>

            {/* Confirm Info */}
            <View className="bg-amber-50 rounded-xl p-4 mb-4">
              <Text className="text-sm text-gray-700 text-center leading-relaxed">
                {language === 'zh' 
                  ? `确认后，将记录本次上课 ${isCompleted ? duration : 0} 课时，课时将从课程包中扣除。是否确认？`
                  : `After confirmation, this will record ${isCompleted ? duration : 0} lesson(s) and deduct from your package. Continue?`
                }
              </Text>
            </View>

            {/* Role Badge */}
            <View className="items-center mb-5">
              <View className={`px-4 py-1.5 rounded-full ${
                pendingConfirmRole === 'coach' 
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}>
                <Text className="text-white font-semibold text-sm">
                  {pendingConfirmRole === 'coach' 
                    ? (language === 'zh' ? '教练确认' : 'Coach Confirm')
                    : (language === 'zh' ? '学生确认' : 'Student Confirm')
                  }
                </Text>
              </View>
            </View>

            {/* Confirm Buttons */}
            <TouchableOpacity 
              onPress={async () => {
                setSecondConfirmVisible(false);
                if (pendingConfirmRole) {
                  await handleConfirmLesson(pendingConfirmRole);
                }
              }}
              disabled={submitting}
              className={`py-3 rounded-xl items-center mb-2 ${
                pendingConfirmRole === 'coach' 
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}
            >
              <Text className="text-white font-bold text-sm">
                {language === 'zh' ? '确认' : 'Confirm'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setSecondConfirmVisible(false)}
              className="py-2.5 rounded-xl items-center bg-gray-100"
            >
              <Text className="text-gray-500 text-sm">
                {language === 'zh' ? '取消' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
