const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL + '/api/v1';

export interface Teacher {
  id: number;
  name: string;
  phone?: string;
  remark?: string;
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
  getAll: async (course_package_id?: number): Promise<LessonRecord[]> => {
    const url = course_package_id 
      ? `${API_BASE}/lessons?course_package_id=${course_package_id}`
      : `${API_BASE}/lessons`;
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
};

// 统计 API
export const statsApi = {
  getAll: async (): Promise<Stats> => {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('获取统计数据失败');
    return res.json();
  },
};
