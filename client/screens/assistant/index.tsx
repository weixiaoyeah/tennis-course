import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Screen } from '@/components/Screen';
import { assistantApi, type SearchResult, type AssistantRecommendations } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

// 三语言帮助函数（阿拉伯语 RTL 文字）
function tr(zh: string, en: string, ar: string, language: string): string {
  if (language === 'ar') return ar;
  return language === 'zh' ? zh : en;
}

export default function AssistantScreen() {
  const router = useSafeRouter();
  const { language } = useTranslation();

  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [recommend, setRecommend] = useState<AssistantRecommendations | null>(null);
  const [loadRec, setLoadRec] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    try {
      const data = await assistantApi.recommendations();
      setRecommend(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoadRec(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecommendations();
    }, [fetchRecommendations])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecommendations();
  }, [fetchRecommendations]);

  const doSearch = useCallback(async () => {
    const q = keyword.trim();
    if (!q) {
      setSearchResult(null);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const data = await assistantApi.search(q);
      setSearchResult(data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResult({ teachers: [], courses: [], lessons: [] });
    } finally {
      setSearching(false);
    }
  }, [keyword]);

  // 根据当前语言渲染教练等级标签
  const levelLabel = (level: string) => {
    if (level === 'core') return tr('核心教练', 'Core Coach', 'مدرب أساسي', language);
    if (level === 'regular') return tr('常规教练', 'Regular Coach', 'مدرب منتظم', language);
    return tr('替补教练', 'Extra Coach', 'مدرب إضافي', language);
  };

  const levelColor = (level: string) => {
    if (level === 'core') return 'from-rose-400 to-pink-500';
    if (level === 'regular') return 'from-amber-400 to-orange-500';
    return 'from-slate-400 to-slate-500';
  };

  // 跳转到对应模块
  const goTo = (type: 'teacher' | 'course' | 'record') => {
    if (type === 'teacher') router.navigate('/teachers');
    else if (type === 'course') router.navigate('/courses');
    else router.navigate('/records');
  };

  // 搜索分组列表渲染
  const renderResultGroup = (
    title: string,
    icon: string,
    iconBg: string,
    items: any[],
    type: 'teacher' | 'course' | 'record',
    renderLine: (item: any) => string
  ) => {
    if (items.length === 0) return null;
    return (
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <View className={`bg-gradient-to-br ${iconBg} p-1.5 rounded-lg mr-2`}>
            <FontAwesome6 name={icon} size={12} color="white" />
          </View>
          <Text className="text-sm font-bold text-gray-700">{title}</Text>
          <View className="ml-2 bg-gray-200 px-2 py-0.5 rounded-full">
            <Text className="text-xs text-gray-600">{items.length}</Text>
          </View>
        </View>
        {items.map((item) => (
          <TouchableOpacity
            key={`${type}-${item.id}`}
            onPress={() => goTo(type)}
            className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] font-bold text-gray-800 flex-1">{item.name || renderLine(item)}</Text>
              <FontAwesome6 name="chevron-right" size={12} color="#9ca3af" />
            </View>
            <Text className="text-xs text-gray-500 mt-1">{renderLine(item)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const totalMatches = searchResult
    ? searchResult.teachers.length + searchResult.courses.length + searchResult.lessons.length
    : 0;

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']}>
      <View className="flex-1">
        {/* 沉浸式 Header */}
        <View className="px-4 pt-4 pb-5 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 rounded-b-3xl">
          <View className="flex-row items-center">
            <View className="w-11 h-11 rounded-2xl bg-white/20 items-center justify-center mr-3">
              <FontAwesome6 name="wand-magic-sparkles" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-black text-white">
                {tr('巡场小助手', 'Court Assistant', 'مساعد الملعب', language)}
              </Text>
              <Text className="text-xs text-white/80 mt-0.5">
                {tr('RacketPro · 全局搜索与智能推荐', 'RacketPro · Search & Recommend', 'RacketPro · بحث وتوصية', language)}
              </Text>
            </View>
          </View>

          {/* 全局搜索框 */}
          <View className="mt-4 flex-row items-center bg-white/95 rounded-2xl px-3 py-1.5 shadow-lg">
            <FontAwesome6 name="magnifying-glass" size={16} color="#8b5cf6" />
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder={tr('搜索教练、课程、课时记录…', 'Search coaches, courses, records…', 'ابحث عن المدربين والدورات والسجلات…', language)}
              placeholderTextColor="#9ca3af"
              className="flex-1 ml-2 py-2 text-[15px] text-gray-800"
              onSubmitEditing={doSearch}
              returnKeyType="search"
              selectionColorClassName="accent-violet-500"
            />
            {keyword.trim().length > 0 && (
              <TouchableOpacity onPress={() => { setKeyword(''); setSearchResult(null); setHasSearched(false); }} className="p-1.5">
                <FontAwesome6 name="xmark" size={13} color="#9ca3af" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={doSearch}
              disabled={searching}
              className="ml-1 bg-gradient-to-br from-violet-500 to-fuchsia-500 px-4 py-2 rounded-xl"
            >
              {searching ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-[13px] font-bold">
                  {tr('搜索', 'Search', 'بحث', language)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1 bg-gray-50"
          contentContainerClassName="px-4 pt-4 pb-8"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyboardShouldPersistTaps="handled"
        >
          {/* ===== 搜索结果区 ===== */}
          {hasSearched && (
            <View>
              {searching ? (
                <View className="items-center py-14">
                  <ActivityIndicator size="large" color="#8b5cf6" />
                  <Text className="text-gray-500 mt-3 text-sm">
                    {tr('正在搜索…', 'Searching…', 'جارٍ البحث…', language)}
                  </Text>
                </View>
              ) : totalMatches === 0 ? (
                <View className="items-center py-14">
                  <View className="bg-indigo-100 p-3 rounded-full mb-2.5">
                    <FontAwesome6 name="magnifying-glass-minus" size={28} color="#8b5cf6" />
                  </View>
                  <Text className="text-gray-600 font-medium text-sm">
                    {tr('未找到相关结果', 'No results found', 'لا توجد نتائج', language)}
                  </Text>
                </View>
              ) : (
                <View className="mb-4">
                  <Text className="text-sm font-bold text-gray-500 mb-3">
                    {tr('搜索结果', 'Search Results', 'نتائج البحث', language)}
                    <Text className="text-violet-500"> · {totalMatches}</Text>
                  </Text>
                  {renderResultGroup(
                    tr('教练', 'Coaches', 'المدربون', language), 'user-tie', 'from-indigo-400 to-violet-500',
                    searchResult?.teachers || [], 'teacher',
                    (i) => i.phone ? `${i.name} · ${i.phone}` : (i.name || '')
                  )}
                  {renderResultGroup(
                    tr('课程', 'Courses', 'الدورات', language), 'book', 'from-sky-400 to-cyan-500',
                    searchResult?.courses || [], 'course',
                    (i) => `${i.total_lessons} ${tr('课时', 'lessons', 'درس', language)}${i.teacher_name ? ` · ${i.teacher_name}` : ''}`
                  )}
                  {renderResultGroup(
                    tr('课时记录', 'Lesson Records', 'سجلات الدروس', language), 'clipboard-list', 'from-emerald-400 to-teal-500',
                    searchResult?.lessons || [], 'record',
                    (i) => `${i.lesson_date} · ${i.duration} ${tr('课时', 'h', 'س', language)}`
                  )}
                </View>
              )}
            </View>
          )}

          {/* ===== 智能教练推荐区 ===== */}
          {!hasSearched && (
            <View>
              <View className="flex-row items-center mb-1">
                <View className="bg-gradient-to-br from-rose-400 to-pink-500 p-2 rounded-xl mr-2.5">
                  <FontAwesome6 name="ranking-star" size={16} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-800">
                    {tr('智能教练推荐', 'Smart Coach Recommendation', 'توصية المدرب الذكية', language)}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {tr('基于历史课时训练量自动推荐合适的教练', 'Auto-recommended based on lesson volume', 'توصية تلقائية حسب حجم التدريب', language)}
                  </Text>
                </View>
              </View>

              {/* 当前推荐卡片 */}
              {loadRec ? (
                <View className="items-center py-10">
                  <ActivityIndicator size="large" color="#f43f5e" />
                </View>
              ) : recommend && recommend.recommendation ? (
                <View className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-4 mt-3 shadow-lg">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-white/25 items-center justify-center mr-3">
                      <FontAwesome6 name="user-tie" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-xl font-black text-white">{recommend.recommendation.name}</Text>
                        <View className="ml-2 bg-white/25 px-2 py-0.5 rounded-full">
                          <Text className="text-[11px] font-bold text-white">
                            {tr('推荐', 'Recommended', 'موصى به', language)}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-white/85 mt-0.5">
                        {tr('训练量最高，当前最适合承担课程', 'Highest volume, best fit now', 'الأعلى حجماً، الأنسب حالياً', language)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="items-center py-10">
                  <View className="bg-emerald-100 p-3 rounded-full mb-2.5">
                    <FontAwesome6 name="user-shield" size={28} color="#059669" />
                  </View>
                  <Text className="text-gray-600 font-medium text-sm">
                    {tr('暂无教练训练数据', 'No training data yet', 'لا توجد بيانات تدريب', language)}
                  </Text>
                </View>
              )}

              {/* 全部教练训练量列表 */}
              {!loadRec && recommend && recommend.teachers.length > 0 && (
                <View className="mt-4">
                  <Text className="text-sm font-bold text-gray-600 mb-2 px-1">
                    {tr('教练训练量排行', 'Coach Volume Ranking', 'ترتيب حجم التدريب', language)}
                  </Text>
                  {(recommend.teachers || []).map((t, idx) => (
                    <View key={t.teacher_id} className="bg-white rounded-2xl p-3.5 mb-2.5 shadow-sm border border-gray-100 flex-row items-center">
                      <Text className="text-2xl font-black text-gray-300 w-8">{idx + 1}</Text>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-[15px] font-bold text-gray-800">{t.name}</Text>
                          <View className={`ml-2 bg-gradient-to-br ${levelColor(t.level)} px-2 py-0.5 rounded-full`}>
                            <Text className="text-[10px] font-bold text-white">{levelLabel(t.level)}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center mt-1.5 gap-3">
                          <View className="flex-row items-center">
                            <FontAwesome6 name="clock" size={10} color="#9ca3af" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {tr('训练课时', 'Hours', 'ساعات التدريب', language)} {t.total_hours}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <FontAwesome6 name="repeat" size={10} color="#9ca3af" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {tr('上课次数', 'Sessions', 'الجلسات', language)} {t.records}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <FontAwesome6 name="chart-pie" size={10} color="#9ca3af" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {tr('占比', 'Share', 'النسبة', language)} {t.ratio}%
                            </Text>
                          </View>
                        </View>
                        {/* 进度条 */}
                        <View className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                          <View
                            className={`h-full rounded-full bg-gradient-to-r ${levelColor(t.level)}`}
                            style={{ width: `${Math.min(Math.max(t.ratio, 0), 100)}%` }}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}