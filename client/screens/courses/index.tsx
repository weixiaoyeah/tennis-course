import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Screen } from '@/components/Screen';
import { coursesApi, teachersApi, type CoursePackage, type Teacher, type CoursePackageAdjustment } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

// 三语言帮助函数（阿拉伯语 RTL 文字）
function tr(zh: string, en: string, ar: string, language: string): string {
  if (language === 'ar') return ar;
  return language === 'zh' ? zh : en;
}

function formatNumber(value: number | string | undefined): number {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatDateTime(value?: string): string {
  if (!value) return '';
  // 显示 YYYY-MM-DD HH:mm
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (x: number) => x.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<CoursePackage[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 课时调整弹窗状态
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<CoursePackage | null>(null);
  const [adjustments, setAdjustments] = useState<CoursePackageAdjustment[]>([]);
  const [changeAmount, setChangeAmount] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);

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

  // 打开课时调整弹窗：加载调整历史
  const openAdjustModal = useCallback(async (item: CoursePackage) => {
    setAdjustTarget(item);
    setAdjustments([]);
    setChangeAmount('');
    setChangeReason('');
    setAdjustModalVisible(true);
    try {
      const data = await coursesApi.getAdjustments(item.id);
      setAdjustments(data);
    } catch (error) {
      console.error('Failed to fetch adjustments:', error);
    }
  }, []);

  const closeAdjustModal = useCallback(() => {
    setAdjustModalVisible(false);
    setAdjustTarget(null);
    setChangeAmount('');
    setChangeReason('');
  }, []);

  const handleSaveAdjustment = useCallback(async () => {
    if (!adjustTarget) return;
    const amount = Number(changeAmount.trim());
    if (!changeAmount.trim() || Number.isNaN(amount) || amount === 0) {
      alert(tr('请输入有效的课时变更数量（可正可负）', 'Enter a valid lesson change (positive or negative)', 'أدخل تغيير حصة صالح (موجب أو سالب)', language));
      return;
    }
    setAdjustSaving(true);
    try {
      /**
       * 服务端文件：server/src/routes/courses.ts
       * 接口：POST /api/v1/courses/:id/adjustments
       * Path 参数：id: number
       * Body 参数：change_amount: number, reason?: string
       */
      const result = await coursesApi.addAdjustment(adjustTarget.id, {
        change_amount: amount,
        reason: changeReason.trim() || undefined,
      });
      // 刷新弹窗内的调整历史
      const data = await coursesApi.getAdjustments(adjustTarget.id);
      setAdjustments(data);
      // 刷新课程列表（有效总课时变化）
      await fetchData();
      if (result.course_package) {
        setAdjustTarget(result.course_package);
      }
      setChangeAmount('');
      setChangeReason('');
    } catch (error) {
      console.error('Failed to save adjustment:', error);
      alert(tr('保存失败，请重试', 'Save failed, please retry', 'فشل الحفظ، حاول مرة أخرى', language));
    } finally {
      setAdjustSaving(false);
    }
  }, [adjustTarget, changeAmount, changeReason, fetchData, language]);

  const renderItem = ({ item }: { item: CoursePackage }) => {
    const baseLessons = formatNumber(item.total_lessons);
    const bonusLessons = formatNumber(item.bonus_lessons);
    const effectiveTotal = baseLessons + bonusLessons;
    return (
      <View className="bg-gradient-to-br from-sky-50 to-emerald-50 rounded-xl p-3.5 mb-2.5 shadow-sm border border-sky-100">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 flex-row items-center">
            <View className="bg-gradient-to-br from-sky-400 to-emerald-500 p-2 rounded-lg mr-2.5">
              <FontAwesome6 name="book" size={16} color="white" />
            </View>
            <Text className="text-base font-bold text-gray-800">{item.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => openAdjustModal(item)}
            className="bg-gradient-to-br from-sky-400 to-emerald-500 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-2xl font-black text-white">{effectiveTotal}</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap items-center mt-2.5 gap-2">
          <View className="bg-white/70 px-2.5 py-1 rounded-lg flex-row items-center">
            <FontAwesome6 name="user-tie" size={10} color="#1e88e5" />
            <Text className="text-xs text-sky-600 font-medium ml-1.5">{getTeacherName(item.teacher_id)}</Text>
          </View>
          {item.start_date && (
            <View className="bg-white/70 px-2.5 py-1 rounded-lg flex-row items-center max-w-full">
              <FontAwesome6 name="calendar-days" size={10} color="#1e88e5" />
              <Text className="text-xs text-sky-600 font-medium ml-1.5 flex-1">
                {tr('有效期', 'Valid', 'صالح', language)} {item.start_date} - 2027.4.1
              </Text>
            </View>
          )}
        </View>

        {bonusLessons > 0 && (
          <View className="flex-row items-center mt-2">
            <View className="bg-amber-100 px-2.5 py-1 rounded-lg flex-row items-center">
              <FontAwesome6 name="gift" size={10} color="#b45309" />
              <Text className="text-xs text-amber-700 font-medium ml-1.5">
                {tr('含赠送/调整', 'With bonus', 'مع هدية', language)} +{bonusLessons} {tr('课时', 'lessons', 'حصة', language)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => openAdjustModal(item)}
          className="mt-2.5 bg-white/60 border border-sky-200 rounded-lg py-2 flex-row items-center justify-center"
        >
          <FontAwesome6 name="arrows-rotate" size={12} color="#0284c7" />
          <Text className="text-xs text-sky-700 font-medium ml-2">
            {tr('课时调整', 'Adjust lessons', 'تعديل الحصص', language)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Screen>
      <View className="flex-1">
        {/* Header */}
        <View className="px-3 pt-2 pb-1.5">
          <View className="flex-row items-center">
            <View className="bg-gradient-to-br from-sky-400 to-emerald-500 p-2 rounded-xl mr-2.5">
              <FontAwesome6 name="book" size={18} color="white" />
            </View>
            <Text className="text-lg font-bold text-gray-800">{tr('课程包', 'Courses', 'الدورات', language)}</Text>
          </View>
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
              <View className="bg-sky-100 p-3 rounded-full mb-2.5">
                <FontAwesome6 name="folder-open" size={28} color="#1e88e5" />
              </View>
              <Text className="text-gray-600 font-medium text-sm">{tr('暂无课程包', 'No courses', 'لا توجد دورات', language)}</Text>
            </View>
          }
        />
      </View>

      {/* 课时调整弹窗 */}
      <Modal visible={adjustModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className="flex-1 justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
              <View className="bg-white rounded-2xl overflow-hidden max-h-[85%]">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-400 to-emerald-500">
                  <Text className="text-base font-bold text-white">
                    {adjustTarget?.name || tr('课时调整', 'Adjust lessons', 'تعديل الحصص', language)}
                  </Text>
                  <TouchableOpacity onPress={closeAdjustModal} className="p-1">
                    <FontAwesome6 name="xmark" size={18} color="white" />
                  </TouchableOpacity>
                </View>

                <ScrollView className="p-4">
                  {/* 当前总课时概览 */}
                  {adjustTarget && (
                    <View className="flex-row gap-2 mb-3">
                      <View className="flex-1 bg-sky-50 rounded-xl p-3 items-center border border-sky-100">
                        <Text className="text-xs text-sky-600">{tr('基础课时', 'Base', 'الأساس', language)}</Text>
                        <Text className="text-xl font-black text-sky-700">{formatNumber(adjustTarget.total_lessons)}</Text>
                      </View>
                      <View className="flex-1 bg-amber-50 rounded-xl p-3 items-center border border-amber-100">
                        <Text className="text-xs text-amber-600">{tr('赠送/调整', 'Bonus', 'هدية', language)}</Text>
                        <Text className="text-xl font-black text-amber-700">+{formatNumber(adjustTarget.bonus_lessons)}</Text>
                      </View>
                      <View className="flex-1 bg-emerald-50 rounded-xl p-3 items-center border border-emerald-100">
                        <Text className="text-xs text-emerald-600">{tr('总课时', 'Total', 'المجموع', language)}</Text>
                        <Text className="text-xl font-black text-emerald-700">
                          {formatNumber(adjustTarget.total_lessons) + formatNumber(adjustTarget.bonus_lessons)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 新增调整表单 */}
                  <View className="mb-3">
                    <Text className="text-sm font-bold text-gray-800 mb-2">
                      {tr('新增课时变更', 'New adjustment', 'تعديل جديد', language)}
                    </Text>
                    <TextInput
                      value={changeAmount}
                      onChangeText={setChangeAmount}
                      placeholder={tr('变更数量（如 1.5 或 -1）', 'Amount (e.g. 1.5 or -1)', 'الكمية (مثال 1.5 أو -1)', language)}
                      keyboardType="decimal-pad"
                      className="bg-gray-100 rounded-xl px-3.5 py-3 text-gray-800 mb-2"
                      placeholderTextColor="#9ca3af"
                    />
                    <TextInput
                      value={changeReason}
                      onChangeText={setChangeReason}
                      placeholder={tr('变更原因（如：老师赠送课时）', 'Reason (e.g. bonus from coach)', 'السبب (مثال: هدية من المدرب)', language)}
                      className="bg-gray-100 rounded-xl px-3.5 py-3 text-gray-800 mb-2"
                      placeholderTextColor="#9ca3af"
                    />
                    <TouchableOpacity
                      onPress={handleSaveAdjustment}
                      disabled={adjustSaving}
                      className="bg-gradient-to-r from-sky-400 to-emerald-500 rounded-xl py-3 items-center"
                    >
                      <Text className="text-white font-bold">
                        {adjustSaving ? tr('保存中...', 'Saving...', 'جاري الحفظ...', language) : tr('保存变更', 'Save change', 'حفظ التعديل', language)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 调整历史 */}
                  <Text className="text-sm font-bold text-gray-800 mb-2">
                    {tr('调整历史', 'History', 'السجل', language)} ({adjustments.length})
                  </Text>
                  {adjustments.length === 0 ? (
                    <View className="bg-gray-50 rounded-xl py-6 items-center border border-gray-100">
                      <Text className="text-gray-400 text-sm">{tr('暂无调整记录', 'No adjustments yet', 'لا توجد تعديلات', language)}</Text>
                    </View>
                  ) : (
                    adjustments.map((adj) => {
                      const amount = formatNumber(adj.change_amount);
                      return (
                        <View key={adj.id} className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100">
                          <View className="flex-row items-center justify-between">
                            <Text className={`text-lg font-black ${amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {amount >= 0 ? '+' : ''}{amount}
                            </Text>
                            <Text className="text-xs text-gray-400">{formatDateTime(adj.created_at)}</Text>
                          </View>
                          {adj.reason ? (
                            <Text className="text-sm text-gray-600 mt-1">{adj.reason}</Text>
                          ) : null}
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {/* Footer */}
                <View className="px-4 py-3 border-t border-gray-100">
                  <TouchableOpacity
                    onPress={closeAdjustModal}
                    className="bg-gray-100 rounded-xl py-3 items-center"
                  >
                    <Text className="text-gray-700 font-medium">{tr('关闭', 'Close', 'إغلاق', language)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}