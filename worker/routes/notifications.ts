import { Hono } from 'hono';
import type { HonoBindings } from '../types';
import { getSupabaseAdmin } from '../lib/supabase';

const notificationsRoutes = new Hono<HonoBindings>();

let cachedNotifications: any[] = [];
let lastFetchedTime = 0;
const CACHE_TTL_MS = 15000;

notificationsRoutes.get('/', async (c) => {
  const now = Date.now();
  if (now - lastFetchedTime < CACHE_TTL_MS && cachedNotifications.length > 0) {
    return c.json(cachedNotifications);
  }

  try {
    const supabaseAdmin = getSupabaseAdmin(c.env);
    const fetchPromise = supabaseAdmin
      .from('app_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'Database timeout' } }), 4000)
    );

    const { data: notifications, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      if (cachedNotifications.length > 0) return c.json(cachedNotifications);
      if (
        error.code === '42P01' ||
        error.message?.includes('Could not find the table') ||
        error.message === 'Database timeout'
      ) {
        return c.json([]);
      }
      return c.json({ detail: error.message }, 400);
    }

    if (Array.isArray(notifications)) {
      cachedNotifications = notifications;
      lastFetchedTime = Date.now();
    }

    return c.json(cachedNotifications);
  } catch {
    return c.json(cachedNotifications || []);
  }
});

notificationsRoutes.delete('/', async (c) => {
  try {
    cachedNotifications = [];
    lastFetchedTime = Date.now();

    const supabaseAdmin = getSupabaseAdmin(c.env);
    const { error } = await supabaseAdmin
      .from('app_notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      if (error.code === '42P01' || error.message?.includes('Could not find the table')) {
        return c.json({ success: true, count: 0 });
      }
      return c.json({ detail: error.message }, 400);
    }

    return c.json({ success: true, message: 'Notifications cleared' });
  } catch (e: any) {
    return c.json({ detail: e.message }, 400);
  }
});

export default notificationsRoutes;
