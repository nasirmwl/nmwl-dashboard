import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://zgkrelbxmwsidhbsoowb.supabase.co';
const supabaseKey = 'sb_publishable_xzfyp23xWPwl4CKT0v4F8w_nL20TZcv';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

// GET - Fetch all podcasts
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = data.map((item: any) => ({
      id: item.id.toString(),
      title: item.title || '',
      link: item.link || '',
      description: item.description || '',
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Podcasts fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new podcast
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, link, description } = body;

    if (!title || !link) {
      return NextResponse.json({ error: 'Title and link are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('podcasts')
      .insert([{ title, link, description: description || null }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id.toString(),
      title: data.title || '',
      link: data.link || '',
      description: data.description || '',
    });
  } catch (error: any) {
    console.error('Podcasts create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a podcast
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, link, description } = body;

    if (!id || !title || !link) {
      return NextResponse.json({ error: 'Id, title, and link are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('podcasts')
      .update({ title, link, description: description || null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id.toString(),
      title: data.title || '',
      link: data.link || '',
      description: data.description || '',
    });
  } catch (error: any) {
    console.error('Podcasts update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a podcast
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('podcasts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Podcasts delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

