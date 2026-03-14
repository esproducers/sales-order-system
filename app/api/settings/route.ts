import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      // If table doesn't exist yet, return empty defaults
      return NextResponse.json({
        brand_name: '',
        company_name: '',
        registration_number: ''
      })
    }

    return NextResponse.json(data || {
      brand_name: '',
      company_name: '',
      registration_number: ''
    })
  } catch (error) {
    return NextResponse.json({
      brand_name: '',
      company_name: '',
      registration_number: ''
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set() { },
          remove() { },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    let isAdmin = false
    if (user) {
      isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin'
      if (!isAdmin) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()
        isAdmin = profile?.role === 'admin'
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brand_name, company_name, registration_number } = body

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if a row exists
    const { data: existing } = await supabaseAdmin.from('site_settings').select('id').limit(1).single()

    if (existing?.id) {
      // update
      const { error: updateError } = await supabaseAdmin
        .from('site_settings')
        .update({ brand_name, company_name, registration_number })
        .eq('id', existing.id)

      if (updateError) throw updateError
    } else {
      // insert
      const { error: insertError } = await supabaseAdmin
        .from('site_settings')
        .insert([{ brand_name, company_name, registration_number }])

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' })
  } catch (error: any) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 })
  }
}
