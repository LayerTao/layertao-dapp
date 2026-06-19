// app/api/chat/desearch/route.ts
import { NextResponse } from "next/server";
import { createConversation, saveMessage } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { messages, walletAddress, conversationId } = await req.json();

    let convId = conversationId;
    if (!convId && walletAddress && messages.length > 0) {
      const contentStr = typeof messages.at(-1)?.content === 'string' ? messages.at(-1)?.content : "New Chat";
      const title = contentStr.substring(0, 30) || "New Chat";
      const conv = await createConversation(walletAddress, title);
      convId = conv.id;
    }

    const lastMessage = messages.at(-1)?.content || "";

    if (convId && lastMessage) {
      await saveMessage(convId, "user", lastMessage);
    }

    const response = await fetch(
      `${process.env.DESEARCH_BASE_URL}/desearch/ai/search`,
      {
        method: "POST",
        headers: {
          Authorization: process.env.DESEARCH_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: lastMessage,
          tools: ["web"], // Default fallback tool when not guided by OpenAI router
          streaming: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`DeSearch API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.completion || "No response received from DeSearch.";

    if (convId && reply) {
      await saveMessage(convId, "assistant", reply);
    }

    return NextResponse.json({ 
      reply: reply,
      conversationId: convId,
    });

  } catch (error) {
    console.error("DeSearch API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response from DeSearch." }, 
      { status: 500 }
    );
  }
}
