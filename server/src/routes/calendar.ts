import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';
import { z } from 'zod';

const router = Router();

// ============ 乐姐每日任务日历 ============

// 解析 'YYYY-MM-DD' 为日期，非法返回 null
function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getTime() === d.getTime() ? d : null;
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, n: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// 建表校验：id 非空时为更新
const taskSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional().default(''),
  task_type: z.enum(['once', 'repeat']).optional().default('once'),
  repeat_type: z.enum(['none', 'daily', 'weekly', 'monthly']).optional().default('none'),
  task_date: z.string().optional().default(''),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
  color: z.string().optional().default('#4F46E5'),
  completed: z.boolean().optional().default(false),
});

// 将周期任务按日期范围展开，返回该范围内所有“实例”
function expandOccurrences(task: any, from: Date, to: Date): any[] {
  if (task.task_type !== 'repeat' || !task.repeat_type || task.repeat_type === 'none') {
    // 单次任务：日期命中范围则返回
    const d = parseDate(task.task_date);
    if (d && d >= from && d <= to) {
      return [{ ...task, occur_date: task.task_date }];
    }
    return [];
  }

  const start = parseDate(task.start_date) || parseDate(task.task_date);
  const end = parseDate(task.end_date);
  if (!start) return [];

  // 计算有效区间
  const effectiveEnd = end && end < to ? end : to;
  if (start > effectiveEnd) return [];

  const occurrences: any[] = [];
  let cursor = new Date(start);
  // 截止保护：最多展开 500 个实例
  let guard = 0;
  while (cursor <= effectiveEnd && guard < 500) {
    guard++;
    const withinRange = cursor >= from && cursor <= to;
    if (task.repeat_type === 'daily') {
      if (withinRange) occurrences.push({ ...task, occur_date: fmt(cursor) });
      cursor = addDays(cursor, 1);
    } else if (task.repeat_type === 'weekly') {
      if (withinRange) occurrences.push({ ...task, occur_date: fmt(cursor) });
      cursor = addDays(cursor, 7);
    } else if (task.repeat_type === 'monthly') {
      if (withinRange) occurrences.push({ ...task, occur_date: fmt(cursor) });
      // 下月同一天
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate());
    } else {
      break;
    }
  }
  // 若截止日期在范围末尾之前，停止
  if (end && guard >= 500) {
    // 若展开过多但 end 明确，重算以 end 为准
    const limited: any[] = [];
    let c2 = new Date(start);
    let g2 = 0;
    const e2 = end < to ? end : to;
    while (c2 <= e2 && g2 < 5000) {
      g2++;
      if (c2 >= from && c2 <= to) {
        limited.push({ ...task, occur_date: fmt(c2) });
      }
      if (task.repeat_type === 'daily') c2 = addDays(c2, 1);
      else if (task.repeat_type === 'weekly') c2 = addDays(c2, 7);
      else if (task.repeat_type === 'monthly') c2 = new Date(c2.getFullYear(), c2.getMonth() + 1, c2.getDate());
      else break;
    }
    return limited;
  }
  return occurrences;
}

// ============ 获取某日期范围内的任务（展开周期） ============
// 接口：GET /api/v1/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const fromStr = String(req.query.from || '');
    const toStr = String(req.query.to || '');
    const from = parseDate(fromStr);
    const to = parseDate(toStr);

    if (!from || !to || from > to) {
      return res.status(400).json({ error: '请输入有效的日期范围(from<=to)' });
    }

    const client = getSupabaseClient();
    const { data, error } = await client.from('calendar_tasks').select('*');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // 展开所有任务的实例并过滤到范围内
    const occurrences: any[] = [];
    (data || []).forEach((task: any) => {
      occurrences.push(...expandOccurrences(task, from, to));
    });

    occurrences.sort((a, b) => (a.occur_date < b.occur_date ? -1 : 1));

    res.json(occurrences);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 获取所有周期任务定义（供管理/编辑） ============
// 接口：GET /api/v1/calendar/tasks
router.get('/tasks', async (_req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('calendar_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 新建任务 ============
// 接口：POST /api/v1/calendar
router.post('/', async (req, res) => {
  try {
    const parsed = taskSchema.parse(req.body);
    const client = getSupabaseClient();

    const insertBody: any = {
      title: parsed.title,
      description: parsed.description || '',
      task_type: parsed.task_type,
      repeat_type: parsed.repeat_type,
      color: parsed.color,
      completed: parsed.completed || false,
    };
    if (parsed.task_type === 'repeat') {
      insertBody.start_date = parsed.start_date || '';
      insertBody.end_date = parsed.end_date || '';
      insertBody.task_date = null;
    } else {
      insertBody.task_date = parsed.task_date || '';
      insertBody.start_date = null;
      insertBody.end_date = null;
    }

    const { data, error } = await client.from('calendar_tasks').insert(insertBody).select().single();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ error: err.errors?.[0]?.message || '参数校验失败' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ============ 更新任务 ============
// 接口：PUT /api/v1/calendar/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = taskSchema.parse(req.body);
    const client = getSupabaseClient();

    const updateBody: any = {
      title: parsed.title,
      description: parsed.description || '',
      task_type: parsed.task_type,
      repeat_type: parsed.repeat_type,
      color: parsed.color,
      completed: parsed.completed || false,
    };
    if (parsed.task_type === 'repeat') {
      updateBody.start_date = parsed.start_date || '';
      updateBody.end_date = parsed.end_date || '';
      updateBody.task_date = null;
    } else {
      updateBody.task_date = parsed.task_date || '';
      updateBody.start_date = null;
      updateBody.end_date = null;
    }

    const { data, error } = await client
      .from('calendar_tasks')
      .update(updateBody)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ error: err.errors?.[0]?.message || '参数校验失败' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ============ 切换完成状态 ============
// 接口：PATCH /api/v1/calendar/:id/complete  body: { completed: boolean }
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const completed = Boolean(req.body?.completed);
    const { data, error } = await client
      .from('calendar_tasks')
      .update({ completed })
      .eq('id', parseInt(id))
      .select()
      .single();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============ 删除任务 ============
// 接口：DELETE /api/v1/calendar/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { error } = await client.from('calendar_tasks').delete().eq('id', parseInt(id));
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;