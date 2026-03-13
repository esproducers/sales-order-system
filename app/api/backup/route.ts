import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // 1. 获取当前用户的会话（使用 @supabase/ssr，Next.js 15+ 需要 await cookies()）
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {
            // 在 API 路由中不需要设置 cookie，留空即可
          },
          remove() {
            // 同上
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 验证用户是否为管理员（从 app_metadata 中检查）
    if (user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }

    // 3. 使用服务角色客户端执行备份（绕过 RLS）
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. 备份数据表
    const tables = ['profiles', 'clients', 'orders', 'backup_history']
    const backupData: Record<string, any[]> = {}
    let totalRecords = 0

    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')

      if (error) throw error

      backupData[table] = data || []
      totalRecords += data?.length || 0
    }

    // 5. 生成备份文件名（ISO 时间转文件名安全格式）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFileName = `backup-${timestamp}.json`

    // 6. 上传到 Supabase 存储
    const { error: uploadError } = await supabaseAdmin.storage
      .from('backups')
      .upload(backupFileName, JSON.stringify(backupData, null, 2), {
        contentType: 'application/json',
        upsert: false,
      })

    if (uploadError) throw uploadError

    // 7. 获取文件的公共 URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('backups')
      .getPublicUrl(backupFileName)

    // 8. 记录备份历史
    const { error: historyError } = await supabaseAdmin
      .from('backup_history')
      .insert({
        backup_type: 'manual',
        file_url: publicUrl,
        record_count: totalRecords,
        status: 'completed',
      })

    if (historyError) throw historyError

    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backup_file: backupFileName,
      records_backed_up: totalRecords,
      download_url: publicUrl,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('Backup error:', error)

    // 尝试记录失败备份
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await supabaseAdmin
        .from('backup_history')
        .insert({
          backup_type: 'manual',
          status: 'failed',
          record_count: 0,
        })
    } catch { }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Backup failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() { },
          remove() { },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 获取备份历史
    const { data: history, error } = await supabaseAdmin
      .from('backup_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // 获取备份文件列表
    const { data: files } = await supabaseAdmin.storage
      .from('backups')
      .list('', {
        sortBy: { column: 'created_at', order: 'desc' },
      })

    return NextResponse.json({
      success: true,
      backup_history: history || [],
      backup_files: files || [],
      total_backups: history?.length || 0,
    })

  } catch (error: any) {
    console.error('Get backup info error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}