import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { calendarApi, type CalendarTask } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';
import { SmartDateInput } from '@/components/SmartDateInput';

// 三语言帮助函数
function tr(zh: string, en: string, ar: string, language: string): string {
  if (language === 'ar') return ar;
  return language === 'zh' ? zh : en;
}

// 日期工具
function parseDate(s?: string | null): Date {
  if (!s) return new Date();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date();
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, n: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=周日
  const diff = day === 0 ? -6 : 1 - day; // 周一开始
  return addDays(d, diff);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const COLORS = ['#4F46E5', '#EA580C', '#059669', '#F43F5E', '#0EA5E9', '#7C3AED', '#B45309'];

export default function CalendarScreen() {
  const { t, language } = useTranslation();
  type ViewMode = 'day' | 'week' | 'month';
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [anchor, setAnchor] = useState<Date>(new Date()); // 当前锚点日期
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 表单 Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<CalendarTask | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    task_type: 'once' as 'once' | 'repeat',
    repeat_type: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    task_date: '',
    start_date: '',
    end_date: '',
    color: COLORS[0],
  });
  const [saving, setSaving] = useState(false);

  // 根据视图计算日期范围
  const range = useMemo(() => {
    if (viewMode === 'day') {
      const d = anchor;
      return { from: fmt(d), to: fmt(d), start: d, end: d };
    }
    if (viewMode === 'week') {
      const s = startOfWeek(anchor);
      const e = addDays(s, 6);
      return { from: fmt(s), to: fmt(e), start: s, end: e };
    }
    const s = startOfMonth(anchor);
    const e = endOfMonth(anchor);
    return { from: fmt(s), to: fmt(e), start: s, end: e };
  }, [viewMode, anchor]);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await calendarApi.getRange(range.from, range.to);
      setTasks(data || []);
    } catch (error) {
      console.error('Failed to fetch calendar tasks:', error);
      Toast.show({ type: 'error', text1: t('messages.error') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range.from, range.to, t]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, [fetchTasks]);

  // 分组：周/月视图按日期分组，日视图单组
  const grouped = useMemo(() => {
    if (viewMode === 'day') return [{ date: anchor, list: tasks }];
    const map = new Map<string, { date: Date; list: CalendarTask[] }>();
    for (let d = new Date(range.start); d <= range.end; d = addDays(d, 1)) {
      map.set(fmt(d), { date: new Date(d), list: [] });
    }
    tasks.forEach((task) => {
      const key = task.occur_date || task.task_date || '';
      const g = map.get(key);
      if (g) g.list.push(task);
    });
    return Array.from(map.values());
  }, [tasks, viewMode, range]);

  // ================= 表单逻辑 =================
  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      task_type: 'once',
      repeat_type: 'none',
      task_date: fmt(anchor),
      start_date: fmt(anchor),
      end_date: '',
      color: COLORS[0],
    });
    setModalVisible(true);
  };

  const openEdit = (task: CalendarTask) => {
    setEditing(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      task_type: task.task_type || 'once',
      repeat_type: task.repeat_type || 'none',
      task_date: task.task_date || fmt(anchor),
      start_date: task.start_date || '',
      end_date: task.end_date || '',
      color: task.color || COLORS[0],
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Toast.show({ type: 'error', text1: t('validation.required') });
      return;
    }
    if (form.task_type === 'once' && !form.task_date) {
      Toast.show({ type: 'error', text1: tr('请选择日期', 'Please select a date', 'الرجاء اختيار التاريخ', language) });
      return;
    }
    if (form.task_type === 'repeat' && !form.start_date) {
      Toast.show({ type: 'error', text1: tr('请选择开始日期', 'Please select a start date', 'الرجاء اختيار تاريخ البدء', language) });
      return;
    }
    if (form.task_type === 'repeat' && form.repeat_type === 'none') {
      Toast.show({ type: 'error', text1: tr('请选择重复方式', 'Please select a repeat type', 'الرجاء اختيار نوع التكرار', language) });
      return;
    }
    // 截止日期若早于开始日期，报错
    if (form.task_type === 'repeat' && form.end_date && form.start_date && form.end_date < form.start_date) {
      Toast.show({ type: 'error', text1: tr('截止日期不能早于开始日期', 'End date cannot be before start', 'تاريخ الانتهاء قبل البدء', language) });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        task_type: form.task_type,
        repeat_type: form.repeat_type,
        task_date: form.task_date,
        start_date: form.start_date,
        end_date: form.end_date,
        color: form.color,
      };
      if (editing) {
        await calendarApi.update(editing.id, payload);
      } else {
        await calendarApi.create(payload);
      }
      Toast.show({ type: 'success', text1: t('messages.addSuccess') });
      closeModal();
      fetchTasks();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || t('messages.error') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const confirmed = Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm
      ? window.confirm(t('calendar.deleteConfirm'))
      : true;
    if (!confirmed) return;
    try {
      await calendarApi.remove(editing.id);
      Toast.show({ type: 'success', text1: t('messages.deleteSuccess') });
      closeModal();
      fetchTasks();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || t('messages.error') });
    }
  };

  const toggleComplete = async (task: CalendarTask) => {
    try {
      await calendarApi.toggleComplete(task.id, !task.completed);
      fetchTasks();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: t('messages.error') });
    }
  };

  // ================= 渲染 =================
  const renderTaskItem = ({ item }: { item: CalendarTask }) => {
    const color = item.color || COLORS[0];
    return (
      <TouchableOpacity
        className="flex-row items-center rounded-xl border border-gray-100 bg-white px-3 py-2.5 mb-2 shadow-sm"
        activeOpacity={0.7}
        onPress={() => openEdit(item)}
      >
        {/* 完成勾选 */}
        <TouchableOpacity
          className="w-6 h-6 rounded-full border-2 items-center justify-center mr-3"
          style={{ borderColor: item.completed ? color : '#d1d5db' }}
          onPress={() => toggleComplete(item)}
        >
          {item.completed && <FontAwesome6 name="check" size={11} color="#fff" />}
        </TouchableOpacity>
        {/* 色条 */}
        <View className="w-1 h-9 rounded-full mr-3" style={{ backgroundColor: color }} />
        <View className="flex-1">
          <Text
            className={`text-sm font-semibold ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
          >
            {item.title}
          </Text>
          {item.description ? (
            <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>
        {item.task_type === 'repeat' && (
          <View className="flex-row items-center bg-indigo-50 rounded-full px-2 py-0.5 ml-2">
            <FontAwesome6 name="rotate" size={8} color="#4F46E5" />
            <Text className="text-indigo-500 text-[10px] ml-1">{t('calendar.repeatTask')}</Text>
          </View>
        )}
        <FontAwesome6 name="chevron-right" size={12} color="#cbd5e1" className="ml-2" />
      </TouchableOpacity>
    );
  };

  const renderDayGroup = ({ item }: { item: { date: Date; list: CalendarTask[] } }) => {
    const isToday = fmt(item.date) === fmt(new Date());
    return (
      <View className="mb-1">
        {/* 分组日期头 */}
        <View className="flex-row items-center px-1 py-2">
          <Text className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
            {language === 'zh'
              ? `${item.date.getMonth() + 1}月${item.date.getDate()}日 ${['周日','周一','周二','周三','周四','周五','周六'][item.date.getDay()]}`
              : item.date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
          {isToday && (
            <View className="bg-indigo-100 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-indigo-600 text-[10px] font-semibold">{t('calendar.today')}</Text>
            </View>
          )}
        </View>
        {item.list.length === 0 ? (
          <Text className="text-xs text-gray-300 px-1 py-3 pl-3">
            {tr('今日暂无任务', 'No tasks today', 'لا توجد مهام اليوم', language)}
          </Text>
        ) : (
          item.list.map((task) => (
            <View key={task.id}>
              {renderTaskItem({ item: task })}
            </View>
          ))
        )}
      </View>
    );
  };

  // 视图切换按钮
  const viewOptions: { key: ViewMode; label: string }[] = [
    { key: 'day', label: t('calendar.today') },
    { key: 'week', label: t('calendar.week') },
    { key: 'month', label: t('calendar.month') },
  ];

  const rangeLabel = useMemo(() => {
    if (viewMode === 'day') {
      return language === 'zh'
        ? `${anchor.getFullYear()}年${anchor.getMonth() + 1}月${anchor.getDate()}日`
        : anchor.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    if (viewMode === 'week') {
      return `${range.from} ~ ${range.to}`;
    }
    return `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}`;
  }, [viewMode, anchor, range, language]);

  const navigate = (dir: number) => {
    if (viewMode === 'day') setAnchor((d) => addDays(d, dir));
    else if (viewMode === 'week') setAnchor((d) => addDays(d, dir * 7));
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const goToday = () => {
    setAnchor(new Date());
  };

  return (
    <Screen>
      <View className="flex-1">
        {/* Header */}
        <View className="px-3 pt-2 pb-1.5 flex-row items-center">
          <View className="bg-gradient-to-br from-indigo-400 to-violet-400 p-2 rounded-xl mr-2.5">
            <FontAwesome6 name="calendar-days" size={18} color="white" />
          </View>
          <Text className="text-lg font-bold text-gray-800">{t('calendar.title')}</Text>
          <TouchableOpacity
            className="ml-auto bg-indigo-500 rounded-lg px-3 py-1.5 flex-row items-center"
            onPress={openCreate}
          >
            <FontAwesome6 name="plus" size={12} color="#fff" />
            <Text className="text-white text-xs font-semibold ml-1">{t('calendar.newTask')}</Text>
          </TouchableOpacity>
        </View>

        {/* 视图切换 + 日期导航 */}
        <View className="px-3 py-2">
          <View className="bg-gray-100 rounded-xl p-1 flex-row">
            {viewOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                className={`flex-1 rounded-lg py-1.5 items-center ${viewMode === opt.key ? 'bg-white shadow-sm' : ''}`}
                onPress={() => setViewMode(opt.key)}
              >
                <Text className={`text-sm font-semibold ${viewMode === opt.key ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 日期导航 */}
          <View className="flex-row items-center justify-between mt-2.5">
            <TouchableOpacity className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center" onPress={() => navigate(-1)}>
              <FontAwesome6 name="chevron-left" size={13} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity className="items-center" onPress={goToday}>
              <Text className="text-sm font-bold text-gray-700">{rangeLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center" onPress={() => navigate(1)}>
              <FontAwesome6 name="chevron-right" size={13} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 任务列表 */}
        <FlatList
          className="flex-1 px-3"
          data={grouped}
          keyExtractor={(item) => item.date.toISOString()}
          renderItem={renderDayGroup}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            loading ? null : (
              <View className="items-center pt-24">
                <View className="bg-indigo-100 p-4 rounded-full mb-3">
                  <FontAwesome6 name="calendar-days" size={32} color="#4F46E5" />
                </View>
                <Text className="text-gray-600 font-medium">{t('calendar.noTasks')}</Text>
                <Text className="text-sm text-gray-400 mt-1">
                  {tr('点击右上角 + 新建任务', 'Tap + to add a task', 'اضغط + لإضافة مهمة', language)}
                </Text>
              </View>
            )
          }
        />

        {/* 新建/编辑弹窗 */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
            <KeyboardAvoidingView
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <TouchableWithoutFeedback onPress={closeModal}>
                <View className="flex-1 justify-end">
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="bg-white rounded-t-3xl max-h-[90%]">
                      <View className="items-center pt-3 pb-1">
                        <View className="w-10 h-1 rounded-full bg-gray-200" />
                      </View>
                      <View className="flex-row items-center px-5 pt-2 pb-3">
                        <Text className="text-lg font-bold text-gray-800 flex-1">
                          {editing ? t('calendar.editTask') : t('calendar.newTask')}
                        </Text>
                        <TouchableOpacity onPress={closeModal} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                          <FontAwesome6 name="xmark" size={15} color="#6b7280" />
                        </TouchableOpacity>
                      </View>

                      <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flexShrink: 1 }}
                      >
                        <ScrollView className="px-5 pb-4" keyboardShouldPersistTaps="handled">
                          {/* 任务标题 */}
                          <Text className="text-xs font-medium text-gray-500 mb-1">{t('calendar.titleLabel')}</Text>
                          <TextInput
                            className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3 text-gray-800"
                            value={form.title}
                            onChangeText={(v) => setForm({ ...form, title: v })}
                            placeholder={t('calendar.titlePlaceholder')}
                            placeholderTextColor="#9ca3af"
                          />

                          {/* 任务描述 */}
                          <Text className="text-xs font-medium text-gray-500 mb-1">{t('calendar.descLabel')}</Text>
                          <TextInput
                            className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3 text-gray-800"
                            value={form.description}
                            onChangeText={(v) => setForm({ ...form, description: v })}
                            placeholder={t('calendar.descPlaceholder')}
                            placeholderTextColor="#9ca3af"
                            multiline
                          />

                          {/* 任务类型：单次/周期 */}
                          <Text className="text-xs font-medium text-gray-500 mb-1">{t('calendar.taskType')}</Text>
                          <View className="flex-row gap-2 mb-3">
                            {(['once', 'repeat'] as const).map((tp) => (
                              <TouchableOpacity
                                key={tp}
                                className={`flex-1 py-2 rounded-xl items-center border ${form.task_type === tp ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}
                                onPress={() => setForm({ ...form, task_type: tp, repeat_type: tp === 'once' ? 'none' : form.repeat_type })}
                              >
                                <Text className={`text-sm font-medium ${form.task_type === tp ? 'text-indigo-600' : 'text-gray-500'}`}>
                                  {tp === 'once' ? t('calendar.onceType') : t('calendar.repeatType')}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          {form.task_type === 'once' ? (
                            <>
                              <Text className="text-xs font-medium text-gray-500 mb-1">{t('calendar.singleDate')}</Text>
                              <SmartDateInput
                                value={form.task_date ? `${form.task_date}T00:00:00` : ''}
                                onChange={(iso) => setForm({ ...form, task_date: iso.slice(0, 10) })}
                                mode="date"
                              />
                            </>
                          ) : (
                            <>
                              {/* 重复方式 */}
                              <Text className="text-xs font-medium text-gray-500 mb-1">{t('calendar.repeatKind')}</Text>
                              <View className="flex-row gap-2 mb-3 flex-wrap">
                                {(['daily', 'weekly', 'monthly'] as const).map((rt) => (
                                  <TouchableOpacity
                                    key={rt}
                                    className={`py-2 px-3 rounded-xl border ${form.repeat_type === rt ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}
                                    onPress={() => setForm({ ...form, repeat_type: rt })}
                                  >
                                    <Text className={`text-sm font-medium ${form.repeat_type === rt ? 'text-indigo-600' : 'text-gray-500'}`}>
                                      {t(`calendar.${rt}`)}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>

                              {/* 开始/截止日期 */}
                              <View className="mb-3">
                                <Text className="text-xs font-medium text-gray-500 mb-1">{t('calendar.startDate')}</Text>
                                <SmartDateInput
                                  value={form.start_date ? `${form.start_date}T00:00:00` : ''}
                                  onChange={(iso) => setForm({ ...form, start_date: iso.slice(0, 10) })}
                                  mode="date"
                                />
                              </View>
                              <View className="mb-3">
                                <Text className="text-xs font-medium text-gray-500 mb-1">{t('calendar.endDate')}</Text>
                                <SmartDateInput
                                  value={form.end_date ? `${form.end_date}T00:00:00` : ''}
                                  onChange={(iso) => setForm({ ...form, end_date: iso.slice(0, 10) })}
                                  mode="date"
                                  placeholder={t('calendar.endDatePlaceholder')}
                                />
                              </View>
                            </>
                          )}

                          {/* 颜色选择 */}
                          <View>
                            <Text className="text-xs font-medium text-gray-500 mb-1">{t('calendar.colorLabel')}</Text>
                            <View className="flex-row flex-wrap gap-2.5 mb-4">
                              {COLORS.map((c) => (
                                <TouchableOpacity
                                  key={c}
                                  className={`w-8 h-8 rounded-full items-center justify-center ${form.color === c ? 'border-2 border-gray-800' : ''}`}
                                  style={{ backgroundColor: c }}
                                  onPress={() => setForm({ ...form, color: c })}
                                >
                                  {form.color === c && <FontAwesome6 name="check" size={12} color="#fff" />}
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>

                          {/* 操作按钮 */}
                          <View className="flex-row gap-3 pt-1">
                            <TouchableOpacity
                              className="flex-1 py-3 rounded-xl border border-gray-200 items-center"
                              onPress={closeModal}
                            >
                              <Text className="text-gray-600 font-medium">{t('buttons.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-1 py-3 rounded-xl bg-indigo-500 items-center"
                              onPress={handleSave}
                              disabled={saving}
                            >
                              <Text className="text-white font-semibold">
                                {saving ? tr('保存中...', 'Saving...', 'جار الحفظ...', language) : t('buttons.save')}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* 编辑时才显示删除 */}
                          {editing && (
                            <TouchableOpacity
                              className="mt-3 py-3 rounded-xl border border-red-200 items-center"
                              onPress={handleDelete}
                            >
                              <Text className="text-red-500 font-medium">{t('buttons.delete')}</Text>
                            </TouchableOpacity>
                          )}
                        </ScrollView>
                      </KeyboardAvoidingView>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </Screen>
  );
}