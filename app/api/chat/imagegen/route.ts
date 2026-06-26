// app/api/chat/imagegen/route.ts
import { NextResponse } from "next/server";
import { createConversation, saveMessage } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { message, walletAddress, conversationId } = await req.json();
    const prompt = message?.content || "";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    let convId: string | null = conversationId ?? null;

    if (!convId && walletAddress) {
      const title = prompt.substring(0, 30) || "New Chat";
      const conv = await createConversation(walletAddress, title);
      convId = conv.id;
    }

    if (convId) {
      await saveMessage(convId, "user", prompt);
    }

    const apiKey = process.env.CHUTES_API_KEY;
    if (!apiKey) throw new Error("Missing CHUTES_API_KEY");

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

    const response = await fetch(
      "https://vonkaiser-z-image-turbo.chutes.ai/generate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Image generation failed: ${response.status} ${errText}`);
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Image Generation API Error:", msg);
    return NextResponse.json(
      { error: "Failed to generate image." },
      { status: 500 }
    );
  }
}
