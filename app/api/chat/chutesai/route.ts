// app/api/chat/chutesai/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createConversation, saveMessage, updateConversationSummary, supabase } from "@/lib/supabase";

const client = new OpenAI({
  apiKey: process.env.CHUTES_API_KEY,
  baseURL: process.env.CHUTES_BASE_URL,
});

async function summarizeBackground(convId: string, messagesToSummarize: any[], oldSummary: string) {
  try {
    const textToSummarize = messagesToSummarize.map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `Summarize the following old conversation context into a concise summary (max 150 words). Include important facts, user preferences, and key topics discussed.\n\nOld Summary: ${oldSummary}\n\nNew Messages to compress:\n${textToSummarize}`;
    
    const response = await client.chat.completions.create({
      model: "Qwen/Qwen3-32B-TEE",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });
    
    const newSummary = response.choices[0].message.content;
    if (newSummary) {
      await updateConversationSummary(convId, newSummary);
    }
  } catch(e) {
    console.error("Background summarization failed:", e);
  }
}

export async function POST(req: Request) {
  try {
    const { messages, model, walletAddress, conversationId } = await req.json();

    let convId = conversationId;
    let summary = "";
    
    if (!convId && walletAddress && messages.length > 0) {
      const contentStr = typeof messages.at(-1)?.content === 'string' ? messages.at(-1)?.content : "New Chat";
      const title = contentStr.substring(0, 30) || "New Chat";
      const conv = await createConversation(walletAddress, title);
      convId = conv.id;
    } else if (convId) {
      const { data } = await supabase.from('conversations').select('summary').eq('id', convId).single();
      if (data) summary = data.summary || "";
    }

    const lastMessage = messages.at(-1);
    if (convId && lastMessage) {
      await saveMessage(convId, "user", lastMessage.content);
    }

    // Context Window Management
    let messagesForSubnet = messages;
    const WINDOW_SIZE = 20;
    const userAssistMsgs = messages.filter((m: any) => m.role !== 'system');
    const msgsToKeep = userAssistMsgs.slice(-WINDOW_SIZE);
    const msgsToSummarize = userAssistMsgs.slice(0, -WINDOW_SIZE);

    if (msgsToSummarize.length > 0 && convId) {
      summarizeBackground(convId, msgsToSummarize, summary);
    }

    let sysPrompt = "You are a helpful AI assistant.";
    if (summary) {
      sysPrompt += `\n\nPrevious Conversation Summary:\n${summary}`;
    }

    messagesForSubnet = [
      { role: 'system', content: sysPrompt },
      ...msgsToKeep
    ];

    const response = await client.chat.completions.create({
      model: model, 
      messages: messagesForSubnet,
      max_tokens: 1024,
      temperature: 0.5,
    });

    const reply = response.choices[0].message.content;
    if (convId && reply) {
      await saveMessage(convId, "assistant", reply);
    }

    return NextResponse.json({ 
      reply: reply,
      subnetID: "subnet-64",
      conversationId: convId
    });

  } catch (error) {
    console.error("Chutes API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response from Chutes." }, 
      { status: 500 }
    );
  }
}
