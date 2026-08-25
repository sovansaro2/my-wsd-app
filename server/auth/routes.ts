import { Router } from 'express';
import { SignupSchema, LoginSchema } from './schemas';
import { supabaseAdmin} from '../database';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const data = SignupSchema.parse(req.body);
    
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          phone_number: data.phone_number,
          role: 'user'
        }
      }
    });

    if (signUpError) { throw signUpError; }
    
    res.json({ success: true, user: authData.user });
  } catch (e: any) {
    res.status(400).json({ detail: e.message || 'Error signing up' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const { data: authData, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup'
    });
    
    if (error || !authData.session) {
      console.error('verifyOtp error:', error);
      return res.status(401).json({ detail: 'លេខកូដមិនត្រឹមត្រូវ ឬផុតកំណត់។' });
    }
    
    // Fetch profile to get role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    res.json({ 
       access_token: authData.session.access_token, 
       token_type: 'bearer',
       user: profile || authData.user 
    });
  } catch (e: any) {
    res.status(400).json({ detail: e.message || 'Error verifying OTP' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const data = LoginSchema.parse(req.body);
    
    const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError || !authData.session) {
      console.error('signInError', signInError);
      return res.status(401).json({ detail: 'អុីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ' });
    }

    // Fetch profile to get role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    res.json({ 
      access_token: authData.session.access_token, 
      token_type: 'bearer',
      user: profile || authData.user
    });
  } catch (e: any) {
    res.status(400).json({ detail: e.message || 'Error logging in' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ detail: 'Unauthorized' });

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ detail: 'Unauthorized: Token expired or invalid' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    res.json({
      ...(profile || { id: user.id, email: user.email, role: 'user' }),
      has_balance_pin: !!user.user_metadata?.balance_pin_hash
    });
  } catch (e: any) {
    console.error("GET /me error:", e);
    res.status(401).json({ detail: e.message || 'Unauthorized' });
  }
});

export default router;


// POST /api/auth/verify-password
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

    // Verify password by attempting to sign in
    const { data, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
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
