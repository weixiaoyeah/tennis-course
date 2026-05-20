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
    
    // 获取所有上课记录（包含已确认和未上课的）
    const { data: records, error: recordsError } = await client
      .from('lesson_records')
      .select('course_package_id, duration, confirmed_by');
    
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
    
    // 计算统计 - 只计算confirmed_by不为空的记录（已确认的上课）
    const totalLessons = packages?.reduce((sum: number, p: { total_lessons?: number }) => sum + (p.total_lessons || 0), 0) || 0;
    const usedLessons = records?.reduce((sum: number, r: { duration?: number; confirmed_by?: string }) => {
      // 只有confirmed_by不为空才计入已用课时
      if (r.confirmed_by) {
        return sum + (r.duration || 0);
      }
      return sum;
    }, 0) || 0;
    const remainingLessons = totalLessons - usedLessons;
    
    // 各课程包统计
    const packageStats = (packages || []).map((pkg: { id: number; name: string; total_lessons: number; teacher_id?: number }) => {
      const pkgRecords = records?.filter((r: { course_package_id?: number }) => r.course_package_id === pkg.id) || [];
      const used = pkgRecords.reduce((sum: number, r: { duration?: number; confirmed_by?: string }) => {
        if (r.confirmed_by) {
          return sum + (r.duration || 0);
        }
        return sum;
      }, 0);
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
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
