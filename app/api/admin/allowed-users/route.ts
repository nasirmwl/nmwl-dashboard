import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all allowed users
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('allowed_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching allowed users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data })
  } catch (error: any) {
    console.error('Allowed users fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Add a new allowed user
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { github_username, email, name } = body

    if (!github_username && !email) {
      return NextResponse.json(
        { error: 'Either github_username or email is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('allowed_users')
      .insert([{ github_username, email, name }])
      .select()
      .single()

    if (error) {
      console.error('Error creating allowed user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data }, { status: 201 })
  } catch (error: any) {
    console.error('Allowed user create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove an allowed user
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('allowed_users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting allowed user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Allowed user delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

