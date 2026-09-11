import { Router } from 'express';
import { SignupSchema, LoginSchema } from './schemas';
import { supabaseAdmin, createAuthClient } from '../database';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const data = SignupSchema.parse(req.body);
    
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        latin_name: data.latin_name || null,
        role: 'user'
      }
    });

    if (signUpError) {
      const authClient = createAuthClient();
      const { data: fallbackData, error: fallbackError } = await authClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            latin_name: data.latin_name || null,
            role: 'user'
          }
        }
      });
      if (fallbackError) throw fallbackError;

      if (fallbackData?.user) {
        try {
          await supabaseAdmin.from('profiles').upsert({
            id: fallbackData.user.id,
            full_name: data.full_name,
            latin_name: data.latin_name || null,
            email: data.email,
            role: 'user'
          });
        } catch (err) {
          console.warn('Profile upsert fallback error:', err);
        }
      }
      return res.json({ success: true, user: fallbackData.user });
    }

    if (authData?.user) {
      try {
        await supabaseAdmin.from('profiles').upsert({
          id: authData.user.id,
          full_name: data.full_name,
          latin_name: data.latin_name || null,
          email: data.email,
          role: 'user'
        });
      } catch (err) {
        console.warn('Profile upsert error:', err);
      }
    }
    
    res.json({ success: true, user: authData.user });
  } catch (e: any) {
    res.status(400).json({ detail: e.message || 'Error signing up' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const authClient = createAuthClient();
    const { data: authData, error } = await authClient.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup'
    });
    
    if (error || !authData.session) {
      console.error('verifyOtp error:', error);
      return res.status(401).json({ detail: 'លេខកូដមិនត្រឹមត្រូវ ឬផុតកំណត់។' });
    }
    
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    res.json({ 
       access_token: authData.session.access_token, 
       refresh_token: authData.session.refresh_token,
       token_type: 'bearer',
       user: profile || authData.user 
    });
  } catch (e: any) {
    res.status(400).json({ detail: e.message || 'Error verifying OTP' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = LoginSchema.parse(req.body);
    
    const authClient = createAuthClient();
    const { data: authData, error: signInError } = await authClient.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError || !authData.session) {
      console.error('signInError', signInError);
      return res.status(401).json({ detail: 'អុីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    res.json({ 
      access_token: authData.session.access_token, 
      refresh_token: authData.session.refresh_token,
      token_type: 'bearer',
      user: profile || authData.user
    });
  } catch (e: any) {
    res.status(400).json({ detail: e.message || 'Error logging in' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.body?.refresh_token || req.headers['x-refresh-token'];
    if (!refreshToken) {
      return res.status(400).json({ detail: 'Missing refresh token' });
    }

    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.refreshSession({ refresh_token: String(refreshToken) });
    if (error || !data.session) {
      return res.status(401).json({ detail: 'Session expired or invalid refresh token' });
    }

    const userId = data.user?.id || data.session.user?.id;
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: 'bearer',
      user: profile || data.user || data.session.user
    });
  } catch (e: any) {
    res.status(401).json({ detail: e.message || 'Error refreshing session' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ detail: 'Unauthorized: No token provided' });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ detail: 'Unauthorized: Token expired or invalid' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && (profileError as any).code !== 'PGRST116') {
      console.warn('Profile fetch note:', profileError.message);
    }

    res.json({
      ...(profile || { id: user.id, email: user.email, role: 'user' }),
      has_balance_pin: !!user.user_metadata?.balance_pin_hash
    });
  } catch (e: any) {
    res.status(401).json({ detail: e.message || 'Unauthorized' });
  }
});

export default router;

router.post('/verify-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ detail: 'Unauthorized' });

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }
    
    const { password } = req.body;
    if (!password) return res.status(400).json({ detail: 'Password required' });

    const authClient = createAuthClient();
    const { data, error: signInError } = await authClient.auth.signInWithPassword({
      email: user.email!,
      password
    });

    if (signInError) {
      return res.status(400).json({ detail: 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវ' });
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ detail: e.message || 'Error verifying password' });
  }
});
