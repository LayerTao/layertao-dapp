// app/api/chat/chutesai/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.CHUTES_API_KEY,
  baseURL: process.env.CHUTES_BASE_URL,
});

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    const response = await client.chat.completions.create({
      model: model, 
      messages: messages,
      max_tokens: 1024,
      temperature: 0.5,
    });

    return NextResponse.json({ 
      reply: response.choices[0].message.content,
      subnetID: "subnet-64" 
    });

  } catch (error) {
    console.error("Chutes API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response from Chutes." }, 
      { status: 500 }
    );
  }
}
