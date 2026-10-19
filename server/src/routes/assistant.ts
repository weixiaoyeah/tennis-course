import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';

const router = Router();

// 通用：归一化字符串用于模糊匹配（忽略大小写与首尾空格）
function norm(str?: string | null): string {
  return (str || '').toString().toLowerCase().trim();
}

// 判断候选字符串是否包含关键词（支持中文/英文/阿拉伯文）
function includesAny(needle: string, candidate?: string | null): boolean {
  if (!candidate) return false;
  const c = norm(candidate);
  return c.includes(needle);
}

// ============ 全局搜索：按中文/英文/阿拉伯文搜索教练、课程、课时记录 ============
// 接口：GET /api/v1/assistant/search?q=关键词
router.get('/search', async (_req, res) => {
  try {
    const q = norm(String(_req.query.q || ''));
    if (!q) {
      return res.json({ teachers: [], courses: [], lessons: [] });
    }

    const client = getSupabaseClient();

    // 一次性拉取三类数据（供内存多字段/多语言模糊匹配，数据量小且语言适配最稳）
    const [{ data: teachers }, { data: courses }, { data: lessons }] = await Promise.all([
      client.from('teachers').select('*'),
      client.from('course_packages').select('*'),
      client.from('lesson_records').select('*, teachers(name), course_packages(name)'),
    ]);

    // 教练：匹配姓名 / 电话 / 备注
    const matchedTeachers = (teachers || []).filter((t: any) =>
      includesAny(q, t.name) ||
      includesAny(q, t.phone) ||
      includesAny(q, t.remark)
    );

    // 课程包：匹配名称，以及授课教练姓名
    const matchedCourses = (courses || []).filter((c: any) => {
      const teacherName = c.teachers?.name || '';
      return includesAny(q, c.name) || includesAny(q, teacherName);
    });

    // 课时记录：匹配上课时间 / 备注 / 教练姓名 / 课程名称
    const matchedLessons = (lessons || []).filter((l: any) =>
      includesAny(q, l.lesson_date) ||
      includesAny(q, l.remark) ||
      includesAny(q, l.teachers?.name) ||
      includesAny(q, l.course_packages?.name)
    );

    res.json({
      teachers: matchedTeachers.map((t: any) => ({ id: t.id, name: t.name, phone: t.phone, remark: t.remark })),
      courses: matchedCourses.map((c: any) => ({ id: c.id, name: c.name, total_lessons: c.total_lessons, teacher_name: c.teachers?.name || '' })),
      lessons: matchedLessons.map((l: any) => ({
        id: l.id,
        lesson_date: l.lesson_date,
        duration: l.duration,
        remark: l.remark,
        teacher_name: l.teachers?.name || '',
        course_name: l.course_packages?.name || '',
        confirmed_by: l.confirmed_by,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 智能教练推荐：基于历史课时数据（训练量 + 占比）============
// 接口：GET /api/v1/assistant/recommendations
router.get('/recommendations', async (_req, res) => {
  try {
    const client = getSupabaseClient();

    const [{ data: teachers }, { data: records }] = await Promise.all([
      client.from('teachers').select('*'),
      client.from('lesson_records')
        .select('teacher_id, duration, confirmed_by, lesson_date')
        .or('confirmed_by.eq.coach,confirmed_by.eq.student'),
    ]);

    const teacherList = teachers || [];
    const confirmed = records || [];

    // 按教练聚合：训练量（已上课时）与上课次数
    const stats = new Map<number, { hours: number; count: number }>();
    teacherList.forEach((t: any) => {
      if (!stats.has(t.id)) stats.set(t.id, { hours: 0, count: 0 });
    });
    let totalHours = 0;
    confirmed.forEach((r: any) => {
      if (!r.teacher_id) return;
      const hours = r.duration || 0;
      const cur = stats.get(r.teacher_id) || { hours: 0, count: 0 };
      cur.hours += hours;
      cur.count += 1;
      stats.set(r.teacher_id, cur);
      totalHours += hours;
    });

    // 计算每名教练占比，并生成建议
    const recommendations = teacherList.map((t: any) => {
      const s = stats.get(t.id) || { hours: 0, count: 0 };
      const ratio = totalHours > 0 ? Math.round((s.hours / totalHours) * 100) : 0;
      const level = ratio >= 40 ? 'core' : ratio >= 20 ? 'regular' : 'extra';
      return {
        teacher_id: t.id,
        name: t.name,
        phone: t.phone,
        total_hours: s.hours,
        records: s.count,
        ratio,
        level,
        reason_hint: level,
      };
    });

    // 推荐排序：训练量高、占比较高的教练优先（适合当前课时的主力）
    const sorted = [...recommendations].sort((a, b) => b.total_hours - a.total_hours || b.ratio - a.ratio);
    const top = sorted.find((s) => s.total_hours > 0) || (sorted.length > 0 ? sorted[0] : null);

    res.json({
      total_hours: totalHours,
      total_teachers: teacherList.length,
      recommendation: top ? { teacher_id: top.teacher_id, name: top.name } : null,
      teachers: sorted,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;