// app/api/chat/imagegen/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const lastMessage = messages.at(-1)?.content || "";

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

    return NextResponse.json({
      imageBase64: `data:${contentType};base64,${base64}`,
      subnetID: "subnet-65",
    });

  } catch (error) {
    console.error("Image Generation API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate image." },
      { status: 500 }
    );
  }
}
