// app/api/chat/unified/route.ts

export const dynamic = "force-dynamic";

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { tools } from "@/lib/utils";
import { createConversation, getConversationMemoryState, saveMessage, supabase, appendSparklinePoint, getRecentUserMessagesForRouting } from "@/lib/supabase";
import { computeKeptTailPhase1, maybeSummarizeConversationPhase1, KEPT_TOKEN_BUDGET, computeContextMetrics, getModelContextLimitTokens } from "@/lib/chatMemoryPhase1";

const routerClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const chutesClient = new OpenAI({
  apiKey: process.env.CHUTES_API_KEY,
  baseURL: process.env.CHUTES_BASE_URL,
});

async function streamChutes(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  model: string,
  onChunk: (delta: string) => void,
): Promise<string> {
  const stream = await chutesClient.chat.completions.create({
    model,
    messages,
    max_tokens: 4096,
    temperature: 0.5,
    stream: true,
  });

  let fullContent = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullContent += delta;
      onChunk(delta);
    }
  }

  return fullContent;
}

async function callImageGen(prompt: string) {
  const apiKey = process.env.CHUTES_API_KEY;
  if (!apiKey) throw new Error("Missing CHUTES_API_KEY for image generation");

  const payload = {
    seed: Math.floor(Math.random() * 1000000),
    shift: 3,
    width: 1024,
    height: 1024,
    prompt,
    guidance_scale: 0,
    max_sequence_length: 512,
    num_inference_steps: 9,
  };

  const response = await fetch("https://vonkaiser-z-image-turbo.chutes.ai/generate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Image generation failed: ${response.status} ${errText}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.startsWith("image/")) {
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString("base64");
    return `data:${contentType};base64,${base64}`;
  }

  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (data.url) return data.url;
    if (data.image && data.image.startsWith("http")) return data.image;
    if (data.data?.[0]?.url) return data.data[0].url;
    return JSON.stringify(data, null, 2);
  } catch {
    return text;
  }
}

