import { Platform } from 'react-native';

// 构建后端 API 基础地址
// - Web 端 (浏览器/预览): 使用相对路径 /api/v1，自动匹配当前访问域名(经 Metro 代理或网关转发到后端)
// - 原生 App (Android/iOS): 使用 EXPO_PUBLIC_BACKEND_BASE_URL 指定的绝对地址 (需指向可达后端)
function resolveApiBase(): string {
  const envBase = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  // Web 端优先用相对路径，避免 localhost 指向用户本机导致请求失败
  if (Platform.OS === 'web') {
    if (envBase && !envBase.startsWith('http://localhost') && !envBase.startsWith('http://127.0.0.1')) {
      return `${envBase}/api/v1`;
    }
    return '/api/v1';
  }
  // 原生端必须有可达的绝对地址
  return `${envBase || ''}/api/v1`;
}

const API_BASE = resolveApiBase();

export interface Teacher {
  id: number;
  name: string;
  phone?: string;
  remark?: string;
  avatar_url?: string;
  created_at: string;
}

export interface CoursePackage {
  id: number;
  name: string;
  total_lessons: number;
  teacher_id?: number;
  start_date?: string;
  created_at: string;
  teachers?: { name: string; phone?: string };
}

export interface LessonRecord {
  id: number;
  course_package_id: number;
  teacher_id?: number;
  lesson_date: string;
  duration: number;
  remark?: string;
  confirmed_by?: string;
  created_at: string;
  teachers?: { name: string };
  course_packages?: { name: string };
}

export interface CourseSchedule {
  id: number;
  course_package_id: number;
  teacher_id: number;
  schedule_date: string;
  schedule_time: string;
  duration: number;
  status: string;
  confirmed_by?: string;
  confirmed_at?: string;
  remark?: string;
  created_at: string;
  teacher?: { name: string };
}

export interface CoursePackageStats extends CoursePackage {
  used_lessons: number;
  remaining_lessons: number;
}

export interface Stats {
  total_courses: number;
  total_lessons: number;
  used_lessons: number;
  remaining_lessons: number;
  total_teachers: number;
  total_records: number;
  package_stats: CoursePackageStats[];
  next_schedule?: CourseSchedule;
  upcoming_schedules?: CourseSchedule[];
}

