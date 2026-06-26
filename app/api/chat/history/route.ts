import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    // Get the messages for this conversation, ordered by created_at ascending
    // Limit to last 50 for initial load to keep UI fast
    // Fetch messages WITHOUT the heavy `image` column (base64 = MBs).
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (msgError) throw msgError;

    // Fast parallel check: which message IDs have images? (only fetches IDs, not data)
    const { data: imageIds } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .not('image', 'is', null);

    const hasImageSet = new Set((imageIds || []).map(r => r.id));

    const chronologicalMessages = messages.reverse().map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      hasImage: hasImageSet.has(m.id),
    }));

    return NextResponse.json({
      messages: chronologicalMessages,
      conversationId: conversationId
    });

  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
