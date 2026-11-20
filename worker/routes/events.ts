import { Hono } from 'hono';
import type { HonoBindings } from '../types';
import { getDirectAdminClient, getSupabaseAdmin } from '../lib/supabase';
import { requireAdmin, requireAuth } from '../middleware/auth';

const eventsRoutes = new Hono<HonoBindings>();

eventsRoutes.get('/', async (c) => {
  try {
    const supabaseAdmin = getSupabaseAdmin(c.env);
    const { data, error } = await supabaseAdmin
      .from('monastery_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) return c.json([]);
    return c.json(data || []);
  } catch {
    return c.json([]);
  }
});

eventsRoutes.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  const eventData = {
    ...body,
    is_completed: body.is_completed ?? false,
    created_at: body.created_at || new Date().toISOString(),
  };

  try {
    const supabaseAdmin = getSupabaseAdmin(c.env);
    let { data, error } = await supabaseAdmin.from('monastery_events').insert([eventData]).select();

    if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
      const retry = await getDirectAdminClient(c.env)
        .from('monastery_events')
        .insert([eventData])
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) return c.json({ detail: error.message }, 400);
    return c.json(data?.[0] || eventData);
  } catch (e: any) {
    return c.json({ detail: e.message }, 400);
  }
});

eventsRoutes.put('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updates = {
    ...body,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabaseAdmin = getSupabaseAdmin(c.env);
    let { data, error } = await supabaseAdmin
      .from('monastery_events')
      .update(updates)
      .eq('id', id)
      .select();

    if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
      const retry = await getDirectAdminClient(c.env)
        .from('monastery_events')
        .update(updates)
        .eq('id', id)
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) return c.json({ detail: error.message }, 400);
    return c.json(data?.[0] || { id, ...updates });
  } catch (e: any) {
    return c.json({ detail: e.message }, 400);
  }
});

eventsRoutes.delete('/:id', requireAuth, requireAdmin, async (c) => {
  const id = c.req.param('id');
  try {
    const supabaseAdmin = getSupabaseAdmin(c.env);
    let { error } = await supabaseAdmin.from('monastery_events').delete().eq('id', id);

    if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
      const retry = await getDirectAdminClient(c.env).from('monastery_events').delete().eq('id', id);
      error = retry.error;
    }

    if (error) return c.json({ detail: error.message }, 400);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ detail: e.message }, 400);
  }
});

export default eventsRoutes;
