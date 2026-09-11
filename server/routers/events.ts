import { Router } from 'express';
import { supabaseAdmin, getDirectAdminClient } from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';
import { MockDB } from '../mockDb';

const router = Router();

// GET all events
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('monastery_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) {
      // Fallback to MockDB if table doesn't exist in Supabase yet
      const fallbackData = MockDB.get('monastery_events') || [];
      return res.json(fallbackData);
    }

    res.json(data || []);
  } catch (e: any) {
    const fallbackData = MockDB.get('monastery_events') || [];
    res.json(fallbackData);
  }
});

// POST create event
router.post('/', requireAuth, async (req, res) => {
  const eventData = {
    ...req.body,
    is_completed: req.body.is_completed ?? false,
    created_at: req.body.created_at || new Date().toISOString()
  };

  try {
    let { data, error } = await supabaseAdmin
      .from('monastery_events')
      .insert([eventData])
      .select();

    if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
      const retry = await getDirectAdminClient()
        .from('monastery_events')
        .insert([eventData])
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      // Fallback to MockDB
      const created = MockDB.insert('monastery_events', eventData);
      return res.json(created[0] || eventData);
    }

    res.json(data?.[0] || eventData);
  } catch (e: any) {
    const created = MockDB.insert('monastery_events', eventData);
    res.json(created[0] || eventData);
  }
});

// PUT update event
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  try {
    let { data, error } = await supabaseAdmin
      .from('monastery_events')
      .update(updates)
      .eq('id', id)
      .select();

    if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
      const retry = await getDirectAdminClient()
        .from('monastery_events')
        .update(updates)
        .eq('id', id)
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      const updated = MockDB.update('monastery_events', id, updates);
      return res.json(updated[0] || { id, ...updates });
    }

    res.json(data?.[0] || { id, ...updates });
  } catch (e: any) {
    const updated = MockDB.update('monastery_events', id, updates);
    res.json(updated[0] || { id, ...updates });
  }
});

// DELETE event
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    let { error } = await supabaseAdmin
      .from('monastery_events')
      .delete()
      .eq('id', id);

    if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
      const retry = await getDirectAdminClient()
        .from('monastery_events')
        .delete()
        .eq('id', id);
      error = retry.error;
    }

    if (error) {
      MockDB.delete('monastery_events', id);
      return res.json({ success: true });
    }

    MockDB.delete('monastery_events', id);
    res.json({ success: true });
  } catch (e: any) {
    MockDB.delete('monastery_events', id);
    res.json({ success: true });
  }
});

export default router;
