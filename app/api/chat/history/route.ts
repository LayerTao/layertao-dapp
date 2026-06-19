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
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (msgError) {
      throw msgError;
    }

    // Reverse to get chronological order since we fetched descending to get the latest 50
    const chronologicalMessages = messages.reverse().map(m => ({
      role: m.role,
      content: m.content,
      image: m.image || undefined,
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