async function callBitmind(input: string) {
  const videoExt = /\.(mp4|m4v|webm|mov|avi|mkv|ogv)(\?.*)?$/i;
  const isVideo = input.startsWith("data:video/") || videoExt.test(input);

  const endpoint = isVideo
    ? "https://api.bitmind.ai/oracle/v1/34/detect-video"
    : "https://api.bitmind.ai/detect-image";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.BITMIND_API_KEY}`,
    "Content-Type": "application/json",
  };
  if (isVideo) headers["x-bitmind-application"] = "oracle-api";

  const body = isVideo ? { video: input } : { image: input };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  const confidence = (data.confidence * 100).toFixed(1);
  const conf = parseFloat(confidence);
  const confPercent = `${confidence}%`;
  const prefix = isVideo ? "Video" : "Image";

  if (data.isAI && conf >= 90)
    return `**AI-Generated ${prefix}** — ${confPercent} confidence\n\nHigh-confidence detection of synthetic origin.`;
  if (data.isAI && conf >= 70)
    return `**Likely AI-Generated ${prefix}** — ${confPercent} confidence\n\nMultiple indicators point to synthetic generation.`;
  if (data.isAI)
    return `**Possibly AI-Generated ${prefix}** — ${confPercent} confidence\n\nResults lean synthetic, though evidence is limited.`;
  if (!data.isAI && conf >= 90)
    return `**Authentic ${prefix}** — ${confPercent} confidence\n\nNo indications of AI generation detected.`;
  if (!data.isAI && conf >= 70)
    return `**Likely Authentic ${prefix}** — ${confPercent} confidence\n\nThe ${isVideo ? "video" : "image"} appears genuine with minimal synthetic markers.`;
  return `**Uncertain ${prefix}** — ${confPercent} confidence\n\nInconclusive result; could not be reliably classified.`;
}

async function callDesearch(query: string, toolsArr: string[]) {
  const response = await fetch(
    `${process.env.DESEARCH_BASE_URL}/desearch/ai/search`,
    {
      method: "POST",
      headers: {
        Authorization: process.env.DESEARCH_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: query,
        tools: toolsArr,
        streaming: false,
      }),
    }
  );

  return response.json();
}

// Phase 1 step 1 (correctness): DB-backed summary + newest message only.
// Cursor/token-budget + background cursor-advancing summarization is implemented in later chunk.

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        const sendChunk = (obj: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        };

        try {
          const { message, model, image, walletAddress, conversationId } = await req.json();

          const lastMessage = message
            ? { role: "user" as const, content: String(message.content ?? "") }
            : null;

          let convId: string | null = conversationId ?? null;
          let summary = "";
          // Load memory state once — reused by route_to_chutes below instead of refetching.
          let memoryState: Awaited<ReturnType<typeof getConversationMemoryState>> | null = null;

          if (!convId && walletAddress && lastMessage && lastMessage.content) {
            const title = (lastMessage.content || "").substring(0, 30) || "New Chat";
            const conv = await createConversation(walletAddress, title);
            convId = conv.id;
            sendChunk({ type: "conversation_id", conversationId: convId });
          } else if (convId) {
            memoryState = await getConversationMemoryState(convId);
            summary = memoryState.summary || "";
          }

          // Fetch recent user messages for routing context (lightweight, ~30ms).
          const recentUserMsgs = convId
            ? await getRecentUserMessagesForRouting(convId, 3)
            : [];

          // Build context from previous user messages for smarter routing.
          const routingContext = recentUserMsgs.length > 0
            ? "\n\nPREVIOUS USER MESSAGES (context only — understand the topic, then route the latest message below):\n" +
              recentUserMsgs.map((m, i) => `${i + 1}. "${m}"`).join("\n")
            : "";

          // Save user message and call router in parallel — they're independent.
          let newSavedUserMessageId: string | null = null;
          const [savedMsg, routerResponse] = await Promise.all([
            convId && lastMessage
              ? saveMessage(convId, "user", lastMessage.content, image)
              : Promise.resolve(null),
            routerClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a request router. NEVER answer users directly. Always return a tool call.${routingContext}

DEFAULT:
- Route most requests to "route_to_chutes".
- Use "route_to_desearch" ONLY when the query clearly requires real-time or external information.
- Use "route_to_imagegen" when the user wants to create, generate, draw, or visualize an image.
- Use "route_to_bitmind" when the user wants to check if an image is AI-generated or real. This takes priority over route_to_chutes whenever an image is attached or the user asks about image authenticity, deepfake detection, or AI verification.

WHEN TO USE "route_to_imagegen":

Use when the user asks to:
- Generate, create, or draw an image
- Visualize a scene, object, or concept
- Create artwork, illustrations, or graphics
- Any image creation or generation request

WHEN TO USE "route_to_bitmind":

Use when the user asks to:
- Check if an image is AI-generated or real
- Detect deepfakes or AI-manipulated images
- Verify image authenticity
- Analyze whether a photo is synthetic

WHEN TO USE "route_to_desearch":

Use when the user asks about:
- Current events, news, or anything time-sensitive
- Prices, scores, weather, live data
- Social sentiment or trending topics
- Specific people, products, or companies (recent info)
- Anything your training data cannot reliably answer

HARD RULES:
- Never generate a user-facing answer.
- Never invent model names.
- Output must always be a valid tool call.`,
              },
              ...(lastMessage ? [lastMessage] : []),
            ],
            tools,
            tool_choice: "auto",
            temperature: 0,
          }),
        ]);

        newSavedUserMessageId = savedMsg?.id ?? null;

          const toolCall = routerResponse.choices[0].message.tool_calls?.[0];
          if (!toolCall) {
            sendChunk({ error: "No routing decision made." });
            controller.close();
            return;
          }
          if (toolCall.type !== "function") {
            sendChunk({ error: "Unsupported tool call type." });
            controller.close();
            return;
          }

          const subnetMap: Record<string, string> = {
            route_to_chutes: "subnet-64",
            route_to_desearch: "subnet-22",
            route_to_imagegen: "subnet-65",
            route_to_bitmind: "subnet-66",
          };

          const subnetID = subnetMap[toolCall.function.name] || "subnet-64";
          sendChunk({ type: "routing", subnetID });

          const args = JSON.parse(toolCall.function.arguments);

          let result: any;

          if (toolCall.function.name === "route_to_chutes") {
            const sysPrompt = summary
              ? `You are a helpful AI assistant.\n\nPrevious Conversation Summary:\n${summary}`
              : "You are a helpful AI assistant.";

            // Reconstruct unsummarized kept-tail and send as real chat messages.
            // Also dedupe so the newest user message appears exactly once.
            const summarizedUntilMessageId = memoryState?.summarizedUntilMessageId ?? null;

            const { keptTailOldestFirst } = await computeKeptTailPhase1({
              conversationId: convId!,
              summarizedUntilMessageId,
              keptTokenBudget: KEPT_TOKEN_BUDGET,
            });

            // Dedupe by id: exclude the newest saved user message (inserted row id) from kept-tail.
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
              ...(lastMessage
                ? ([{ role: "user" as const, content: lastMessage.content }] as any)
                : []),
            ];

            const modelName =
              typeof args.model === "string" && args.model.trim().length > 0
                ? args.model
                : "Qwen/Qwen3-32B-TEE";
                // Compute total prompt chars once — reused for logging, metrics, sparkline.
                const totalPromptChars = chutesMessages.reduce(
                  (sum: number, m: any) => sum + (typeof m.content === "string" ? m.content.length : 0),
                  0,
                );

                console.log("[unified] chutesMessages order check:", JSON.stringify(chutesMessages.map((m: any) => ({
                  role: m.role,
                  preview: typeof m.content === "string" ? m.content.substring(0, 60) : "",
                }))))
                console.log("[unified] CONTEXT SIZE:", JSON.stringify({
                  totalChars: totalPromptChars,
                  estTokens: Math.round(totalPromptChars / 4),
                  msgCount: chutesMessages.length,
                  hasSummary: summary.length > 0,
                  summaryPreview: summary.substring(0, 80),
                }))

                const modelLimit = getModelContextLimitTokens(modelName);
                const contextMetrics = computeContextMetrics(totalPromptChars, modelLimit);
                // Only report summarization timestamp if cursor exists (summarization has run).
                const lastSummarizedAt = (memoryState?.summarizedUntilMessageId)
                  ? memoryState?.updatedAt ?? null
                  : null;
                // Persist sparkline point (fire-and-forget).
                if (convId) {
                  void appendSparklinePoint(convId, Math.round(contextMetrics.contextSizeChars / 4));
                }
                const sparklineHistory = memoryState?.sparklineHistory ?? [];

                sendChunk({
                  type: "context_metadata",
                  contextSizeChars: contextMetrics.contextSizeChars,
                  contextLimitChars: contextMetrics.contextLimitChars,
                  healthPct: contextMetrics.healthPct,
                  lastSummarizedAt,
                  sparklineHistory,
                });

            result = await streamChutes(chutesMessages, modelName, (delta) => {
              sendChunk({ type: "token", text: delta });
            });
            sendChunk({ type: "content_done" });
          } else if (toolCall.function.name === "route_to_desearch") {
            const prompt = String(lastMessage?.content ?? "");
            const desearchResult = await callDesearch(prompt, args.tools);
            result = desearchResult?.completion;
          } else if (toolCall.function.name === "route_to_imagegen") {
            const prompt = String(lastMessage?.content ?? "");
            result = await callImageGen(prompt);
            if (convId && result) await saveMessage(convId, "assistant", "Here is the generated image:", result);
            sendChunk({ type: "image", imageBase64: result });
            controller.close();
            return;
          } else if (toolCall.function.name === "route_to_bitmind") {
            const input = String(image || (lastMessage?.content ?? ""));
            result = await callBitmind(input);
          } else {
            sendChunk({ error: "Unknown subnet." });
            controller.close();
            return;
          }

          // For imagegen we returned early above, so any other branch should be persisted.
          if (convId && result) {
            const cleanedResult = String(result)
              .replace(/<think>[\s\S]*?<\/think>/gi, "")
              .replace(/<think>[\s\S]*$/gi, "")   // unclosed block from truncated output
              .trim();
            await saveMessage(convId, "assistant", cleanedResult);


            // Fire-and-forget Phase 1b summarization (cursor + lock + budget)
            void maybeSummarizeConversationPhase1({
              chutesClient: chutesClient,
              openaiClient: routerClient,
              conversationId: convId,
              newestUserMessage: { content: lastMessage?.content ?? "" },
            });
          }

          // route_to_chutes streams via tokens — skip duplicate content chunk.
          if (toolCall.function.name !== "route_to_chutes") {
            sendChunk({ type: "content", reply: result });
          }
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : JSON.stringify(error);
          console.error("Router Error:", message, error);
          sendChunk({ error: `Failed to route request: ${message}` });
          controller.close();
        }
      },
    }),
    { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache, no-transform", "X-Content-Type-Options": "nosniff", "X-Accel-Buffering": "no", "Content-Encoding": "identity" } }
  );
}

