import { Router } from 'express';
import { supabaseAdmin } from '../database';

const router = Router();

// In-memory cache for ultra-fast response (<5ms)
let cachedNotifications: any[] = [];
let lastFetchedTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

export const invalidateNotificationsCache = () => {
  lastFetchedTime = 0;
};

export const appendCachedNotification = (notif: any) => {
  cachedNotifications = [notif, ...cachedNotifications.slice(0, 19)];
  lastFetchedTime = Date.now();
};

router.get('/', async (req, res) => {
  const now = Date.now();

  // Return cached data immediately if still fresh
  if (now - lastFetchedTime < CACHE_TTL_MS && cachedNotifications.length > 0) {
    return res.json(cachedNotifications);
  }

  try {
    // 4-second hard timeout for Supabase call so it never hangs the HTTP response
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
      // If error or timeout, return existing cache or empty array gracefully
      if (cachedNotifications.length > 0) {
        return res.json(cachedNotifications);
      }
      if (error.code === '42P01' || error.message?.includes('Could not find the table') || error.message === 'Database timeout') {
        return res.json([]);
      }
      return res.status(400).json({ detail: error.message });
    }

    if (Array.isArray(notifications)) {
      cachedNotifications = notifications;
      lastFetchedTime = Date.now();
    }

    res.json(cachedNotifications);
  } catch (e: any) {
    // Fallback to cache or empty list
    res.json(cachedNotifications || []);
  }
});

router.delete('/', async (req, res) => {
  try {
    cachedNotifications = [];
    lastFetchedTime = Date.now();

    const { error } = await supabaseAdmin
      .from('app_notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      if (error.code === '42P01' || error.message?.includes('Could not find the table')) {
        return res.json({ success: true, count: 0 });
      }
      return res.status(400).json({ detail: error.message });
    }

    res.json({ success: true, message: 'Notifications cleared' });
  } catch (e: any) {
    res.status(400).json({ detail: e.message });
  }
});

export default router;
