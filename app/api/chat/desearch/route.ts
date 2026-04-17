// app/api/chat/desearch/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const lastMessage = messages.at(-1)?.content || "";

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

    return NextResponse.json({ 
      reply: data.completion || "No response received from DeSearch.",
    });

  } catch (error) {
    console.error("DeSearch API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response from DeSearch." }, 
      { status: 500 }
    );
  }
}
