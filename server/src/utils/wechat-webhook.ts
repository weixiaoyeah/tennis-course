import dayjs from 'dayjs';
import { loadEnv } from '../storage/database/supabase-client';

/**
 * 企业微信群机器人 Webhook 推送模块
 * 说明：无需接收方为企业微信成员，把消息推到一个普通「微信群」，
 * 群成员用个人微信即可看到。使用前需在 server 环境变量配置：
 *  WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxx
 */

function getWebhookUrl(): string | undefined {
  loadEnv();
  const url = process.env.WECHAT_WEBHOOK_URL;
  return url && url.trim() ? url.trim() : undefined;
}

interface WecomPayload {
  msgtype: string;
  [key: string]: unknown;
}

async function send(payload: WecomPayload): Promise<boolean> {
  const url = getWebhookUrl();
  if (!url) {
    console.log('[wechat] WECHAT_WEBHOOK_URL 未配置，跳过推送');
    return false;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data: any = await res.json().catch(() => ({}));
    if (data.errcode !== 0) {
      console.error('[wechat] webhook 返回错误:', JSON.stringify(data));
      return false;
    }
    return true;
  } catch (e: any) {
    console.error('[wechat] webhook 发送失败:', e.message);
    return false;
  }
}

/** 发送纯文本消息（可 @ 指定企微成员 userid） */
export async function sendText(content: string, mentionedList?: string[]): Promise<boolean> {
  const payload: WecomPayload = { msgtype: 'text', text: { content } };
  if (mentionedList && mentionedList.length > 0) {
    (payload.text as any).mentioned_list = mentionedList;
  }
  return send(payload);
}

/** 发送 markdown 消息（支持加粗、<font color> 等基础语法） */
export async function sendMarkdown(content: string): Promise<boolean> {
  return send({ msgtype: 'markdown', markdown: { content } });
}

export interface ConfirmedLessonPayload {
  teacherName?: string;
  courseName?: string;
  scheduleDate?: string; // 如 2026-10-15
  scheduleTime?: string; // 如 10:00-12:00
  duration?: number;
  confirmedBy?: string; // coach | student
  attended: boolean; // 是否已上课
}

/**
 * 推送「课程确认」结果通知
 */
export async function sendConfirmedLesson(payload: ConfirmedLessonPayload): Promise<boolean> {
  const {
    teacherName = '-',
    courseName = '-',
    scheduleDate = '-',
    scheduleTime = '-',
    duration = 0,
    confirmedBy = '',
    attended,
  } = payload;

  const timeText = `${scheduleDate || '-'} ${scheduleTime || ''}`.trim();
  // 确认人展示文本
  let confirmer = '-';
  if (confirmedBy === 'coach') confirmer = '教练';
  else if (confirmedBy === 'student') confirmer = '学生';

  const lines: string[] = [];
  lines.push(`**🎾 上课确认通知**`);
  lines.push(`> 课程：${courseName}`);
  lines.push(`> 教练：${teacherName}`);
  lines.push(`> 时间：${timeText}`);
  lines.push(`> 课时：${duration} 课时`);
  lines.push(`> 结果：${
    attended
      ? `<font color="info">已上课 ✅</font>`
      : `<font color="warning">未上课（不扣课时）</font>`
  }`);
  if (confirmer !== '-') {
    lines.push(`> 确认人：${confirmer}`);
  }
  if (attended) {
    lines.push(`> 本次已扣除 ` + `<font color="warning">${duration}</font>` + ` 课时，可从课程包内核对剩余课时。`);
  }
  lines.push(dayjs().format('YYYY-MM-DD HH:mm'));

  return sendMarkdown(lines.join('\n'));
}