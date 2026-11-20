import { Hono } from 'hono';
import type { HonoBindings } from '../types';
import { getSupabaseAdmin } from '../lib/supabase';
import { requireAdmin, requireAuth } from '../middleware/auth';

const storageRoutes = new Hono<HonoBindings>();

async function uploadToStorage(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  bucket: string,
  path: string,
  fileData: ArrayBuffer,
  mimetype: string
) {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, fileData, { contentType: mimetype, upsert: true });

  if (error) throw error;

  const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return publicUrlData.publicUrl;
}

storageRoutes.post('/avatar', requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return c.json({ detail: 'No file uploaded' }, 400);
    }

    const uploadedFile = file as File;
    const ext = uploadedFile.name.split('.').pop() || 'png';
    const user = c.get('user')!;
    const fileName = `${user.id}_${Date.now()}.${ext}`;

    const supabaseAdmin = getSupabaseAdmin(c.env);
    const buffer = await uploadedFile.arrayBuffer();
    const publicUrl = await uploadToStorage(
      supabaseAdmin,
      'avatars',
      fileName,
      buffer,
      uploadedFile.type || 'image/png'
    );

    await supabaseAdmin.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    return c.json({ publicUrl });
  } catch (err: any) {
    return c.json({ detail: err.message }, 500);
  }
});

storageRoutes.post('/post-images', requireAuth, requireAdmin, async (c) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll('files').filter((f): f is File => typeof f !== 'string');
    if (files.length === 0) {
      return c.json({ detail: 'No files uploaded' }, 400);
    }

    const supabaseAdmin = getSupabaseAdmin(c.env);
    const urls: string[] = [];
    for (const file of files.slice(0, 10)) {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `post_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const buffer = await file.arrayBuffer();
      const publicUrl = await uploadToStorage(
        supabaseAdmin,
        'post_images',
        fileName,
        buffer,
        file.type || 'image/png'
      );
      urls.push(publicUrl);
    }

    return c.json({ urls });
  } catch (err: any) {
    return c.json({ detail: err.message }, 500);
  }
});

export default storageRoutes;
