import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role key for admin operations
  )

  try {
    const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' })

    // Get all transactions for today
    const { data: transactions, error: selectError } = await supabase
      .from('transactions_cards')
      .select('*')
      .eq('business_date', today)

    if (selectError) {
      throw selectError
    }

    // Archive today's transactions if any exist
    if (transactions && transactions.length > 0) {
      const { error: archiveError } = await supabase
        .from('archived_transactions_cards')
        .insert(
          transactions.map(t => ({
            ...t,
            archived_at: new Date().toISOString()
          }))
        )

      if (archiveError) {
        throw archiveError
      }

      // Clear today's transactions
      const { error: deleteError } = await supabase
        .from('transactions_cards')
        .delete()
        .eq('business_date', today)

      if (deleteError) {
        throw deleteError
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reset completed. Archived ${transactions?.length || 0} transactions.`
    })

  } catch (error: unknown) {
    console.error('Daily reset error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Verify the request is from a cron job or authorized source
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return POST()
}