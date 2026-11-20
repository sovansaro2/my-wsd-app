import { Hono } from 'hono';
import type { HonoBindings, WorkerEnv } from '../types';
import { getDirectAdminClient, getSupabaseAdmin } from '../lib/supabase';
import { requireAdmin, requireAuth } from '../middleware/auth';
import {
  sendWebPush,
  type StoredPushSubscription,
  type VapidConfig,
} from '../../shared/webPush';
import { buildUpcomingReminderPayloads } from '../../shared/calendarReminders';

const pushRoutes = new Hono<HonoBindings>();

function getVapidConfig(env: WorkerEnv): VapidConfig | null {
  const publicKey = (env.VAPID_PUBLIC_KEY || env.VITE_VAPID_PUBLIC_KEY || '').trim();
  const privateKey = (env.VAPID_PRIVATE_KEY || '').trim();
  const subject = (env.VAPID_SUBJECT || 'mailto:admin@watsnaydouch.site').trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

function isMissingTableError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    String(error.message || '').includes('Could not find the table') ||
    String(error.message || '').includes('does not exist')
  );
}

/**
 * Shared reminder dispatcher used by both Cloudflare Cron Trigger (`scheduled`)
 * and Admin manual trigger (`POST /api/push/send-reminders`).
 */
export async function dispatchScheduledReminders(env: WorkerEnv): Promise<{
  configured: boolean;
  sent: number;
  failed: number;
  removed: number;
  remindersCount: number;
  subscribersCount: number;
  message?: string;
}> {
  const vapid = getVapidConfig(env);
  if (!vapid) {
    return {
      configured: false,
      sent: 0,
      failed: 0,
      removed: 0,
      remindersCount: 0,
      subscribersCount: 0,
      message: 'VAPID keys not configured',
    };
  }

  const supabase = getSupabaseAdmin(env);

  // 1. Fetch active subscriptions
  const { data: subs, error: subErr } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, notify_seil, notify_events');

  if (subErr) {
    return {
      configured: true,
      sent: 0,
      failed: 0,
      removed: 0,
      remindersCount: 0,
      subscribersCount: 0,
      message: isMissingTableError(subErr) ? 'push_subscriptions table missing' : subErr.message,
    };
  }

  const subscribers = Array.isArray(subs) ? subs : [];
  if (subscribers.length === 0) {
    return {
      configured: true,
      sent: 0,
      failed: 0,
      removed: 0,
      remindersCount: 0,
      subscribersCount: 0,
    };
  }

  // 2. Fetch non-completed events
  const { data: eventsData } = await supabase
    .from('monastery_events')
    .select('id, title, event_type, event_date, event_time, location, is_completed')
    .eq('is_completed', false);

  const events = Array.isArray(eventsData) ? eventsData : [];

  // 3. Build today & tomorrow reminder payloads
  const seilPayloads = buildUpcomingReminderPayloads(events, {
    includeSeil: true,
    includeEvents: false,
  });
  const eventPayloads = buildUpcomingReminderPayloads(events, {
    includeSeil: false,
    includeEvents: true,
  });

  const totalReminders = seilPayloads.length + eventPayloads.length;
  if (totalReminders === 0) {
    return {
      configured: true,
      sent: 0,
      failed: 0,
      removed: 0,
      remindersCount: 0,
      subscribersCount: subscribers.length,
    };
  }

  let sent = 0;
  let failed = 0;
  const goneEndpoints = new Set<string>();

  for (const sub of subscribers) {
    if (!sub.endpoint || !sub.p256dh || !sub.auth) continue;

    const payloadsToSend = [
      ...(sub.notify_events !== false ? eventPayloads : []),
      ...(sub.notify_seil !== false ? seilPayloads : []),
    ];

    const target: StoredPushSubscription = {
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    };

    for (const payload of payloadsToSend) {
      const res = await sendWebPush(target, payload, vapid);
      if (res.ok) {
        sent++;
      } else {
        failed++;
        if (res.gone) {
          goneEndpoints.add(sub.endpoint);
          break;
        }
      }
    }
  }

  // Clean up expired subscriptions (404 / 410)
  for (const ep of goneEndpoints) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', ep);
  }

  return {
    configured: true,
    sent,
    failed,
    removed: goneEndpoints.size,
    remindersCount: totalReminders,
    subscribersCount: subscribers.length,
  };
}

