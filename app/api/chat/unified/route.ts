// app/api/chat/route.ts

import OpenAI from "openai";
import { NextResponse } from "next/server";
// import { availableModels } from "../../../lib/utils";
import {tools} from "@/lib/utils";

// Router (OpenAI)
const routerClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chutes subnet
const chutesClient = new OpenAI({
  apiKey: process.env.CHUTES_API_KEY,
  baseURL: process.env.CHUTES_BASE_URL,
});



async function callChutes(messages: OpenAI.Chat.ChatCompletionMessageParam[], model: string) {
  // console.log("Calling Chutes with model:", model);
  // console.log("Messages:", messages);
  const response = await chutesClient.chat.completions.create({
    model: model,
    messages,
    max_tokens: 1000,
    temperature: 0.5,
  });

  return response.choices[0].message.content;
}



async function callImageGen(prompt: string) {
  const response = await fetch(
    "https://chutes-z-image-turbo.chutes.ai/generate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHUTES_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    }
  );

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

async function callBitmind(imageInput: string) {
  const response = await fetch("https://api.bitmind.ai/detect-image", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BITMIND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: imageInput }),
  });

  const data = await response.json();
  const isAI = data.isAI;
  const confidence = (data.confidence * 100).toFixed(1);
  const conf = parseFloat(confidence);
  const confPercent = `${confidence}%`;

  if (isAI && conf >= 90) return `**AI-Generated** — ${confPercent} confidence\n\nHigh-confidence detection of synthetic origin.`;
  if (isAI && conf >= 70) return `**Likely AI-Generated** — ${confPercent} confidence\n\nMultiple indicators point to synthetic generation.`;
  if (isAI) return `**Possibly AI-Generated** — ${confPercent} confidence\n\nResults lean synthetic, though evidence is limited.`;
  if (!isAI && conf >= 90) return `**Authentic** — ${confPercent} confidence\n\nNo indications of AI generation detected.`;
  if (!isAI && conf >= 70) return `**Likely Authentic** — ${confPercent} confidence\n\nThe image appears genuine with minimal synthetic markers.`;
  return `**Uncertain** — ${confPercent} confidence\n\nInconclusive result; the image could not be reliably classified.`;
}

async function callDesearch(query:  string, tools: string[]) {
  // console.log("Calling DeSearch with query:", query);
  // console.log("Available tools:", tools);

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
          tools: tools,
          streaming: false,
        }),
      }
    );

    const data = await response.json();
    // console.log("Subnet 2 response:", data);

    return data;
}



export async function POST(req: Request) {
  const encoder = new TextEncoder();

  return new Response(new ReadableStream({
    async start(controller) {
      const sendChunk = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        const { messages, model, image } = await req.json();

        /*
        STEP 1 — Router decides which subnet to use
        */
        const lastMessage = messages.at(-1);
        // console.log("Received message for routing:", lastMessage);

        const routerResponse =
          await routerClient.chat.completions.create({
            model: "gpt-4o-mini",

            messages: [
              {
      role: "system",
      content: `You are a request router. NEVER answer users directly. Always return a tool call.

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

TOOL SELECTION (pick only what fits — never include all):
- "web"         → broad facts, news, general queries — almost always include
- "reddit"      → opinions, recommendations, community experience
- "twitter"     → breaking news, trends, real-time reactions
- "youtube"     → tutorials, how-to, video content
- "arxiv"       → academic, scientific, or ML research
- "hackernews"  → tech news, dev/startup discussions
- "wikipedia"   → definitions, history, established facts

Always set "query" to a clean, concise search-optimized version of the user's question.

WHEN TO USE "route_to_chutes":

Use for everything else. Select the best model based on the task:
- Coding / technical      → DeepSeek models
- Creative / conversational → high-capability creative models
- General reasoning / mixed → best balanced model

Use ONLY models from the provided list.
Pass the EXACT model id in the "model" field. Never leave it empty.

HARD RULES:
- Never generate a user-facing answer.
- Never invent model names.
- Output must always be a valid tool call.
- When in doubt between chutes and desearch → prefer desearch if recency matters, chutes otherwise.`,
    },
              lastMessage,
            ],
            tools,
            tool_choice: "auto",
            temperature: 0,
          });

        // console.log("Router response:", routerResponse);

        const toolCall =
          routerResponse.choices[0].message.tool_calls?.[0];

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
        
        // IMMEDIATE SEND: Broadcast the chosen subnet
        sendChunk({ type: "routing", subnetID });


        const args = JSON.parse(
          toolCall.function.arguments
        );
    

        let result;

        switch (toolCall.function.name) {
          case "route_to_chutes":
            result = await callChutes(
              messages,
              args.model
            );
            break;

          case "route_to_desearch":
            // console.log("Routing to DeSearch");
            const desearchResult = await callDesearch(
              lastMessage?.content,
              args.tools
            );
            result = desearchResult?.completion;
            break;

          case "route_to_imagegen":
            result = await callImageGen(lastMessage?.content);
            sendChunk({ type: "image", imageBase64: result });
            controller.close();
            return;

          case "route_to_bitmind":
            result = await callBitmind(image || lastMessage?.content);
            break;

          default:
            sendChunk({ error: "Unknown subnet." });
            controller.close();
            return;
        }
        // console.log("Subnet response:", result);

        //  Send the final AI output
        sendChunk({ type: "content", reply: result });
        controller.close();

      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Router Error:", message);
        sendChunk({ error: `Failed to route request: ${message}` });
        controller.close();
      }
    }
  }), {
    headers: { "Content-Type": "application/x-ndjson" }
  });
}