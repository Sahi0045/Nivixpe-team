import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase storage is not configured on the server.' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Initialize Supabase Client with service role key to bypass RLS policies safely on the server side
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const fileBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase.storage
      .from('meetings')
      .upload(fileName, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        duplex: 'half',
      } as any);

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: `Upload error: ${error.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('meetings')
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      fileName: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Server upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
