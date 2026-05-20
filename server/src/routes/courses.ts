import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { course_packages, insertCoursePackageSchema } from '../storage/database/shared/schema';

const router = Router();

// 获取所有课程包（包含老师信息）
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('course_packages')
      .select('*, teachers(name, phone)')
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个课程包
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('course_packages')
      .select('*, teachers(name, phone)')
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: '课程包不存在' });
    }
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 创建课程包
router.post('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const parseResult = insertCoursePackageSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return res.status(400).json({ error: errorMessages });
    }
    
    const { data, error } = await client
      .from('course_packages')
      .insert(parseResult.data)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 更新课程包
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const parseResult = insertCoursePackageSchema.partial().safeParse(req.body);
    
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return res.status(400).json({ error: errorMessages });
    }
    
    const { data, error } = await client
      .from('course_packages')
      .update(parseResult.data)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: '课程包不存在' });
    }
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 删除课程包
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { error } = await client
      .from('course_packages')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取课程包的课时统计
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    
    // 获取课程包信息
    const { data: packageData, error: packageError } = await client
      .from('course_packages')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (packageError) {
      return res.status(500).json({ error: packageError.message });
    }
    
    if (!packageData) {
      return res.status(404).json({ error: '课程包不存在' });
    }
    
    // 获取已上课时总数
    const { data: records, error: recordsError } = await client
      .from('lesson_records')
      .select('duration')
      .eq('course_package_id', parseInt(id));
    
    if (recordsError) {
      return res.status(500).json({ error: recordsError.message });
    }
    
    const usedLessons = records?.reduce((sum: number, r: { duration?: number }) => sum + (r.duration || 0), 0) || 0;
    const totalLessons = packageData.total_lessons || 0;
    
    res.json({
      ...packageData,
      used_lessons: usedLessons,
      remaining_lessons: totalLessons - usedLessons,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
