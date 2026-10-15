import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Screen } from '@/components/Screen';
import { teachersApi, lessonsApi, type Teacher, type LessonRecord } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 格式化课程日期
function formatLessonDate(dateStr: string, language: 'zh' | 'en'): string {
  const match = dateStr && dateStr.match(/^(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
  if (!match) return dateStr || '';
  const parts = match[1].replace(/\//g, '-').split('-').map(Number);
  const [y, m, d] = parts;
  return language === 'zh' ? `${m}月${d}日` : `${m}/${d}`;
}

export default function TeachersScreen() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [lessons, setLessons] = useState<Record<number, LessonRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandingId, setExpandingId] = useState<number | null>(null);
  const { t, language } = useTranslation();

  const fetchTeachers = useCallback(async () => {
    try {
      const data = await teachersApi.getAll();
      setTeachers(data);
      setExpandedId(null);
      // 并行拉取每位教练的课程记录，用于卡片头部直接展示统计
      const lessonsMap: Record<number, LessonRecord[]> = {};
      await Promise.all(
        (data || []).map(async (teacher) => {
          try {
            const teacherLessons = await lessonsApi.getAll(undefined, teacher.id);
            lessonsMap[teacher.id] = teacherLessons || [];
          } catch (e) {
            lessonsMap[teacher.id] = [];
          }
        })
      );
      setLessons(lessonsMap);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      Toast.show({ type: 'error', text1: t('messages.error') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchTeachers();
    }, [fetchTeachers])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeachers();
  }, [fetchTeachers]);

  const fetchTeacherLessons = useCallback(async (teacherId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    // 已展开则收起
    if (expandedId === teacherId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(teacherId);
    setExpandingId(teacherId);
    try {
      // 已有缓存则直接使用
      if (lessons[teacherId]) {
        setExpandingId(null);
        return;
      }
      const data = await lessonsApi.getAll(undefined, teacherId);
      setLessons(prev => ({ ...prev, [teacherId]: data || [] }));
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
      Toast.show({ type: 'error', text1: t('messages.error') });
    } finally {
      setExpandingId(null);
    }
  }, [expandedId, lessons, t]);

  // 计算教练统计（总次数含未上课记录，总课时为已确认课时）
  const getStats = (teacherLessons: LessonRecord[]) => {
    const totalCount = teacherLessons.length; // 总次数
    const totalDuration = teacherLessons.reduce((sum, r) => {
      if (r.confirmed_by) {
        return sum + (r.duration || 0);
      }
      return sum;
    }, 0);
    return { totalCount, totalDuration };
  };

  const renderItem = ({ item }: { item: Teacher }) => {
    const isExpanded = expandedId === item.id;
    const teacherLessons = lessons[item.id] || [];
    const stats = getStats(teacherLessons);
    const isLoading = expandingId === item.id;

    return (
      <View className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl mb-2 shadow-sm border border-orange-100 overflow-hidden">
        {/* Header - 点击展开/收起 */}
        <TouchableOpacity
          className="flex-row items-center p-3"
          activeOpacity={0.7}
          onPress={() => fetchTeacherLessons(item.id)}
        >
          <View className="w-11 h-11 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl items-center justify-center shadow-sm">
            <FontAwesome6 name="user-tie" size={18} color="white" />
          </View>
          <View className="flex-1 ml-2.5">
            <Text className="text-base font-bold text-gray-800">{item.name}</Text>
            {/* 头部统计信息 */}
            <View className="flex-row items-center mt-1">
              <View className="flex-row items-center bg-white/80 rounded-md px-2 py-0.5 mr-1.5">
                <FontAwesome6 name="calendar-day" size={9} color="#f97316" />
                <Text className="text-orange-500 text-xs font-semibold ml-1">
                  {stats.totalCount}
                </Text>
              </View>
              <View className="flex-row items-center bg-white/80 rounded-md px-2 py-0.5">
                <FontAwesome6 name="clock" size={9} color="#8b5cf6" />
                <Text className="text-purple-500 text-xs font-semibold ml-1">
                  {stats.totalDuration}{language === 'zh' ? '课时' : ''}
                </Text>
              </View>
              {item.phone && (
                <Text className="text-xs text-gray-400 ml-1.5 flex-row items-center">
                  <FontAwesome6 name="phone" size={9} color="#9ca3af" /> {item.phone}
                </Text>
              )}
            </View>
          </View>
          <View className="w-7 h-7 bg-white/70 rounded-full items-center justify-center">
            <FontAwesome6 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={13} 
              color="#f97316" 
            />
          </View>
        </TouchableOpacity>

        {/* 展开内容 - 课程记录与统计 */}
        {isExpanded && (
          <View className="border-t border-orange-100">
            {/* 统计面板 */}
            <View className="flex-row justify-around px-3 py-3 bg-white/60">
              <View className="items-center">
                <Text className="text-xl font-black text-orange-500">{stats.totalCount}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {language === 'zh' ? '总次数(次)' : 'Sessions'}
                </Text>
              </View>
              <View className="w-px bg-orange-100" />
              <View className="items-center">
                <Text className="text-xl font-black text-purple-500">{stats.totalDuration}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {language === 'zh' ? '总课时(课时)' : 'Duration'}
                </Text>
              </View>
            </View>

            {/* 课程记录列表 */}
            {isLoading ? (
              <View className="py-6 items-center">
                <Text className="text-gray-400 text-sm">{language === 'zh' ? '加载中...' : 'Loading...'}</Text>
              </View>
            ) : teacherLessons.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-gray-400 text-sm">{language === 'zh' ? '暂无上课记录' : 'No lessons yet'}</Text>
              </View>
            ) : (
              <View className="px-3 pb-3">
                {teacherLessons.map((lesson) => (
                  <View key={lesson.id} className="flex-row items-center justify-between bg-white rounded-lg px-3 py-2 mb-1.5 border border-orange-50">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-sm font-semibold text-gray-700">
                          {formatLessonDate(lesson.lesson_date, language)}
                        </Text>
                        <Text className="text-xs text-gray-400 ml-2">
                          {lesson.lesson_date && lesson.lesson_date.split(' ')[1] || ''}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-400 mt-0.5">
                        {lesson.course_packages?.name || '-'}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className={`flex-row items-center px-2 py-0.5 rounded-full ${lesson.confirmed_by ? 'bg-green-100' : 'bg-gray-200'}`}>
                        <FontAwesome6 
                          name={lesson.confirmed_by ? 'circle-check' : 'ban'} 
                          size={9} 
                          color={lesson.confirmed_by ? '#22c55e' : '#9ca3af'} 
                        />
                        <Text className={`text-xs ml-1 ${lesson.confirmed_by ? 'text-green-600' : 'text-gray-500'}`}>
                          {lesson.confirmed_by 
                            ? `${lesson.duration || 0}${language === 'zh' ? '课时' : 'les'}`
                            : (language === 'zh' ? '未上课' : 'Absent')
                          }
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen>
      <View className="flex-1">
        {/* Header */}
        <View className="px-3 pt-2 pb-1.5 flex-row items-center">
          <View className="bg-gradient-to-br from-orange-400 to-amber-400 p-2 rounded-xl mr-2.5">
            <FontAwesome6 name="user-tie" size={18} color="white" />
          </View>
          <Text className="text-lg font-bold text-gray-800">{t('teachers.title')}</Text>
        </View>

        {/* List */}
        <FlatList
          className="flex-1 px-3 pt-1"
          data={teachers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            loading ? null : (
              <View className="items-center pt-20">
                <View className="bg-orange-100 p-4 rounded-full mb-3">
                  <FontAwesome6 name="user-tie" size={32} color="#f97316" />
                </View>
                <Text className="text-gray-600 font-medium">{t('teachers.noTeachers')}</Text>
                <Text className="text-sm text-gray-400 mt-1">
                  {language === 'zh' ? '暂无教练，请联系管理员添加' : 'No teachers available'}
                </Text>
              </View>
            )
          }
          contentContainerStyle={teachers.length === 0 ? { flex: 1 } : undefined}
        />
      </View>
    </Screen>
  );
}