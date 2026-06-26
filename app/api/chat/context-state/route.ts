// GET /api/chat/context-state?conversationId=xxx
// Returns current context metrics for NexusContextCard when loading an existing conversation.

import { NextResponse } from "next/server";
import { getConversationMemoryState } from "@/lib/supabase";
import { computeKeptTailPhase1, KEPT_TOKEN_BUDGET, computeContextMetrics, getModelContextLimitTokens } from "@/lib/chatMemoryPhase1";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  try {
    const memoryState = await getConversationMemoryState(conversationId);

    const { keptTailOldestFirst } = await computeKeptTailPhase1({
      conversationId,
      summarizedUntilMessageId: memoryState.summarizedUntilMessageId,
      keptTokenBudget: KEPT_TOKEN_BUDGET,
    });

    // Reconstruct the full prompt the model would receive:
    // system prompt + summary + kept-tail (same as routes build).
    const sysPrompt = memoryState.summary
      ? `You are a helpful AI assistant.\n\nPrevious Conversation Summary:\n${memoryState.summary}`
      : "You are a helpful AI assistant.";

    const keptTailChars = keptTailOldestFirst.reduce(
      (sum, m) => sum + (m.content ?? "").length,
      0,
    );
    const totalPromptChars = sysPrompt.length + keptTailChars;

    // Default to 32K tokens (matches Qwen3-32B, most common model).
    // Card updates to the exact model-specific limit on the very next live response.
    const metrics = computeContextMetrics(totalPromptChars, 32768);

    // Only report summarization timestamp if a summarization has actually occurred
    // (summarizedUntilMessageId is only set when maybeSummarizeConversationPhase1 succeeds).
    const lastSummarizedAt = memoryState.summarizedUntilMessageId
      ? memoryState.updatedAt
      : null;

    return NextResponse.json({
      contextSizeChars: metrics.contextSizeChars,
      contextLimitChars: metrics.contextLimitChars,
      healthPct: metrics.healthPct,
      lastSummarizedAt,
      sparklineHistory: memoryState.sparklineHistory,
    });
  } catch (error) {
    console.error("Context state fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch context state" }, { status: 500 });
  }
}
