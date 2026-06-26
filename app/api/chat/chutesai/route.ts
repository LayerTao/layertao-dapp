// app/api/chat/chutesai/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createConversation, getConversationMemoryState, saveMessage, appendSparklinePoint } from "@/lib/supabase";
import { computeKeptTailPhase1, maybeSummarizeConversationPhase1, KEPT_TOKEN_BUDGET, computeContextMetrics, getModelContextLimitTokens } from "@/lib/chatMemoryPhase1";

const client = new OpenAI({
  apiKey: process.env.CHUTES_API_KEY,
  baseURL: process.env.CHUTES_BASE_URL,
});

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { message, model, walletAddress, conversationId, image } = await req.json();

    const lastMessage =
      message && typeof message.content === "string"
        ? { role: "user" as const, content: message.content }
        : null;

    let convId: string | null = conversationId ?? null;
    let summary = "";

    // Resolve/create conversation
    if (!convId && walletAddress && lastMessage?.content) {
      const title = lastMessage.content.substring(0, 30) || "New Chat";
      const conv = await createConversation(walletAddress, title);
      convId = conv.id;
    } else if (convId) {
      const memoryState = await getConversationMemoryState(convId);
      summary = memoryState.summary || "";
    }

    // Save new user message (capture inserted row id for correct dedupe-by-id)
    let newSavedUserMessageId: string | null = null;
    if (convId && lastMessage) {
      const saved = await saveMessage(convId, "user", lastMessage.content, image);
      newSavedUserMessageId = saved?.id ?? null;
    }

    const sysPrompt = summary
      ? `You are a helpful AI assistant.\n\nPrevious Conversation Summary:\n${summary}`
      : "You are a helpful AI assistant.";

    // Reconstruct unsummarized kept-tail and send as real chat messages.
    const memoryState = convId ? await getConversationMemoryState(convId) : null;
    const summarizedUntilMessageId = memoryState?.summarizedUntilMessageId ?? null;

    const { keptTailOldestFirst } = await computeKeptTailPhase1({
      conversationId: convId!,
      summarizedUntilMessageId,
      keptTokenBudget: KEPT_TOKEN_BUDGET,
    });

    // Dedupe by id: exclude the newest saved user message (id from messages table) from kept-tail.
    const keptTailWithoutNewest = newSavedUserMessageId
      ? keptTailOldestFirst.filter((m) => m.id !== newSavedUserMessageId)
      : keptTailOldestFirst;

    const chutesMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system" as const, content: sysPrompt },
        ...keptTailWithoutNewest
          .filter((m: { content: string | null }) => (m.content ?? "").trim().length > 0)
          .map((m: { role: "user" | "assistant"; content: string | null }) => ({
            role: m.role,
            content: m.content as string,
          })),
        ...(lastMessage ? ([{ role: "user" as const, content: lastMessage.content }] as any) : []),
      ];

      console.log("[chutesai] chutesMessages order check:", JSON.stringify(chutesMessages.map(m => ({
        role: m.role,
        preview: typeof m.content === "string" ? m.content.substring(0, 60) : "",
      }))));
      console.log("[chutesai] CONTEXT SIZE:", JSON.stringify({
        totalChars: chutesMessages.reduce((sum: number, m: any) => sum + (typeof m.content === "string" ? m.content.length : 0), 0),
        estTokens: Math.round(chutesMessages.reduce((sum: number, m: any) => sum + (typeof m.content === "string" ? m.content.length : 0), 0) / 4),
        msgCount: chutesMessages.length,
        hasSummary: summary.length > 0,
        summaryPreview: summary.substring(0, 80),
      }));

      console.log("[chutesai] calling Chutes with model:", JSON.stringify({
        model,
        baseURL: process.env.CHUTES_BASE_URL,
        msgCount: chutesMessages.length,
      }));

      // Compute context metrics for NexusContextCard.
      // Use TOTAL prompt chars vs model's actual context window.
      const totalPromptChars = chutesMessages.reduce(
        (sum: number, m: any) => sum + (typeof m.content === "string" ? m.content.length : 0),
        0,
      );
      const modelLimit = getModelContextLimitTokens(model);
      const contextMetrics = computeContextMetrics(totalPromptChars, modelLimit);
      const lastSummarizedAt = memoryState?.summarizedUntilMessageId
        ? memoryState?.updatedAt ?? null
        : null;

      const response = await client.chat.completions.create({
        model,
        messages: chutesMessages,
        max_tokens: 4096,
        temperature: 0.5,
      });

    const reply = response.choices[0].message.content;
    const cleanedReply = reply
      ? reply.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*$/gi, "").trim()
      : reply;

    if (convId && cleanedReply) {
      await saveMessage(convId, "assistant", cleanedReply);
    }

    if (convId && lastMessage?.content) {
      // Fire-and-forget Phase 1b summarization (cursor + lock + budget)
      void maybeSummarizeConversationPhase1({
        chutesClient: client,
        openaiClient: openaiClient,
        conversationId: convId,
        newestUserMessage: { content: lastMessage.content },
      });
    }

    // Persist sparkline point (fire-and-forget).
    if (convId) {
      void appendSparklinePoint(convId, Math.round(contextMetrics.contextSizeChars / 4));
    }
    const sparklineHistory = memoryState?.sparklineHistory ?? [];

    return NextResponse.json({
      reply,
      subnetID: "subnet-64",
      conversationId: convId,
      contextMetadata: {
        contextSizeChars: contextMetrics.contextSizeChars,
        contextLimitChars: contextMetrics.contextLimitChars,
        healthPct: contextMetrics.healthPct,
        lastSummarizedAt,
        sparklineHistory,
      },
    });
  } catch (error) {
    console.error("Chutes API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response from Chutes." },
      { status: 500 }
    );
  }
}

