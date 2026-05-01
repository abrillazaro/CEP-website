import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { name, email, password, invite_code } = await req.json();

    // Validate invite code server-side — change INSTRUCTOR_INVITE_CODE in
    // Supabase Edge Function secrets whenever you want to rotate it.
    const validCode = Deno.env.get('INSTRUCTOR_INVITE_CODE') ?? 'CEP-TEACH-2025';
    if (!invite_code || invite_code !== validCode) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite code.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, email and password are required.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    // Admin client uses the service role key — never exposed to the browser.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create user with email already confirmed — no confirmation email sent.
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,          // skips the confirmation email entirely
      user_metadata: {
        full_name: name,
        role: 'teacher',
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user_id: data.user.id }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message ?? 'Unexpected error' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
