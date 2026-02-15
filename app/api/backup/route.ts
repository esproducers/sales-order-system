import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // 验证API密钥
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.BACKUP_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 初始化Supabase管理员客户端
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // 需要设置服务角色密钥
    )

    // 1. 备份数据表
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

    // 2. 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFileName = `backup-${timestamp}.json`

    // 3. 上传到Supabase存储
    const { error: uploadError } = await supabaseAdmin.storage
      .from('backups')
      .upload(backupFileName, JSON.stringify(backupData, null, 2), {
        contentType: 'application/json',
        upsert: false,
      })

    if (uploadError) throw uploadError

    // 4. 获取文件URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('backups')
      .getPublicUrl(backupFileName)

    // 5. 记录备份历史
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
    
    // 记录失败备份
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
    } catch {}

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
    // 验证API密钥
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.BACKUP_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 获取备份历史
    const { data: history, error } = await supabaseAdmin
      .from('backup_history')
      .select('*')
      .order('backup_date', { ascending: false })
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