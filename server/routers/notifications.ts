import { Router } from 'express';
import { supabaseAdmin } from '../database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data: notifications, error } = await supabaseAdmin
      .from('app_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // Fallback if table doesn't exist yet so it doesn't break
      if (error.code === '42P01' || error.message?.includes('Could not find the table')) {
        return res.json([]);
      }
      return res.status(400).json({ detail: error.message });
    }

    res.json(notifications);
  } catch (e: any) {
    res.status(400).json({ detail: e.message });
  }
});

export default router;