// 老师 API
export const teachersApi = {
  getAll: async (): Promise<Teacher[]> => {
    const res = await fetch(`${API_BASE}/teachers`);
    if (!res.ok) throw new Error('获取老师列表失败');
    return res.json();
  },
  
  getById: async (id: number): Promise<Teacher> => {
    const res = await fetch(`${API_BASE}/teachers/${id}`);
    if (!res.ok) throw new Error('获取老师信息失败');
    return res.json();
  },
  
  create: async (data: { name: string; phone?: string; remark?: string }): Promise<Teacher> => {
    const res = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('创建老师失败');
    return res.json();
  },
  
  update: async (id: number, data: { name?: string; phone?: string; remark?: string }): Promise<Teacher> => {
    const res = await fetch(`${API_BASE}/teachers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('更新老师失败');
    return res.json();
  },
  
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/teachers/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('删除老师失败');
  },
};

// 课程包 API
export const coursesApi = {
  getAll: async (): Promise<CoursePackage[]> => {
    const res = await fetch(`${API_BASE}/courses`);
    if (!res.ok) throw new Error('获取课程列表失败');
    return res.json();
  },
  
  getById: async (id: number): Promise<CoursePackage> => {
    const res = await fetch(`${API_BASE}/courses/${id}`);
    if (!res.ok) throw new Error('获取课程信息失败');
    return res.json();
  },
  
  getStats: async (id: number): Promise<CoursePackageStats> => {
    const res = await fetch(`${API_BASE}/courses/${id}/stats`);
    if (!res.ok) throw new Error('获取课程统计失败');
    return res.json();
  },
  
  create: async (data: { name: string; total_lessons: number; teacher_id?: number; start_date?: string }): Promise<CoursePackage> => {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('创建课程失败');
    return res.json();
  },
  
  update: async (id: number, data: { name?: string; total_lessons?: number; teacher_id?: number; start_date?: string }): Promise<CoursePackage> => {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('更新课程失败');
    return res.json();
  },
  
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('删除课程失败');
  },
};

// 上课记录 API
export const lessonsApi = {
  getAll: async (course_package_id?: number, teacher_id?: number): Promise<LessonRecord[]> => {
    const params: string[] = [];
    if (course_package_id) params.push(`course_package_id=${course_package_id}`);
    if (teacher_id) params.push(`teacher_id=${teacher_id}`);
    const url = params.length > 0 ? `${API_BASE}/lessons?${params.join('&')}` : `${API_BASE}/lessons`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('获取上课记录失败');
    return res.json();
  },
  
  getById: async (id: number): Promise<LessonRecord> => {
    const res = await fetch(`${API_BASE}/lessons/${id}`);
    if (!res.ok) throw new Error('获取上课记录失败');
    return res.json();
  },
  
  create: async (data: { course_package_id: number; teacher_id?: number; lesson_date: string; duration: number; remark?: string; confirmed_by?: string }): Promise<LessonRecord> => {
    const res = await fetch(`${API_BASE}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('创建上课记录失败');
    return res.json();
  },
  
  update: async (id: number, data: { course_package_id?: number; teacher_id?: number; lesson_date?: string; duration?: number; remark?: string }): Promise<LessonRecord> => {
    const res = await fetch(`${API_BASE}/lessons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('更新上课记录失败');
    return res.json();
  },
  
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/lessons/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('删除上课记录失败');
  },

  // 确认课程计划
  confirmSchedule: async (data: { 
    schedule_id: number; 
    is_attended: boolean; 
    duration: number; 
    confirmed_by?: 'coach' | 'student';
    remark?: string 
  }): Promise<LessonRecord> => {
    const res = await fetch(`${API_BASE}/lessons/confirm-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('确认课程失败');
    return res.json();
  },
};

// 统计 API
export const statsApi = {
  getAll: async (): Promise<Stats> => {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('获取统计数据失败');
    return res.json();
  },
};

// 巡场小助手 API
export interface SearchResult {
  teachers: { id: number; name: string; phone?: string; remark?: string }[];
  courses: { id: number; name: string; total_lessons: number; teacher_name?: string }[];
  lessons: { id: number; lesson_date: string; duration: number; remark?: string; teacher_name?: string; course_name?: string; confirmed_by?: string }[];
}

export interface AssistantRecommendation {
  teacher_id: number;
  name: string;
  phone?: string;
  total_hours: number;
  records: number;
  ratio: number;
  level: string;
  reason_hint?: string;
}

export interface AssistantRecommendations {
  total_hours: number;
  total_teachers: number;
  recommendation: { teacher_id: number; name: string } | null;
  teachers: AssistantRecommendation[];
}

export const assistantApi = {
  search: async (q: string): Promise<SearchResult> => {
    const res = await fetch(`${API_BASE}/assistant/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error('搜索失败');
    return res.json();
  },
  recommendations: async (): Promise<AssistantRecommendations> => {
    const res = await fetch(`${API_BASE}/assistant/recommendations`);
    if (!res.ok) throw new Error('获取教练推荐失败');
    return res.json();
  },
};

// 乐姐日历 API
export interface CalendarTask {
  id: number;
  title: string;
  description?: string;
  task_type: 'once' | 'repeat';
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
  task_date?: string;
  start_date?: string;
  end_date?: string;
  color?: string;
  completed?: boolean;
  created_at: string;
  // 周期展开后的具体实例日期
  occur_date?: string;
}

export interface CalendarTaskInput {
  title: string;
  description?: string;
  task_type: 'once' | 'repeat';
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
  task_date?: string;
  start_date?: string;
  end_date?: string;
  color?: string;
  completed?: boolean;
}

export const calendarApi = {
  // 获取某日期范围内的任务（周期任务已展开）
  getRange: async (from: string, to: string): Promise<CalendarTask[]> => {
    const res = await fetch(`${API_BASE}/calendar?from=${from}&to=${to}`);
    if (!res.ok) throw new Error('获取日历任务失败');
    return res.json();
  },
  // 获取所有任务定义（含周期定义）
  getAll: async (): Promise<CalendarTask[]> => {
    const res = await fetch(`${API_BASE}/calendar/tasks`);
    if (!res.ok) throw new Error('获取日历任务失败');
    return res.json();
  },
  create: async (data: CalendarTaskInput): Promise<CalendarTask> => {
    const res = await fetch(`${API_BASE}/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || '创建任务失败');
    }
    return res.json();
  },
  update: async (id: number, data: CalendarTaskInput): Promise<CalendarTask> => {
    const res = await fetch(`${API_BASE}/calendar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || '更新任务失败');
    }
    return res.json();
  },
  toggleComplete: async (id: number, completed: boolean): Promise<CalendarTask> => {
    const res = await fetch(`${API_BASE}/calendar/${id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) throw new Error('更新任务状态失败');
    return res.json();
  },
  remove: async (id: number): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/calendar/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除任务失败');
    return res.json();
  },
};
