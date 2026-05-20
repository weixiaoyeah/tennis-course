import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';

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
    
    // 获取最近一次未确认的课程计划
    const { data: nextSchedule, error: scheduleError } = await client
      .from('course_schedules')
      .select('*')
      .eq('status', 'pending')
      .order('schedule_date', { ascending: true })
      .limit(1);
    
    if (scheduleError) {
      console.error('Error fetching next schedule:', scheduleError);
    }
    
    // 计算统计 - 只计算有confirmed_by的记录（已确认的上课）
    const totalLessons = packages?.reduce((sum: number, p: { total_lessons?: number }) => sum + (p.total_lessons || 0), 0) || 0;
    const usedLessons = records?.reduce((sum: number, r: { duration?: number }) => sum + (r.duration || 0), 0) || 0;
    const remainingLessons = totalLessons - usedLessons;
    
    // 查找对应的教练信息
    const nextScheduleWithTeacher = nextSchedule?.[0] ? {
      ...nextSchedule[0],
      teacher: teachers?.find((t: { id: number }) => t.id === nextSchedule[0].teacher_id)
    } : null;
    
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
      next_schedule: nextScheduleWithTeacher,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