// GET /api/push/config — returns public VAPID key (safe for client)
pushRoutes.get('/config', (c) => {
  const vapid = getVapidConfig(c.env);
  return c.json({
    enabled: Boolean(vapid),
    vapidPublicKey: vapid ? vapid.publicKey : null,
  });
});

// POST /api/push/subscribe — saves or updates a device's Web Push subscription
pushRoutes.post('/subscribe', async (c) => {
  try {
    const body = await c.req.json();
    const endpoint = String(body?.endpoint || '').trim();
    const p256dh = String(body?.keys?.p256dh || body?.p256dh || '').trim();
    const auth = String(body?.keys?.auth || body?.auth || '').trim();

    if (!endpoint || !p256dh || !auth) {
      return c.json({ detail: 'Invalid push subscription payload' }, 400);
    }

    const row = {
      endpoint,
      p256dh,
      auth,
      user_id: body?.user_id || null,
      device_label: String(body?.device_label || '').slice(0, 120) || null,
      notify_seil: body?.notify_seil !== false,
      notify_events: body?.notify_events !== false,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin(c.env);
    let { error } = await supabase
      .from('push_subscriptions')
      .upsert(row, { onConflict: 'endpoint' });

    if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
      const retry = await getDirectAdminClient(c.env)
        .from('push_subscriptions')
        .upsert(row, { onConflict: 'endpoint' });
      error = retry.error;
    }

    if (error) {
      if (isMissingTableError(error)) {
        return c.json({ success: true, stored: false, tableMissing: true });
      }
      return c.json({ detail: error.message }, 400);
    }

    return c.json({ success: true, stored: true });
  } catch (e: any) {
    return c.json({ detail: e?.message || 'Subscribe failed' }, 400);
  }
});

// POST /api/push/unsubscribe — removes a device's Web Push subscription
pushRoutes.post('/unsubscribe', async (c) => {
  try {
    const body = await c.req.json();
    const endpoint = String(body?.endpoint || '').trim();
    if (!endpoint) {
      return c.json({ success: true });
    }

    const supabase = getSupabaseAdmin(c.env);
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error && !isMissingTableError(error)) {
      return c.json({ detail: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ detail: e?.message || 'Unsubscribe failed' }, 400);
  }
});

// POST /api/push/test — sends a single test push to the requesting device
pushRoutes.post('/test', async (c) => {
  const vapid = getVapidConfig(c.env);
  if (!vapid) {
    return c.json({ detail: 'VAPID keys not configured on server', configured: false }, 503);
  }

  try {
    const body = await c.req.json();
    const endpoint = String(body?.endpoint || '').trim();
    const p256dh = String(body?.keys?.p256dh || body?.p256dh || '').trim();
    const auth = String(body?.keys?.auth || body?.auth || '').trim();

    if (!endpoint || !p256dh || !auth) {
      return c.json({ detail: 'Missing subscription credentials' }, 400);
    }

    const result = await sendWebPush(
      { endpoint, p256dh, auth },
      {
        title: 'វត្តស្នាយដួច · សាកល្បងការជូនដំណឹង',
        body: 'ប្រព័ន្ធរំលឹកថ្ងៃសីល និងថ្ងៃបុណ្យលើ Lock Screen ដំណើរការបានល្អ!',
        tag: 'wsd-push-test',
        url: '/?open=calendar',
      },
      vapid
    );

    if (!result.ok) {
      return c.json({ detail: result.error || 'Failed to send test push', status: result.status }, 502);
    }

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ detail: e?.message || 'Test push failed' }, 400);
  }
});

// POST /api/push/send-reminders — Admin manual trigger to send today/tomorrow reminders
pushRoutes.post('/send-reminders', requireAuth, requireAdmin, async (c) => {
  const summary = await dispatchScheduledReminders(c.env);
  return c.json(summary);
});

export default pushRoutes;
