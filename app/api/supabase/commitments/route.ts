import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://zgkrelbxmwsidhbsoowb.supabase.co';
const supabaseKey = 'sb_publishable_xzfyp23xWPwl4CKT0v4F8w_nL20TZcv';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

// GET - Fetch all commitments
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('commitments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to our format (name + description = content)
    const items = data.map((item: any) => ({
      id: item.id.toString(),
      content: item.description || item.name || '',
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Commitments fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new commitment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('commitments')
      .insert([{ description: content, name: content.substring(0, 100) }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id.toString(),
      content: data.description || data.name || '',
    });
  } catch (error: any) {
    console.error('Commitments create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a commitment
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, content } = body;

    if (!id || content === undefined) {
      return NextResponse.json({ error: 'Id and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('commitments')
      .update({ description: content, name: content.substring(0, 100) })
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
    });
  } catch (error: any) {
    console.error('Commitments update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a commitment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('commitments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Commitments delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



