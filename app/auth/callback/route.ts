import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Copy updated cookies (session tokens) into the redirect response
      const response = NextResponse.redirect(`${origin}/dashboard`);
      cookieStore.getAll().forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value);
      });
      return response;
    }

    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
