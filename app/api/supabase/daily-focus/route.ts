import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://zgkrelbxmwsidhbsoowb.supabase.co';
const supabaseKey = 'sb_publishable_xzfyp23xWPwl4CKT0v4F8w_nL20TZcv';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

// GET - Fetch all daily focus items
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('imp_events')
      .select('*')
      .order('date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to our format
    const items = data.map((item: any) => ({
      id: item.id.toString(),
      content: item.description || item.name || '',
      date: item.date || null,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Daily focus fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new daily focus item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, date } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const insertData: any = {
      description: content,
      name: content.substring(0, 100),
    };
    if (date) {
      insertData.date = date;
    }

    const { data, error } = await supabase
      .from('imp_events')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id.toString(),
      content: data.description || data.name || '',
      date: data.date || null,
    });
  } catch (error: any) {
    console.error('Daily focus create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a daily focus item
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, content, date } = body;

    if (!id || content === undefined) {
      return NextResponse.json({ error: 'Id and content are required' }, { status: 400 });
    }

    const updateData: any = {
      description: content,
      name: content.substring(0, 100),
    };
    if (date !== undefined) {
      updateData.date = date;
    }

    const { data, error } = await supabase
      .from('imp_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id.toString(),
      content: data.description || data.name || '',
      date: data.date || null,
    });
  } catch (error: any) {
    console.error('Daily focus update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a daily focus item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('imp_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Daily focus delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

