// app/api/chat/imagegen/route.ts
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
      "https://chutes-z-image-turbo.chutes.ai/generate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CHUTES_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: lastMessage,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Image generation API error: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString("base64");
    const imageBase64 = `data:${contentType};base64,${base64}`;

    if (convId && imageBase64) {
      await saveMessage(convId, "assistant", "", imageBase64);
    }

    return NextResponse.json({
      imageBase64: imageBase64,
      subnetID: "subnet-65",
      conversationId: convId,
    });

  } catch (error) {
    console.error("Image Generation API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate image." },
      { status: 500 }
    );
  }
}
