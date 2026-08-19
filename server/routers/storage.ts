import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin, getAuthClient } from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to upload buffer to Supabase Storage
async function uploadToStorage(bucket: string, path: string, fileBuffer: Buffer, mimetype: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, fileBuffer, { contentType: mimetype, upsert: true });

  if (error) throw error;
  
  const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return publicUrlData.publicUrl;
}

// POST /api/upload/avatar
router.post('/avatar', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ detail: 'No file uploaded' });
    
    const ext = req.file.originalname.split('.').pop();
    const fileName = `${req.user!.id}_${Date.now()}.${ext}`;
    
    const publicUrl = await uploadToStorage('avatars', fileName, req.file.buffer, req.file.mimetype);
    
    // Update profile automatically
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: req.user!.id, email: req.user!.email, avatar_url: publicUrl });
    
    res.json({ publicUrl });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/upload/post-images
router.post('/post-images', requireAuth, requireAdmin, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ detail: 'No files uploaded' });
    }
    
    const urls = [];
    for (const file of req.files) {
      const ext = file.originalname.split('.').pop();
      const fileName = `post_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const publicUrl = await uploadToStorage('post_images', fileName, file.buffer, file.mimetype);
      urls.push(publicUrl);
    }
    
    res.json({ urls });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

export default router;
