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
