import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// We use the service role key to bypass RLS since we are writing from server-side API routes
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase URL or Service Key is missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Create a new conversation for a specific wallet address.
 */
export async function createConversation(walletAddress: string, title: string = 'New Chat') {
  if (!walletAddress) throw new Error("Wallet address is required");

  const { data: newConv, error: insertError } = await supabase
    .from('conversations')
    .insert([{ wallet_address: walletAddress, title }])
    .select()
    .single();

  if (insertError) throw insertError;
  return newConv;
}

/**
 * Fetch all conversations for a given wallet address.
 */
export async function getConversations(walletAddress: string) {
  if (!walletAddress) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Failed to fetch conversations:", error);
    return [];
  }
  return data;
}

/**
 * Delete a specific conversation.
 */
export async function deleteConversation(conversationId: string) {
  if (!conversationId) return false;

  // Supabase ON DELETE CASCADE on the foreign key should handle deleting messages automatically if configured,
  // otherwise we can manually delete them first. Let's manually delete messages first to be safe if cascade isn't set up.
  await supabase.from('messages').delete().eq('conversation_id', conversationId);

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error("Failed to delete conversation:", error);
    return false;
  }
  return true;
}

/**
 * Helper to save a message to a conversation.
 */
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  image?: string
) {
  if (!conversationId || (!content && !image)) return null;

  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      role,
      content,
      image: image || null
    }])
    .select()
    .single();

  if (error) {
    console.error("Failed to save message to Supabase:", error);
    return null;
  }
  return data;
}

/**
 * Helper to update the conversation summary.
 */
export async function updateConversationSummary(conversationId: string, summary: string) {
  const { data, error } = await supabase
    .from('conversations')
    .update({ summary })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update conversation summary:", error);
    return null;
  }
  return data;
}

export async function getConversationMemoryState(conversationId: string): Promise<{
  summary: string;
  summarizedUntilMessageId: string | null;
  summarizing: boolean;
  updatedAt: string;
  sparklineHistory: number[];
}> {
  const { data, error } = await supabase
    .from('conversations')
    .select('summary, summarized_until_message_id, summarizing, updated_at, sparkline_history')
    .eq('id', conversationId)
    .single();

  if (error) throw error;

  return {
    summary: data?.summary || '',
    summarizedUntilMessageId: data?.summarized_until_message_id ?? null,
    summarizing: Boolean(data?.summarizing),
    updatedAt: data?.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
    sparklineHistory: Array.isArray(data?.sparkline_history) ? data.sparkline_history as number[] : [],
  };
}

export async function tryAcquireConversationSummarizingLock(conversationId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('try_acquire_conversation_summarizing_lock', {
    p_conversation_id: conversationId,
  });

  if (error) throw error;

  // supabase-js returns rpc scalar as-is
  return Boolean(data);
}




export async function releaseConversationSummarizingLock(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ summarizing: false, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) throw error;
}

export async function updateConversationSummaryAndAdvanceCursor(params: {
  conversationId: string;
  newSummary: string;
  lastSummarizedMessageId: string;
}): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({
      summary: params.newSummary,
      summarized_until_message_id: params.lastSummarizedMessageId,
      summarizing: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.conversationId);

  if (error) throw error;
}

/**
 * Cursor-based message fetch:
 * - Resolves the cursor UUID to a created_at timestamp.
 * - Returns messages where created_at > cursor_created_at (if cursor provided).
 * - Ordered by created_at oldest -> newest for stable chronological token-budget walking.
 *
 * IMPORTANT: messages.id is UUIDv4 (random byte order). We MUST NOT order or filter
 * by id for chronology — UUIDv4 sort order is unrelated to insertion time. Use
 * created_at instead for all chronological operations.
 */
export async function getConversationMessagesAfterCursor(params: {
  conversationId: string;
  summarizedUntilMessageId: string | null;
  limit?: number;
}): Promise<Array<{ id: string; role: 'user' | 'assistant'; content: string | null; image: string | null; created_at?: string }>> {
  const { conversationId, summarizedUntilMessageId, limit = 200 } = params;

  // Resolve the cursor UUID to its created_at timestamp so we can do a correct
  // chronological boundary filter.  UUIDv4 byte order != time order.
  let cursorCreatedAt: string | null = null;
  if (summarizedUntilMessageId) {
    const { data: cursorMsg } = await supabase
      .from('messages')
      .select('created_at')
      .eq('id', summarizedUntilMessageId)
      .single();
    cursorCreatedAt = cursorMsg?.created_at ?? null;
  }

  let query = supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (cursorCreatedAt) {
    query = query.gt('created_at', cursorCreatedAt);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as any;
}

/**
 * Append a token-count point to the conversation's sparkline history.
 * Truncates to last 20 entries. Called on each chat response.
 */
export async function appendSparklinePoint(
  conversationId: string,
  tokens: number,
): Promise<void> {
  // Use a raw SQL RPC or two-step read-modify-write.
  // Read current history, append, truncate, write back.
  const { data: conv } = await supabase
    .from('conversations')
    .select('sparkline_history')
    .eq('id', conversationId)
    .single();

  const history: number[] = Array.isArray(conv?.sparkline_history)
    ? conv.sparkline_history as number[]
    : [];
  history.push(tokens);
  const trimmed = history.length > 20 ? history.slice(history.length - 20) : history;

  const { error } = await supabase
    .from('conversations')
    .update({ sparkline_history: trimmed })
    .eq('id', conversationId);

  if (error) console.error("[appendSparklinePoint] failed:", error);
}

/**
 * Fetch last N user messages (oldest-first) for routing context.
 * Lightweight — only fetches content, no images or assistant replies.
 */
export async function getRecentUserMessagesForRouting(
  conversationId: string,
  limit: number = 3,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('content')
    .eq('conversation_id', conversationId)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentUserMessagesForRouting] failed:", error);
    return [];
  }

  return (data ?? []).reverse().map(m => m.content).filter(Boolean);
}

