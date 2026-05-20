import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { lesson_records, insertLessonRecordSchema } from '../storage/database/shared/schema';

const router = Router();

// 获取所有上课记录（可按课程包筛选）
router.get('/', async (req, res) => {
  try {
    const { course_package_id } = req.query;
    const client = getSupabaseClient();
    
    let query = client
      .from('lesson_records')
      .select('*, teachers(name), course_packages(name)')
      .order('created_at', { ascending: false });
    
    if (course_package_id) {
      query = query.eq('course_package_id', parseInt(course_package_id as string));
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个上课记录
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('lesson_records')
      .select('*, teachers(name), course_packages(name)')
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: '上课记录不存在' });
    }
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 创建上课记录（支持确认角色）
router.post('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { confirmed_by, ...rest } = req.body;
    
    const parseResult = insertLessonRecordSchema.safeParse(rest);
    
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return res.status(400).json({ error: errorMessages });
    }
    
    // 如果有确认角色，创建记录并更新确认状态
    if (confirmed_by) {
      const { data, error } = await client
        .from('lesson_records')
        .insert({ ...parseResult.data, confirmed_by })
        .select('*, teachers(name), course_packages(name)')
        .single();
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(201).json(data);
    }
    
    // 无确认角色，只创建记录
    const { data, error } = await client
      .from('lesson_records')
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

// 确认课程计划
router.post('/confirm-schedule', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { schedule_id, confirmed_by, is_attended, duration } = req.body;
    
    if (!schedule_id) {
      return res.status(400).json({ error: '课程计划ID不能为空' });
    }
    
    // 获取课程计划详情
    const { data: schedule, error: scheduleError } = await client
      .from('course_schedules')
      .select('*')
      .eq('id', schedule_id)
      .maybeSingle();
    
    if (scheduleError) {
      return res.status(500).json({ error: scheduleError.message });
    }
    
    if (!schedule) {
      return res.status(404).json({ error: '课程计划不存在' });
    }
    
    if (schedule.status !== 'pending') {
      return res.status(400).json({ error: '该课程计划已确认' });
    }
    
    // 创建上课记录
    const lessonRecord = {
      course_package_id: schedule.course_package_id,
      teacher_id: schedule.teacher_id,
      lesson_date: schedule.schedule_date.replace(/^\\d{4}-/, '') + ' ' + schedule.schedule_time,
      duration: duration || schedule.duration,
      remark: schedule.remark || '',
    };
    
    const parseResult = insertLessonRecordSchema.safeParse(lessonRecord);
    if (!parseResult.success) {
      return res.status(400).json({ error: '数据验证失败' });
    }
    
    // 如果已上课，添加确认角色
    if (is_attended && confirmed_by) {
      parseResult.data.confirmed_by = confirmed_by;
    }
    
    const { data: newRecord, error: insertError } = await client
      .from('lesson_records')
      .insert(parseResult.data)
      .select('*, teachers(name), course_packages(name)')
      .single();
    
    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }
    
    // 更新课程计划状态
    await client
      .from('course_schedules')
      .update({ 
        status: is_attended ? 'confirmed' : 'absent',
        confirmed_by: is_attended ? confirmed_by : null,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', schedule_id);
    
    res.status(201).json(newRecord);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 更新上课记录
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const parseResult = insertLessonRecordSchema.partial().safeParse(req.body);
    
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return res.status(400).json({ error: errorMessages });
    }
    
    const { data, error } = await client
      .from('lesson_records')
      .update(parseResult.data)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: '上课记录不存在' });
    }
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 删除上课记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { error } = await client
      .from('lesson_records')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
