import { Hono } from 'hono';
import type { HonoBindings } from '../types';
import { getSupabaseAdmin } from '../lib/supabase';
import { requireAdmin, requireAuth } from '../middleware/auth';

const profilesRoutes = new Hono<HonoBindings>();

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateUserCodeFromDob(dob: string | null | undefined): string | null {
  if (!dob || typeof dob !== 'string' || dob.trim() === '') return null;
  const clean = dob.trim();
  let day = '';
  let month = '';
  let yearTail = '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-');
    day = d.padStart(2, '0');
    month = m.padStart(2, '0');
    yearTail = y.slice(-1);
  } else if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(clean)) {
    const parts = clean.split(/[/-]/);
    day = parts[0].padStart(2, '0');
    month = parts[1].padStart(2, '0');
    yearTail = parts[2].slice(-1);
  } else {
    const dateObj = new Date(clean);
    if (!isNaN(dateObj.getTime())) {
      day = String(dateObj.getDate()).padStart(2, '0');
      month = String(dateObj.getMonth() + 1).padStart(2, '0');
      yearTail = String(dateObj.getFullYear()).slice(-1);
    }
  }

  if (day && month && yearTail) {
    return `WSD-${day}${month}-${yearTail}`;
  }
  return null;
}

profilesRoutes.get('/', requireAuth, requireAdmin, async (c) => {
  const supabaseAdmin = getSupabaseAdmin(c.env);
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, user_code, family_name, given_name, full_name, latin_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at'
    )
    .order('created_at', { ascending: false });

  if (error && (error.message?.includes('user_code') || error.message?.includes('latin_name'))) {
    const fallback: any = await supabaseAdmin
      .from('profiles')
      .select(
        'id, family_name, given_name, full_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at'
      )
      .order('created_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) return c.json({ detail: error.message }, 400);

  const profilesWithCode = (data || []).map((p: any) => ({
    ...p,
    user_code:
      p.user_code ||
      generateUserCodeFromDob(p.date_of_birth) ||
      `WSD-${p.id ? p.id.replace(/-/g, '').substring(0, 4).toUpperCase() : '0810'}`,
  }));

  return c.json(profilesWithCode);
});

profilesRoutes.put('/:id/role', requireAuth, requireAdmin, async (c) => {
  const id = c.req.param('id');
  const { role } = await c.req.json();
  if (!['admin', 'user'].includes(role)) {
    return c.json({ detail: 'Invalid role' }, 400);
  }

  const supabaseAdmin = getSupabaseAdmin(c.env);
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select(
      'id, email, full_name, role, avatar_url, created_at, family_name, given_name, date_of_birth, gender, address, phone_number'
    )
    .single();

  if (error) return c.json({ detail: error.message }, 400);

  try {
    await supabaseAdmin.auth.admin.updateUserById(String(id), {
      user_metadata: { role },
    });
  } catch (authErr) {
    console.warn('Could not update user_metadata in auth:', authErr);
  }

  return c.json(data);
});

profilesRoutes.put('/:id/reset-password', requireAuth, requireAdmin, async (c) => {
  const id = c.req.param('id');
  const { password } = await c.req.json();
  if (!password || password.length < 6) {
    return c.json({ detail: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ' }, 400);
  }

  const supabaseAdmin = getSupabaseAdmin(c.env);
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(String(id), {
    password,
  });

  if (authError) return c.json({ detail: authError.message }, 400);
  return c.json({ success: true, message: 'ពាក្យសម្ងាត់ត្រូវបានកែប្រែដោយជោគជ័យ' });
});

profilesRoutes.get('/me', requireAuth, async (c) => {
  const user = c.get('user')!;
  const supabaseAdmin = getSupabaseAdmin(c.env);
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, user_code, family_name, given_name, full_name, latin_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at'
    )
    .eq('id', user.id)
    .maybeSingle();

  if (error && (error.message?.includes('user_code') || error.message?.includes('latin_name'))) {
    const fallback: any = await supabaseAdmin
      .from('profiles')
      .select(
        'id, family_name, given_name, full_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at'
      )
      .eq('id', user.id)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) return c.json({ detail: error.message }, 400);

  const userCode =
    data?.user_code ||
    generateUserCodeFromDob(data?.date_of_birth) ||
    user.user_metadata?.user_code ||
    'WSD-0810';
  const latinName = data?.latin_name || user.user_metadata?.latin_name || null;

  if (!data) {
    return c.json({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      latin_name: latinName,
      role: user.role || 'user',
      avatar_url: null,
      user_code: userCode,
      has_balance_pin: !!user.user_metadata?.balance_pin_hash,
    });
  }

  return c.json({
    ...data,
    latin_name: latinName,
    user_code: userCode,
    has_balance_pin: !!user.user_metadata?.balance_pin_hash,
  });
});

profilesRoutes.put('/me', requireAuth, async (c) => {
  const user = c.get('user')!;
  const updates: Record<string, any> = await c.req.json();
  const supabaseAdmin = getSupabaseAdmin(c.env);

  if (updates.password) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: updates.password,
    });
    if (authError) return c.json({ detail: authError.message }, 400);
    delete updates.password;
  }

  if (updates.email && updates.email.trim() !== '' && updates.email !== user.email) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: updates.email.trim(),
      email_confirm: true,
    });
    if (authError) return c.json({ detail: authError.message }, 400);
  }

  if (updates.date_of_birth !== undefined) {
    if (!updates.date_of_birth || typeof updates.date_of_birth !== 'string' || updates.date_of_birth.trim() === '') {
      updates.date_of_birth = null;
    } else {
      const trimmedDate = updates.date_of_birth.trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedDate)) {
        const [d, m, y] = trimmedDate.split('/');
        updates.date_of_birth = `${y}-${m}-${d}`;
      }
      const generatedCode = generateUserCodeFromDob(updates.date_of_birth);
      if (generatedCode) updates.user_code = generatedCode;
    }
  }

  if (updates.user_code || updates.latin_name !== undefined) {
    try {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          ...(updates.user_code ? { user_code: updates.user_code } : {}),
          ...(updates.latin_name !== undefined ? { latin_name: updates.latin_name } : {}),
        },
      });
    } catch (err) {
      console.warn('Could not update user metadata:', err);
    }
  }

  if (updates.family_name !== undefined && updates.family_name.trim() === '') updates.family_name = null;
  if (updates.given_name !== undefined && updates.given_name.trim() === '') updates.given_name = null;
  if (updates.latin_name !== undefined && updates.latin_name.trim() === '') updates.latin_name = null;
  if (updates.address !== undefined && updates.address.trim() === '') updates.address = null;
  if (updates.phone_number !== undefined && updates.phone_number.trim() === '') updates.phone_number = null;

  if (updates.gender) {
    if (updates.gender === 'ប្រុស' || updates.gender === 'Male') updates.gender = 'Male';
    else if (updates.gender === 'ស្រី' || updates.gender === 'Female') updates.gender = 'Female';
    else if (updates.gender === 'ផ្សេងទៀត' || updates.gender === 'Other') updates.gender = 'Other';
    else updates.gender = 'Male';
  }

  if (!updates.full_name || updates.full_name.trim() === '') {
    const combined = [updates.family_name, updates.given_name].filter(Boolean).join(' ');
    if (combined) updates.full_name = combined;
  }

  let { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: user.id, email: user.email, ...updates })
    .select(
      'id, user_code, family_name, given_name, full_name, latin_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at'
    )
    .single();

  if (error && (error.message?.includes('user_code') || error.message?.includes('latin_name'))) {
    const { user_code, latin_name, ...updatesWithoutCode } = updates;
    const fallback: any = await supabaseAdmin
      .from('profiles')
      .upsert({ id: user.id, email: user.email, ...updatesWithoutCode })
      .select(
        'id, family_name, given_name, full_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at'
      )
      .single();
    data = fallback.data;
    error = fallback.error;
    if (data) {
      data.user_code = updates.user_code || generateUserCodeFromDob(data.date_of_birth) || 'WSD-0810';
      data.latin_name = updates.latin_name || null;
    }
  }

  if (error) return c.json({ detail: error.message }, 400);

  if (updates.full_name) {
    await supabaseAdmin.from('posts').update({ author_name: updates.full_name }).eq('author_id', user.id);
  }

  return c.json({
    ...data,
    latin_name: data?.latin_name || updates.latin_name || null,
    user_code: data?.user_code || updates.user_code || generateUserCodeFromDob(data?.date_of_birth) || 'WSD-0810',
  });
});

