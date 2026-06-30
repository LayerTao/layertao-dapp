  import OpenAI from "openai";
  import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
  import {
    getConversationMemoryState,
    tryAcquireConversationSummarizingLock,
    releaseConversationSummarizingLock,
    updateConversationSummaryAndAdvanceCursor,
    getConversationMessagesAfterCursor,
  } from "./supabase";
  
  /** Token budget for kept-tail (unsummarized messages sent raw to chat model). */
  export const KEPT_TOKEN_BUDGET = 5000;

  /**
   * Resolve a model name to its approximate context-window token limit.
   * Used for NexusContextCard display — NOT for summarization threshold.
   */
  export function getModelContextLimitTokens(model: string): number {
    const m = model.toLowerCase();
    if (m.includes("gpt-4o")) return 128_000;
    if (m.includes("gpt-4")) return 8_192;
    if (m.includes("qwen3-235b")) return 131_072;
    if (m.includes("qwen3-32b")) return 32_768;
    if (m.includes("deepseek-v3.2")) return 131_072;
    if (m.includes("deepseek-v3.1")) return 131_072;
    if (m.includes("deepseek-v3")) return 131_072;
    if (m.includes("glm-5")) return 131_072;
    if (m.includes("minimax-m2")) return 131_072;
    return 4_096; // conservative default for unknown models
  }

  /**
   * Compute context metrics for NexusContextCard display.
   * contextSizeChars  = total serialized prompt chars sent to the model.
   * contextLimitChars = model's context-window limit in chars (tokens × 4 proxy).
   * healthPct         = 100 - (size / limit × 100), clamped [0, 100].
   */
  export function computeContextMetrics(
    totalPromptChars: number,
    modelContextLimitTokens: number,
  ): {
    contextSizeChars: number;
    contextLimitChars: number;
    healthPct: number;
  } {
    const contextLimitChars = modelContextLimitTokens * 4;
    const fullness = contextLimitChars > 0
      ? (totalPromptChars / contextLimitChars) * 100
      : 0;
    const healthPct = Math.max(0, Math.min(100, Math.round(100 - fullness)));

    return {
      contextSizeChars: totalPromptChars,
      contextLimitChars,
      healthPct,
    };
  }

  function formatKeptMessagesForPrompt(messages: Array<{ role: "user" | "assistant"; content: string | null }>) {
    // Preserve chronological order (oldest -> newest)
    return messages
      .filter((m) => (m.content ?? "").trim().length > 0)
      .map((m) => {
        const speaker = m.role === "user" ? "User" : "Assistant";
        return `${speaker}: ${m.content}`;
      });
  }

  export async function maybeSummarizeConversationPhase1(params: {
    chutesClient: OpenAI;
    openaiClient?: OpenAI;
    conversationId: string;
    newestUserMessage: { content: string };
  }): Promise<void> {
    const {
      chutesClient,
      openaiClient,
      conversationId,
      newestUserMessage,
    } = params;

    // This function is intended to run in background after the assistant response is saved.
    const memoryState = await getConversationMemoryState(conversationId);

    // If there's no cursor yet, we still compute unsummarized tail from id > null (Supabase helper will just return earliest messages limited).
    const cursor = memoryState.summarizedUntilMessageId;

    // When summarization fires, summarize enough messages to drop kept-tail
    // to ~50% of budget (not just barely under the ceiling). This prevents
    // summarization from triggering again on the very next turn.
    const SUMMARIZE_TARGET_BUDGET_RATIO = 0.5;
    const summarizeKeptTokenBudget = Math.floor(KEPT_TOKEN_BUDGET * SUMMARIZE_TARGET_BUDGET_RATIO);

    // Use the shared budget-split algorithm with the REDUCED budget so the
    // batch pulls in more messages than just the strict overflow.
    const {
      batchToSummarizeOldestFirst,
    } = await computeKeptTailPhase1({
      conversationId,
      summarizedUntilMessageId: cursor,
      keptTokenBudget: summarizeKeptTokenBudget,
    });

    // If nothing to summarize, exit without touching the cursor/lock.
    if (batchToSummarizeOldestFirst.length === 0) return;

    // Minimum batch size: don't fire a summarization call for 1-2 messages.
    // Let the batch accumulate across turns so we summarize 3+ messages at once.
    // This avoids calling the summarization model on every single turn when near budget.
    const MIN_BATCH_MESSAGES = 3;
    if (batchToSummarizeOldestFirst.length < MIN_BATCH_MESSAGES) {
      console.log("[maybeSummarize] skipping — batch too small", JSON.stringify({
        batchCount: batchToSummarizeOldestFirst.length,
        minRequired: MIN_BATCH_MESSAGES,
        batchPreview: batchToSummarizeOldestFirst.map(m => ({
          role: m.role,
          preview: (m.content ?? "").substring(0, 40),
        })),
      }));
      return;
    }

    // Acquire lock before performing summarization.
    const lockAcquired = await tryAcquireConversationSummarizingLock(conversationId);
    if (!lockAcquired) {
      console.log("[maybeSummarize] lock not acquired, skipping (another summarization in progress)");
      return;
    }

    try {
      const summaryPrompt = memoryState.summary
        ? `Existing summary (may be incomplete):\n${memoryState.summary}\n\n`
        : "";

      const lines: string[] = [];
      for (const m of batchToSummarizeOldestFirst) {
        const roleLabel = m.role === "user" ? "User" : "Assistant";
        if (m.content && m.content.trim().length > 0) {
          lines.push(`${roleLabel}: ${m.content}`);
        }
      }

      const summarizedBatchText = lines.join("\n");

      const modelName = process.env.SUMMARY_MODEL || "Qwen/Qwen3-32B-TEE";

      // Summarize and produce an updated prose summary.
      // Phase 1 uses plain prose summary.
      const system = `You are a summarization engine for a chat assistant.

  CRITICAL — output format:
  Start every summary with a [FACTS] block and end it with [/FACTS].
  This block contains every explicit instruction, preference, name, or fact the user has
  directly stated. These must be preserved VERBATIM or near-verbatim across all summarization
  passes — never paraphrase, condense, or drop them, even when space is tight.

  WHAT IS A FACT — durable vs transient:
  A "fact" is durable information about the user that remains true across many future
  turns: their name, stated preferences ("prefers short answers"), ongoing projects,
  technical context, or constraints they've given you. Facts persist across the entire
  conversation regardless of what the user is currently asking about.

  A fact is NOT: a question they asked, a request for this turn, or anything that was
  only relevant to answering their current message. Example — "suggest some good movies"
  is a request, not a fact, and must not appear in [FACTS]. Similarly, "what's the story
  of The Godfather?" or "is Titanic worth watching?" are queries, not facts.

  Facts inside [FACTS]...[/FACTS] must be carried forward with their key terms unchanged
  (names, preferences, project names, technical facts). You may compress, merge, or drop
  facts that are no longer relevant, but do not rephrase a retained fact into different
  wording. Synonym substitution inside the facts block is prohibited — if the user said
  "short answers," keep "short answers," not "concise responses."

  If the existing summary already has a [FACTS]...[/FACTS] block, carry its entries forward
  unchanged unless the new batch explicitly contradicts or replaces one. If a batch contains
  no new durable facts, carry the existing [FACTS] block forward unchanged or leave it
  minimal — do not invent facts to fill the block.

  After the [/FACTS] closing tag, write a concise prose summary of the conversation flow,
  key decisions, and context. The prose section may paraphrase freely.

  Return only the updated summary text, no extra commentary.`;

      const user = `${summaryPrompt}New messages to incorporate:\n${summarizedBatchText}\n\nUpdated summary:`;

      console.log("[maybeSummarize] START —", JSON.stringify({
        conversationId,
        batchMsgCount: batchToSummarizeOldestFirst.length,
        batchChars: summarizedBatchText.length,
        existingSummaryChars: (memoryState.summary || "").length,
        model: modelName,
        promptChars: system.length + summaryPrompt.length + user.length,
        summarizeBudget: `${summarizeKeptTokenBudget} tokens (${SUMMARIZE_TARGET_BUDGET_RATIO * 100}% of ${KEPT_TOKEN_BUDGET})`,
      }));

      // Auto-select client: GPT models → OpenAI direct, everything else → Chutes
      const summaryClient = modelName.startsWith("gpt-") && openaiClient
        ? openaiClient
        : chutesClient;

      // Only Chutes accepts extra_body — OpenAI API rejects it. Only pass it
      // when talking to Chutes (Qwen models need enable_thinking: false).
      const isChutesCall = summaryClient === chutesClient;
      const response = await summaryClient.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ] as ChatCompletionMessageParam[],
        max_tokens: 800,
        temperature: 0.2,
        ...(isChutesCall ? { extra_body: { enable_thinking: false } } : {}),
      } as any);

      const rawModelOutput = response.choices[0]?.message?.content ?? "";

      // Strip <think>...</think> reasoning blocks before persisting to conversations.summary.
      // Handles both closed blocks and unclosed blocks (model output truncated by max_tokens).
      // This prevents leaking raw chain-of-thought into stored memory.
      const newSummary = rawModelOutput
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<think>[\s\S]*$/gi, "")   // unclosed block from truncated output
        .trim();

      console.log("[maybeSummarize] MODEL OUTPUT —", JSON.stringify({
        rawChars: rawModelOutput.length,
        cleanedChars: newSummary.length,
        hadThinkBlock: /<think/i.test(rawModelOutput),
        hadUnclosedThink: /<think/i.test(rawModelOutput) && !/<\/think>/i.test(rawModelOutput),
        summaryPreview: newSummary.substring(0, 150),
      }));

      if (!newSummary) {
        throw new Error(
          `Summarization returned empty summary — model burned entire ${rawModelOutput.length}-char output on <think> block. ` +
          `enable_thinking=false should prevent this; if it persists, switch SUMMARY_MODEL to a non-thinking variant.`
        );
      }

      const lastSummarizedMessageId = batchToSummarizeOldestFirst[batchToSummarizeOldestFirst.length - 1]?.id;
      if (!lastSummarizedMessageId) throw new Error("No lastSummarizedMessageId");

      await updateConversationSummaryAndAdvanceCursor({
        conversationId,
        newSummary,
        lastSummarizedMessageId,
      });

      console.log("[maybeSummarize] SAVED to DB —", JSON.stringify({
        summaryChars: newSummary.length,
        summaryPreview: newSummary.substring(0, 120),
        lastSummarizedMessageId,
      }));
    } catch (e) {
      // Leave cursor untouched on failure (handled implicitly by not calling updateConversationSummaryAndAdvanceCursor)
      console.error("maybeSummarizeConversationPhase1 failed:", e);
    } finally {
      await releaseConversationSummarizingLock(conversationId);
    }
  }

  export function buildChutesPromptMessagesForPhase1(params: {
    summary: string;
    keptTailOldestFirst: Array<{ role: "user" | "assistant"; content: string | null }>;
    newestUserMessage: string;
  }): OpenAI.Chat.ChatCompletionMessageParam[] {
    const { summary, keptTailOldestFirst, newestUserMessage } = params;

    const sysPrompt = summary
      ? `You are a helpful AI assistant.\n\nPrevious Conversation Summary:\n${summary}`
      : "You are a helpful AI assistant.";

    // Build messages as: system + (kept tail) + newest user message
    // Ensure newest user message is included even if it was part of keptTail.
    const keptContentMessages = keptTailOldestFirst
      .filter((m) => (m.content ?? "").trim().length > 0)
      .map((m) => ({
        role: m.role,
        content: m.content as string,
      }));

    const newest = { role: "user" as const, content: newestUserMessage };

    return [
      { role: "system" as const, content: sysPrompt },
      ...keptContentMessages,
      newest,
    ];
  }

  export async function computeKeptTailPhase1(params: {
    conversationId: string;
    summarizedUntilMessageId: string | null;
    keptTokenBudget?: number;
  }): Promise<{
    keptTailOldestFirst: Array<{ id: string; role: "user" | "assistant"; content: string | null }>;
    lastKeptMessageId: string | null;
    batchToSummarizeOldestFirst: Array<{ id: string; role: "user" | "assistant"; content: string | null }>;
  }> {
    const { conversationId, summarizedUntilMessageId, keptTokenBudget = 4000 } = params;
    const keptCharBudget = keptTokenBudget * 4;

    const unsummarized = await getConversationMessagesAfterCursor({
      conversationId,
      summarizedUntilMessageId,
      limit: 500,
    });

    const keptTailNewestFirst: typeof unsummarized = [];
    let keptChars = 0;

    for (let i = unsummarized.length - 1; i >= 0; i--) {
      const msg = unsummarized[i];
      const content = msg.content ? String(msg.content) : "";
      const addChars = content.length;

      if (keptTailNewestFirst.length === 0) {
        keptTailNewestFirst.push(msg);
        keptChars += addChars;
        continue;
      }

      if (keptChars + addChars > keptCharBudget) break;
      keptTailNewestFirst.push(msg);
      keptChars += addChars;
    }

    const keptIds = new Set(keptTailNewestFirst.map((m) => m.id));
    const keptTailOldestFirst = [...keptTailNewestFirst].reverse();
    const batchToSummarizeOldestFirst = unsummarized.filter((m) => !keptIds.has(m.id));

    const batchChars = batchToSummarizeOldestFirst.reduce((sum, m) => sum + (m.content ?? "").length, 0);

    console.log("[computeKeptTailPhase1] split:", JSON.stringify({
      totalUnsummarized: unsummarized.length,
      keptTail: { count: keptTailOldestFirst.length, chars: keptChars },
      batchToSummarize: { count: batchToSummarizeOldestFirst.length, chars: batchChars },
      cursor: summarizedUntilMessageId ?? "null",
    }));

    const lastKeptMessageId = keptTailOldestFirst.length > 0 ? keptTailOldestFirst[keptTailOldestFirst.length - 1].id : null;

    return {
      keptTailOldestFirst,
      lastKeptMessageId,
      batchToSummarizeOldestFirst,
    };
  }
