import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';
import dayjs from 'dayjs';

const router = Router();

// 获取整体统计
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    
    // 获取所有课程包
    const { data: packages, error: packagesError } = await client
      .from('course_packages')
      .select('*');
    
    if (packagesError) {
      return res.status(500).json({ error: packagesError.message });
    }
    
    // 获取所有上课记录（只获取已确认的）
    const { data: records, error: recordsError } = await client
      .from('lesson_records')
      .select('course_package_id, duration, confirmed_by, lesson_date, teacher_id, remark, created_at')
      .or('confirmed_by.eq.coach,confirmed_by.eq.student');
    
    if (recordsError) {
      return res.status(500).json({ error: recordsError.message });
    }
    
    // 获取所有老师
    const { data: teachers, error: teachersError } = await client
      .from('teachers')
      .select('*');
    
    if (teachersError) {
      return res.status(500).json({ error: teachersError.message });
    }
    
    // 获取首页"下周课程"排课：
    // 1) 未来7天内（含今天）：所有状态的排课都要展示（未确认 pending 可确认，已确认/缺席只读展示）
    // 2) 过期仍未确认（日期 < 今天但状态仍为 pending）：并列展示在后，方便补确认
    const today = dayjs().format('YYYY-MM-DD');
    const weekEnd = dayjs().add(7, 'day').format('YYYY-MM-DD');

    // 未来7天：所有状态（pending/confirmed/absent），按日期升序
    const { data: weekSchedules, error: weekError } = await client
      .from('course_schedules')
      .select('*')
      .gte('schedule_date', today)
      .lte('schedule_date', weekEnd)
      .order('schedule_date', { ascending: true });

    if (weekError) {
      console.error('Error fetching week schedules:', weekError);
    }

    // 过期未确认：日期 < 今天且状态为 pending，按日期升序
    const { data: overdueRaw, error: overdueError } = await client
      .from('course_schedules')
      .select('*')
      .eq('status', 'pending')
      .lt('schedule_date', today)
      .order('schedule_date', { ascending: true });

    if (overdueError) {
      console.error('Error fetching overdue schedules:', overdueError);
    }

    const future = (weekSchedules || []) as any[];
    const overdue = (overdueRaw || []) as any[];
    // 未来7天在前（所有状态），过期未确认课程跟在后面（仅 pending）
    const nextSchedules = [...future, ...overdue];

    const nextSchedule = nextSchedules || [];
    
    // 计算统计 - 只计算有confirmed_by的记录（已确认的上课）
    const totalLessons = packages?.reduce((sum: number, p: { total_lessons?: number }) => sum + (p.total_lessons || 0), 0) || 0;
    const usedLessons = records?.reduce((sum: number, r: { duration?: number }) => sum + (r.duration || 0), 0) || 0;
    const remainingLessons = totalLessons - usedLessons;
    
    // 查找即将上课的教练信息
    const upcomingSchedules = nextSchedule.map((s: any) => ({
      ...s,
      teacher: teachers?.find((t: { id: number }) => t.id === s.teacher_id)
    }));
    
    // 各课程包统计
    const packageStats = (packages || []).map((pkg: { id: number; name: string; total_lessons: number; teacher_id?: number }) => {
      const pkgRecords = records?.filter((r: { course_package_id?: number }) => r.course_package_id === pkg.id) || [];
      const used = pkgRecords.reduce((sum: number, r: { duration?: number }) => sum + (r.duration || 0), 0);
      return {
        id: pkg.id,
        name: pkg.name,
        total_lessons: pkg.total_lessons,
        used_lessons: used,
        remaining_lessons: pkg.total_lessons - used,
        teachers: teachers?.find((t: { id: number }) => t.id === pkg.teacher_id),
      };
    });
    
    res.json({
      total_courses: packages?.length || 0,
      total_lessons: totalLessons,
      used_lessons: usedLessons,
      remaining_lessons: remainingLessons,
      total_teachers: teachers?.length || 0,
      total_records: records?.length || 0,
      package_stats: packageStats,
      next_schedule: upcomingSchedules[0] || null,
      upcoming_schedules: upcomingSchedules,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
