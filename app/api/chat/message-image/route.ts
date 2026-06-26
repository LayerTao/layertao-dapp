// GET /api/chat/message-image?id=xxx
// Fetches a single message's base64 image. Called lazily by the UI
// when displaying a historical image message — avoids pulling MBs
// of base64 for every conversation load.

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("id");

  if (!messageId) {
    return NextResponse.json({ error: "Missing message id" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("image")
      .eq("id", messageId)
      .single();

    if (error) throw error;

    if (!data?.image) {
      return NextResponse.json({ image: null }, { status: 404 });
    }

    return NextResponse.json({ image: data.image });
  } catch (error) {
    console.error("Message image fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