profilesRoutes.post('/me/verify-pin', requireAuth, async (c) => {
  const user = c.get('user')!;
  const { pin } = await c.req.json();
  if (!pin) return c.json({ detail: 'PIN is required' }, 400);

  const currentHash = user.user_metadata?.balance_pin_hash;
  if (!currentHash) return c.json({ detail: 'PIN is not configured' }, 400);

  const hashedPin = await sha256Hex(`${user.id}:${pin}`);
  if (hashedPin === currentHash) {
    return c.json({ success: true });
  }
  return c.json({ detail: 'PIN មិនត្រឹមត្រូវ' }, 400);
});

profilesRoutes.put('/me/balance-pin', requireAuth, async (c) => {
  const user = c.get('user')!;
  const { current_pin, new_pin } = await c.req.json();
  const currentHash = user.user_metadata?.balance_pin_hash;

  if (currentHash) {
    if (!current_pin) return c.json({ detail: 'Current PIN is required' }, 400);
    const hashedCurrent = await sha256Hex(`${user.id}:${current_pin}`);
    if (hashedCurrent !== currentHash) {
      return c.json({ detail: 'PIN បច្ចុប្បន្នមិនត្រឹមត្រូវ' }, 400);
    }
  }

  if (!new_pin || new_pin.length !== 4) {
    return c.json({ detail: 'PIN ថ្មីត្រូវមាន ៤ ខ្ទង់' }, 400);
  }

  const hashedNewPin = await sha256Hex(`${user.id}:${new_pin}`);
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, balance_pin_hash: hashedNewPin },
  });

  if (authError) return c.json({ detail: authError.message }, 400);
  return c.json({ success: true });
});

profilesRoutes.put('/me/reset-balance-pin', requireAuth, async (c) => {
  const user = c.get('user')!;
  const { password, new_pin } = await c.req.json();
  if (!password) return c.json({ detail: 'Password is required' }, 400);
  if (!new_pin || new_pin.length !== 4) return c.json({ detail: 'PIN ថ្មីត្រូវមាន ៤ ខ្ទង់' }, 400);

  const supabaseAdmin = getSupabaseAdmin(c.env);
  const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (signInError) return c.json({ detail: 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវ' }, 400);

  const hashedNewPin = await sha256Hex(`${user.id}:${new_pin}`);
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, balance_pin_hash: hashedNewPin },
  });

  if (authError) return c.json({ detail: authError.message }, 400);
  return c.json({ success: true });
});

export default profilesRoutes;
