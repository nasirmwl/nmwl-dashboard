import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://zgkrelbxmwsidhbsoowb.supabase.co';
const supabaseKey = 'sb_publishable_xzfyp23xWPwl4CKT0v4F8w_nL20TZcv';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

// GET - Fetch all spending entries
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('spending')
      .select(`
        *,
        spending_categories (
          id,
          name,
          description
        )
      `)
      .order('spent_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = data.map((item: any) => ({
      id: item.id.toString(),
      amount: parseFloat(item.amount),
      category_id: item.category_id ? item.category_id.toString() : null,
      category: item.spending_categories ? {
        id: item.spending_categories.id.toString(),
        name: item.spending_categories.name,
        description: item.spending_categories.description,
      } : null,
      description: item.description,
      spent_at: item.spent_at,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Spending fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new spending entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, category_id, description, spent_at } = body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const insertData: any = {
      amount: parseFloat(amount),
    };

    if (category_id) {
      insertData.category_id = category_id;
    }

    if (description) {
      insertData.description = description;
    }

    if (spent_at) {
      insertData.spent_at = spent_at;
    }

    const { data, error } = await supabase
      .from('spending')
      .insert([insertData])
      .select(`
        *,
        spending_categories (
          id,
          name,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id.toString(),
      amount: parseFloat(data.amount),
      category_id: data.category_id ? data.category_id.toString() : null,
      category: data.spending_categories ? {
        id: data.spending_categories.id.toString(),
        name: data.spending_categories.name,
        description: data.spending_categories.description,
      } : null,
      description: data.description,
      spent_at: data.spent_at,
    });
  } catch (error: any) {
    console.error('Spending create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a spending entry
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, amount, category_id, description, spent_at } = body;

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const updateData: any = {
      amount: parseFloat(amount),
      updated_at: new Date().toISOString(),
    };

    if (category_id !== undefined) {
      updateData.category_id = category_id || null;
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (spent_at) {
      updateData.spent_at = spent_at;
    }

    const { data, error } = await supabase
      .from('spending')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        spending_categories (
          id,
          name,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id.toString(),
      amount: parseFloat(data.amount),
      category_id: data.category_id ? data.category_id.toString() : null,
      category: data.spending_categories ? {
        id: data.spending_categories.id.toString(),
        name: data.spending_categories.name,
        description: data.spending_categories.description,
      } : null,
      description: data.description,
      spent_at: data.spent_at,
    });
  } catch (error: any) {
    console.error('Spending update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a spending entry
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('spending')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Spending delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

