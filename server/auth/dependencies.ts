import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../database';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ detail: 'Token expired or invalid' });
    }
    
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    req.user = {
      ...user,
      role: profile?.role || user.user_metadata?.role || 'user'
    };

    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Token expired or invalid' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'អ្នកមិនមានសិទ្ធិអនុវត្តសកម្មភាពនេះទេ' });
  }
  next();
};
