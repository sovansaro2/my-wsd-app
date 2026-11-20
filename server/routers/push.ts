import { Router } from 'express';
import { supabaseAdmin, getDirectAdminClient } from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';
import {
  sendWebPush,
  type StoredPushSubscription,
  type VapidConfig,
} from '../../shared/webPush';
import { buildUpcomingReminderPayloads } from '../../shared/calendarReminders';

const router = Router();

function getVapidConfig(): VapidConfig | null {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || '').trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  const subject = (process.env.VAPID_SUBJECT || 'mailto:admin@watsnaydouch.site').trim();
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

router.get('/config', (_req, res) => {
  const vapid = getVapidConfig();
  res.json({
    enabled: Boolean(vapid),
    vapidPublicKey: vapid ? vapid.publicKey : null,
  });
});

router.post('/subscribe', async (req, res) => {
  try {
    const endpoint = String(req.body?.endpoint || '').trim();
    const p256dh = String(req.body?.keys?.p256dh || req.body?.p256dh || '').trim();
    const auth = String(req.body?.keys?.auth || req.body?.auth || '').trim();

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ detail: 'Invalid push subscription payload' });
    }

    const row = {
      endpoint,
      p256dh,
      auth,
      user_id: req.body?.user_id || null,
      device_label: String(req.body?.device_label || '').slice(0, 120) || null,
      notify_seil: req.body?.notify_seil !== false,
      notify_events: req.body?.notify_events !== false,
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(row, { onConflict: 'endpoint' });

    if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
      const retry = await getDirectAdminClient()
        .from('push_subscriptions')
        .upsert(row, { onConflict: 'endpoint' });
      error = retry.error;
    }

    if (error) {
      if (isMissingTableError(error)) {
        return res.json({ success: true, stored: false, tableMissing: true });
      }
      return res.status(400).json({ detail: error.message });
    }

    res.json({ success: true, stored: true });
  } catch (e: any) {
    res.status(400).json({ detail: e?.message || 'Subscribe failed' });
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    const endpoint = String(req.body?.endpoint || '').trim();
    if (!endpoint) return res.json({ success: true });

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error && !isMissingTableError(error)) {
      return res.status(400).json({ detail: error.message });
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ detail: e?.message || 'Unsubscribe failed' });
  }
});

router.post('/test', async (req, res) => {
  const vapid = getVapidConfig();
  if (!vapid) {
    return res.status(503).json({ detail: 'VAPID keys not configured on server', configured: false });
  }

  try {
    const endpoint = String(req.body?.endpoint || '').trim();
    const p256dh = String(req.body?.keys?.p256dh || req.body?.p256dh || '').trim();
    const auth = String(req.body?.keys?.auth || req.body?.auth || '').trim();

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ detail: 'Missing subscription credentials' });
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
      return res.status(502).json({ detail: result.error || 'Failed to send test push', status: result.status });
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ detail: e?.message || 'Test push failed' });
  }
});

router.post('/send-reminders', requireAuth, requireAdmin, async (_req, res) => {
  const vapid = getVapidConfig();
  if (!vapid) {
    return res.json({
      configured: false,
      sent: 0,
      failed: 0,
      removed: 0,
      remindersCount: 0,
      subscribersCount: 0,
      message: 'VAPID keys not configured',
    });
  }

  const { data: subs, error: subErr } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, notify_seil, notify_events');

  if (subErr) {
    return res.json({
      configured: true,
      sent: 0,
      failed: 0,
      removed: 0,
      remindersCount: 0,
      subscribersCount: 0,
      message: isMissingTableError(subErr) ? 'push_subscriptions table missing' : subErr.message,
    });
  }

  const subscribers = Array.isArray(subs) ? subs : [];
  const { data: eventsData } = await supabaseAdmin
    .from('monastery_events')
    .select('id, title, event_type, event_date, event_time, location, is_completed')
    .eq('is_completed', false);

  const events = Array.isArray(eventsData) ? eventsData : [];
  const seilPayloads = buildUpcomingReminderPayloads(events, { includeSeil: true, includeEvents: false });
  const eventPayloads = buildUpcomingReminderPayloads(events, { includeSeil: false, includeEvents: true });

  let sent = 0;
  let failed = 0;
  const goneEndpoints = new Set<string>();

  for (const sub of subscribers) {
    if (!sub.endpoint || !sub.p256dh || !sub.auth) continue;
    const payloads = [
      ...(sub.notify_events !== false ? eventPayloads : []),
      ...(sub.notify_seil !== false ? seilPayloads : []),
    ];
    const target: StoredPushSubscription = {
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    };

    for (const payload of payloads) {
      const r = await sendWebPush(target, payload, vapid);
      if (r.ok) sent++;
      else {
        failed++;
        if (r.gone) {
          goneEndpoints.add(sub.endpoint);
          break;
        }
      }
    }
  }

  for (const ep of goneEndpoints) {
    await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', ep);
  }

  res.json({
    configured: true,
    sent,
    failed,
    removed: goneEndpoints.size,
    remindersCount: seilPayloads.length + eventPayloads.length,
    subscribersCount: subscribers.length,
  });
});

export default router;
