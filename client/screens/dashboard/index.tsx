import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal, Alert, Platform, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { statsApi, lessonsApi, type Stats, type CourseSchedule } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from '@/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// 三语言帮助函数（阿拉伯语 RTL 文字）
function tr(zh: string, en: string, ar: string, language: string): string {
  if (language === 'ar') return ar;
  return language === 'zh' ? zh : en;
}

// 跨平台、跨协议（HTTP/HTTPS）可靠的复制函数
// 说明：expo-clipboard 在 web 端依赖 navigator.clipboard，而浏览器仅在 HTTPS 或 localhost
// 下才允许该 API；HTTP 页面会失效。这里做三层降级：
//   1) 原生端(non-web)：直接走 expo-clipboard
//   2) web + navigator.clipboard 可用：用 Clipboard API（需 HTTPS）
//   3) web + 无 Volume API：回退到 textarea + document.execCommand('copy')（HTTP 下也能用）
async function copyToClipboard(text: string): Promise<boolean> {
  if (Platform.OS !== 'web') {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch {
      return false;
    }
  }
  // ---- web ----
  const win = typeof window !== 'undefined' ? (window as any) : undefined;
  try {
    if (win?.navigator?.clipboard && typeof win.navigator.clipboard.writeText === 'function') {
      await win.navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 继续降级
  }
  // 降级：execCommand('copy')
  try {
    const doc = typeof document !== 'undefined' ? (document as any) : undefined;
    if (!doc) return false;
    const textarea = doc.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.setAttribute('readonly', '');
    doc.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = doc.execCommand('copy');
    doc.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

// 格式化课程日期
function formatScheduleDate(dateStr: string, language: 'zh' | 'en' | 'ar'): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (language === 'zh') {
    return `${month}月${day}日`;
  }
  return `${month}/${day}`;
}

// 获取星期几（根据日期动态计算）
function getDayName(dateStr: string, language: 'zh' | 'en' | 'ar'): string {
  const date = new Date(dateStr);
  const zhWeekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const enWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const arWeekdays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const day = date.getDay();
  if (language === 'zh') return zhWeekdays[day];
  if (language === 'ar') return arWeekdays[day];
  return enWeekdays[day];
}

// 获取确认类型
function getConfirmTypeLabel(type: 'coach' | 'student', language: 'zh' | 'en' | 'ar'): string {
  if (language === 'zh') {
    return type === 'coach' ? '教练确认' : '学生确认';
  }
  if (language === 'ar') {
    return type === 'coach' ? 'تأكيد المدرب' : 'تأكيد الطالب';
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
  const [updateLogVisible, setUpdateLogVisible] = useState(false);
  const [updateLogText, setUpdateLogText] = useState('');
  const [remark, setRemark] = useState('');
  const [copyDone, setCopyDone] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<CourseSchedule | null>(null);
  const { language } = useTranslation();

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
          tr('无可确认课程', 'No Schedule', 'لا يوجد درس', language),
          tr('当前没有待确认的课程计划', 'No pending course schedule', 'لا توجد دورة قيد التأكيد', language)
        );
        setSubmitting(false);
        return;
      }
      
      const confirmRole = confirmType === 'coach' 
        ? (language === 'zh' ? '教练' : language === 'ar' ? 'المدرب' : 'Coach')
        : (language === 'zh' ? '学生' : language === 'ar' ? 'الطالب' : 'Student');
      
      // 调用确认API
      const result: any = await lessonsApi.confirmSchedule({
        schedule_id: selectedSchedule.id,
        confirmed_by: confirmType,
        is_attended: isCompleted,
        duration: duration,
        remark: remark
      });
      
      // 关闭弹窗并刷新数据
      setSecondConfirmVisible(false);
      setConfirmModalVisible(false);
      setIsCompleted(true);
      setRemark('');
      setDuration(2);
      fetchStats();

      // 展示可转发的更新日志
      if (result?.update_log) {
        setUpdateLogText(result.update_log);
        setUpdateLogVisible(true);
        return;
      }
      
      Alert.alert(
        tr('确认成功', 'Confirmed', 'تم التأكيد', language),
        language === 'zh' 
          ? isCompleted 
            ? `${confirmRole}确认成功，已上课${duration}课时，课时已扣除`
            : `${confirmRole}确认成功，已记录为未上课`
          : language === 'ar'
            ? isCompleted
              ? `${confirmRole} تم تسجيل ${duration} درس وخصمها`
              : `${confirmRole} تم تسجيل الحصة كغائب`
            : isCompleted
              ? `${confirmRole} confirmed: ${duration} lesson(s) recorded and deducted`
              : `${confirmRole} confirmed: Recorded as absent`
      );
    } catch (error) {
      console.error('Failed to confirm lesson:', error);
      Alert.alert(
        tr('确认失败', 'Error', 'فشل التأكيد', language),
        tr('请重试', 'Please try again', 'حاول مرة أخرى', language)
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
          <Text className="text-muted">{tr('加载中...', 'Loading...', 'جار التحميل...', language)}</Text>
        </View>
      </Screen>
    );
  }

  const remainingPercent = stats && stats.total_lessons > 0 
    ? Math.round((stats.remaining_lessons / stats.total_lessons) * 100) 
    : 0;

  const upcomingSchedules = stats?.upcoming_schedules || [];

  // 拆分：未来7天（今日含）优先，过期未确认课程在后（后端已按此排序）
  const _today = new Date().toISOString().slice(0, 10);
  const futureSchedules = upcomingSchedules.filter(s => s.schedule_date >= _today);
  const overdueSchedules = upcomingSchedules.filter(s => s.schedule_date < _today);

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
          <LanguageSwitcher />
        </View>

        {/* Header */}
        <View className="px-3 pb-3 flex-row items-center">
          <View className="bg-gradient-to-br from-orange-400 to-amber-400 p-2 rounded-xl mr-2.5">
            <FontAwesome6 name="volleyball" size={18} color="white" />
          </View>
          <View>
            <Text className="text-xl font-bold text-foreground">
              {tr('网球课程', 'Tennis', 'التنس', language)}
            </Text>
            <Text className="text-xs text-muted">
              {tr('快乐挥拍每一天', 'Play & Enjoy', 'العب واستمتع', language)}
            </Text>
          </View>
        </View>

        {/* Main Stats Card */}
        <View className="px-3 pb-3">
          <View className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 shadow-md border border-orange-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-semibold text-gray-700">
                {tr('剩余课时', 'Remaining', 'المتبقي', language)}
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
                  {tr('已上课时', 'Used', 'المستخدمة', language)}
                </Text>
              </View>
              <View className="w-8" />
              <View className="items-center flex-1">
                <View className="bg-blue-100 p-1.5 rounded-lg mb-1">
                  <FontAwesome6 name="calendar-check" size={16} color="#3b82f6" />
                </View>
                <Text className="text-xl font-bold text-blue-600">{stats?.total_records || 0}</Text>
                <Text className="text-xs text-gray-500">
                  {tr('上课次数', 'Sessions', 'الجلسات', language)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Course Schedule Card */}
        <View className="px-3 pb-4">
          <View className="bg-gradient-to-br from-sky-400 via-blue-500 to-emerald-500 rounded-2xl p-4 shadow-md">
            <View className="flex-row items-center mb-3">
              <View className="bg-white/25 p-2 rounded-lg mr-2.5">
                <FontAwesome6 name="calendar" size={18} color="white" />
              </View>
              <Text className="text-base font-bold text-white">
                {tr('下周课程', 'Upcoming Lessons', 'الدروس القادمة', language)}
              </Text>
            </View>

            {/* 未来一周课程（优先展示，含已确认/缺席只读展示） */}
            {futureSchedules.length > 0 ? (
              futureSchedules.map((schedule) => (
                <View key={schedule.id}>
                  {/* Schedule Item */}
                  <View className="bg-white/15 rounded-xl p-3 mb-2">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-white text-base font-bold">
                        {getDayName(schedule.schedule_date, language)} {formatScheduleDate(schedule.schedule_date, language)} {schedule.schedule_time}
                      </Text>
                      <Text className="text-emerald-300 text-sm font-bold">
                        ({schedule.duration}{tr('课时', 'lessons', 'دروس', language)})
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <View className="flex-row items-center bg-white/15 px-2.5 py-1.5 rounded-lg flex-1 mr-2">
                        <FontAwesome6 name="user-tie" size={12} color="white" />
                        <Text className="text-white/90 text-xs ml-1.5">
                          {tr('教练', 'Coach', 'المدرب', language)}: {schedule.teacher?.name || 'Hany'}
                        </Text>
                      </View>
                      <View className="flex-row items-center bg-white/15 px-2.5 py-1.5 rounded-lg flex-1 ml-2">
                        <FontAwesome6 name="book" size={12} color="white" />
                        <Text className="text-white/90 text-xs ml-1.5">
                          {tr('学生', 'Student', 'الطالب', language)}: Book
                        </Text>
                      </View>
                    </View>

                    {/* 状态标注 */}
                    {schedule.status === 'confirmed' && (
                      <View className="flex-row items-center bg-green-500/30 px-2.5 py-1.5 rounded-lg mt-2">
                        <FontAwesome6 name="circle-check" size={13} color="#86efac" />
                        <Text className="text-green-200 text-xs font-bold ml-1.5">
                          {tr('已确认', 'Confirmed', 'تم التأكيد', language)}
                        </Text>
                      </View>
                    )}
                    {schedule.status === 'absent' && (
                      <View className="flex-row items-center bg-red-400/30 px-2.5 py-1.5 rounded-lg mt-2">
                        <FontAwesome6 name="calendar-xmark" size={13} color="#fca5a5" />
                        <Text className="text-red-200 text-xs font-bold ml-1.5">
                          {tr('已缺席', 'Absent', 'غائب', language)}
                        </Text>
                      </View>
                    )}
                    {schedule.status === 'pending' && (
                      <TouchableOpacity
                        onPress={() => openConfirmModal(schedule)}
                        className="bg-white/25 py-2.5 rounded-xl items-center mt-2"
                        activeOpacity={0.8}
                      >
                        <Text className="text-white font-bold text-sm">
                          {language === 'zh' ? `确认 ${getDayName(schedule.schedule_date, language)} 课程` : language === 'ar' ? `تأكيد درس ${getDayName(schedule.schedule_date, language)}` : `Confirm ${getDayName(schedule.schedule_date, language)} Lesson`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-white/80 text-sm text-center py-2">
                {tr('暂无未来7天课程计划', 'No upcoming schedules in 7 days', 'لا توجد دروس قادمة في 7 أيام', language)}
              </Text>
            )}

            {/* 过期未确认课程（补确认区域） */}
            {overdueSchedules.length > 0 && (
              <View className="mt-3">
                <View className="flex-row items-center mt-3 mb-2">
                  <View className="bg-amber-400 p-2 rounded-lg mr-2.5">
                    <FontAwesome6 name="triangle-exclamation" size={16} color="white" />
                  </View>
                  <Text className="text-white text-base font-bold">
                    {tr('待补确认课程', 'Overdue to Confirm', 'دروس متأخرة للتأكيد', language)}
                  </Text>
                </View>
                <View className="h-px bg-white/30 my-2" />
                {overdueSchedules.map((schedule) => (
                  <View key={schedule.id} className="mb-2">
                    <View className="bg-amber-400/30 border border-amber-300/50 rounded-xl p-3">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-white text-base font-bold">
                          {getDayName(schedule.schedule_date, language)} {formatScheduleDate(schedule.schedule_date, language)} {schedule.schedule_time}
                        </Text>
                        <Text className="text-amber-300 text-sm font-bold">
                          ({schedule.duration}{tr('课时', 'lessons', 'دروس', language)})
                        </Text>
                      </View>

                      <View className="flex-row justify-between mb-2">
                        <View className="flex-row items-center bg-white/15 px-2.5 py-1.5 rounded-lg flex-1 mr-2">
                          <FontAwesome6 name="user-tie" size={12} color="white" />
                          <Text className="text-white/90 text-xs ml-1.5">
                            {tr('教练', 'Coach', 'المدرب', language)}: {schedule.teacher?.name || 'Hany'}
                          </Text>
                        </View>
                        <View className="flex-row items-center bg-white/15 px-2.5 py-1.5 rounded-lg flex-1 ml-2">
                          <FontAwesome6 name="book" size={12} color="white" />
                          <Text className="text-white/90 text-xs ml-1.5">
                            {tr('学生', 'Student', 'الطالب', language)}: Book
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => openConfirmModal(schedule)}
                        className="bg-white/25 py-2.5 rounded-xl items-center"
                        activeOpacity={0.8}
                      >
                        <Text className="text-white font-bold text-sm">
                          {language === 'zh' ? `补确认 ${getDayName(schedule.schedule_date, language)} 课程` : language === 'ar' ? `تأكيد درس ${getDayName(schedule.schedule_date, language)}` : `Confirm ${getDayName(schedule.schedule_date, language)} Lesson`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
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
                {tr('课程确认', 'Lesson Confirmation', 'تأكيد الدرس', language)}
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
                  : tr('暂无课程计划', 'No Schedule', 'لا يوجد جدول', language)
                }
              </Text>
              <Text className="text-xs text-gray-400">
                {tr('教练', 'Coach', 'المدرب', language)}: {selectedSchedule?.teacher?.name || 'Hany'} | {tr('学生', 'Student', 'الطالب', language)}: Book
              </Text>
            </View>

            {/* Completed Status */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                {tr('是否已上课', 'Attendance', 'الحضور', language)}
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
                    {tr('已上课', 'Attended', 'حضر', language)}
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
                    {tr('未上课', 'Absent', 'غائب', language)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Duration */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                {tr('上课课时', 'Duration', 'عدد الدروس', language)}
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
                    2 {tr('课时', 'lessons', 'دروس', language)}
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
                    1 {tr('课时', 'lesson', 'درس', language)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 备注输入框 */}
            <View className="mb-5">
              <TextInput
                value={remark}
                onChangeText={setRemark}
                placeholder={tr('添加备注，如请假原因、改期安排…（可选）', 'Add a note (e.g. reason, reschedule)… (optional)', 'أضف ملاحظة (مثال: السبب، إعادة الجدولة)… (اختياري)', language)}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 text-left"
                style={{ minHeight: 72, textAlignVertical: 'top' }}
              />
            </View>

            {/* Confirm Buttons */}
            <View className="flex-row">
              <TouchableOpacity 
                onPress={() => {
                  setPendingConfirmRole('coach');
                  setSecondConfirmVisible(true);
                }}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl items-center mr-1.5 bg-gradient-to-r from-sky-500 to-blue-600"
              >
                <Text className="text-white font-bold text-sm">
                  {tr('教练确认', 'Coach', 'تأكيد المدرب', language)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setPendingConfirmRole('student');
                  setSecondConfirmVisible(true);
                }}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl items-center ml-1.5 bg-gradient-to-r from-emerald-400 to-green-600"
              >
                <Text className="text-white font-bold text-sm">
                  {tr('学生确认', 'Student', 'تأكيد الطالب', language)}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={() => setConfirmModalVisible(false)}
              className="mt-3 py-2.5 rounded-xl items-center bg-gray-100"
            >
              <Text className="text-gray-500 text-sm">
                {tr('取消', 'Cancel', 'إلغاء', language)}
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
                {tr('确认上课记录', 'Confirm Attendance', 'تأكيد سجل الدرس', language)}
              </Text>
            </View>

            {/* Confirm Info */}
            <View className="bg-amber-50 rounded-xl p-4 mb-4">
              <Text className="text-sm text-gray-700 text-center leading-relaxed">
                {language === 'zh' 
                  ? `确认后，将记录本次上课 ${isCompleted ? duration : 0} 课时，课时将从课程包中扣除。是否确认？`
                  : language === 'ar'
                    ? `بعد التأكيد، سيتم تسجيل ${isCompleted ? duration : 0} درس، وسيتم خصمها من الباقة. هل أنت متأكد؟`
                    : `After confirmation, this will record ${isCompleted ? duration : 0} lesson(s) and deduct from your package. Continue?`
                }
              </Text>
            </View>

            {/* Role Badge */}
            <View className="items-center mb-5">
              <View className={`px-4 py-1.5 rounded-full ${
                pendingConfirmRole === 'coach' 
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600' 
                  : 'bg-gradient-to-r from-emerald-400 to-green-600'
              }`}>
                <Text className="text-white font-semibold text-sm">
                  {pendingConfirmRole === 'coach' 
                    ? (language === 'zh' ? '教练确认' : language === 'ar' ? 'تأكيد المدرب' : 'Coach Confirm')
                    : (language === 'zh' ? '学生确认' : language === 'ar' ? 'تأكيد الطالب' : 'Student Confirm')
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
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600' 
                  : 'bg-gradient-to-r from-emerald-400 to-green-600'
              }`}
            >
              <Text className="text-white font-bold text-sm">
                {tr('确认', 'Confirm', 'تأكيد', language)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setSecondConfirmVisible(false)}
              className="py-2.5 rounded-xl items-center bg-gray-100"
            >
              <Text className="text-gray-500 text-sm">
                {tr('取消', 'Cancel', 'إلغاء', language)}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 更新日志弹窗：确认后展示可转发的文本 */}
      <Modal
        visible={updateLogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpdateLogVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl p-5 w-full max-w-sm">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="bg-emerald-100 p-2 rounded-full mr-2">
                  <FontAwesome6 name="share-nodes" size={16} color="#059669" />
                </View>
                <Text className="text-base font-bold text-gray-900">
                  {tr('更新日志', 'Update Log', 'سجل التحديث', language)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setUpdateLogVisible(false)}>
                <FontAwesome6 name="xmark" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* 提示 */}
            <Text className="text-xs text-gray-500 mb-2">
              {tr('已生成更新日志，点击按钮复制后转发到群即可：', 'Shareable update generated, copy and forward to your group:', 'تم إنشاء سجل التحديث، انسخه وانشره في المجموعة:', language)}
            </Text>

            {/* 日志文本 */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4 max-h-56">
              <ScrollView>
                <Text className="text-sm text-gray-800 leading-relaxed">
                  {updateLogText}
                </Text>
              </ScrollView>
            </View>

            {/* 复制按钮 */}
            <TouchableOpacity
              onPress={async () => {
                try {
                  const ok = await copyToClipboard(updateLogText);
                  if (ok) {
                    setCopyDone(true);
                    setTimeout(() => setCopyDone(false), 2000);
                    Alert.alert(
                      tr('已复制', 'Copied', 'تم النسخ', language),
                      tr('日志已复制到剪贴板，可前往微信群粘贴发送。', 'Log copied to clipboard, paste it in your WeChat group.', 'تم نسخ السجل، يمكنك لصقه في مجموعة WeChat.', language)
                    );
                  } else {
                    Alert.alert(
                      tr('复制失败', 'Copy failed', 'فشل النسخ', language),
                      tr('当前浏览器不允许复制，请长按文字手动复制。', 'Your browser blocks auto-copy. Press and hold the text to copy manually.', 'لا يسمح المتصفح بالنسخ التلقائي، اضغط مطولاً على النص للنسخ.', language)
                    );
                  }
                } catch (error) {
                  Alert.alert(tr('复制失败', 'Copy failed', 'فشل النسخ', language), String(error));
                }
              }}
              className={`py-3 rounded-xl items-center mb-2 ${copyDone ? 'bg-gradient-to-r from-green-700 to-green-800' : 'bg-gradient-to-r from-emerald-500 to-green-600'}`}
            >
              <View className="flex-row items-center">
                <FontAwesome6 name={copyDone ? 'check' : 'copy'} size={14} color="white" />
                <Text className="text-white font-bold text-sm ml-2">
                  {copyDone
                    ? tr('已复制 ✓', 'Copied ✓', 'تم النسخ ✓', language)
                    : tr('复制并转发到群', 'Copy & Forward to Group', 'انسخ وانشر إلى المجموعة', language)}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setUpdateLogVisible(false)}
              className="py-2.5 rounded-xl items-center bg-gray-100"
            >
              <Text className="text-gray-500 text-sm">
                {tr('关闭', 'Close', 'إغلاق', language)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
