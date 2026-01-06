import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://zgkrelbxmwsidhbsoowb.supabase.co';
const supabaseKey = 'sb_publishable_xzfyp23xWPwl4CKT0v4F8w_nL20TZcv';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

// GET - Fetch all spending categories
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('spending_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = data.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      description: item.description,
      created_at: item.created_at,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Spending categories fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new spending category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('spending_categories')
      .insert([{ name: name.trim(), description: description?.trim() || null }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id.toString(),
      name: data.name,
      description: data.description,
      created_at: data.created_at,
    });
  } catch (error: any) {
    console.error('Spending category create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a spending category
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const updateData: any = {
      name: name.trim(),
    };

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const { data, error } = await supabase
      .from('spending_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id.toString(),
      name: data.name,
      description: data.description,
      created_at: data.created_at,
    });
  } catch (error: any) {
    console.error('Spending category update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a spending category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('spending_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Spending category delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


