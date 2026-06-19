// app/api/chat/bitmind/route.ts
import { NextResponse } from "next/server";
import { createConversation, saveMessage } from "@/lib/supabase";

const VIDEO_EXTENSIONS = /\.(mp4|m4v|webm|mov|avi|mkv|ogv)(\?.*)?$/i;

function isVideoInput(input: string): boolean {
  if (input.startsWith("data:video/")) return true;
  return VIDEO_EXTENSIONS.test(input);
}

function formatReply(data: { isAI: boolean; confidence: number }, mediaType: string) {
  const confidence = (data.confidence * 100).toFixed(1);
  const conf = parseFloat(confidence);
  const confPercent = `${confidence}%`;
  const prefix = mediaType === "video" ? "Video" : "Image";

  if (data.isAI && conf >= 90)
    return `**AI-Generated ${prefix}** — ${confPercent} confidence\n\nHigh-confidence detection of synthetic origin.`;
  if (data.isAI && conf >= 70)
    return `**Likely AI-Generated ${prefix}** — ${confPercent} confidence\n\nMultiple indicators point to synthetic generation.`;
  if (data.isAI)
    return `**Possibly AI-Generated ${prefix}** — ${confPercent} confidence\n\nResults lean synthetic, though evidence is limited.`;
  if (!data.isAI && conf >= 90)
    return `**Authentic ${prefix}** — ${confPercent} confidence\n\nNo indications of AI generation detected.`;
  if (!data.isAI && conf >= 70)
    return `**Likely Authentic ${prefix}** — ${confPercent} confidence\n\nThe ${mediaType} appears genuine with minimal synthetic markers.`;
  return `**Uncertain ${prefix}** — ${confPercent} confidence\n\nInconclusive result; could not be reliably classified.`;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Multipart video file upload
    if (contentType.startsWith("multipart/form-data")) {
      const formData = await req.formData();
      const videoFile = formData.get("video") as File | null;
      const walletAddress = formData.get("walletAddress") as string | null;
      const conversationId = formData.get("conversationId") as string | null;

      let convId = conversationId;
      if (!convId && walletAddress) {
        const conv = await createConversation(walletAddress, `Video: ${videoFile?.name || 'upload'}`);
        convId = conv.id;
      }

      if (!videoFile) {
        return NextResponse.json({ error: "No video file provided." }, { status: 400 });
      }

      if (convId) {
        await saveMessage(convId, "user", `Video: ${videoFile.name}`);
      }

      const bitmindForm = new FormData();
      bitmindForm.append("video", videoFile, videoFile.name);

      const response = await fetch("https://api.bitmind.ai/detect-video", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.BITMIND_API_KEY}`,
        },
        body: bitmindForm,
      });

      if (!response.ok) {
        throw new Error(`Bitmind video API error: ${response.statusText}`);
      }

      const data = await response.json();
      const reply = formatReply(data, "video");
      if (convId) await saveMessage(convId, "assistant", reply);

      return NextResponse.json({
        reply: reply,
        result: data,
        subnetID: "subnet-66",
        conversationId: convId,
      });
    }

    // JSON body — image or video URL
    const { image, messages, walletAddress, conversationId } = await req.json();
    
    let convId = conversationId;
    if (!convId && walletAddress) {
      const contentStr = typeof messages?.at(-1)?.content === 'string' ? messages?.at(-1)?.content : "Image Detection";
      const title = contentStr.substring(0, 30) || "Image Detection";
      const conv = await createConversation(walletAddress, title);
      convId = conv.id;
    }

    const input = (image || messages?.at(-1)?.content || "").trim();

    if (convId && input) {
      await saveMessage(convId, "user", messages?.at(-1)?.content || "Image uploaded", image);
    }

    if (!input) {
      return NextResponse.json(
        { error: "No image or video provided. Upload a file or paste a URL.", reply: "**Invalid input** — No image or video URL was provided. Please upload a file or paste a valid URL." },
        { status: 400 }
      );
    }

    if (!input.startsWith("data:") && !input.startsWith("http")) {
      return NextResponse.json(
        { reply: "**Invalid input** — The provided text does not appear to be a valid image or video URL. Paste a direct link to an image or video file.", error: "Invalid URL format." },
        { status: 400 }
      );
    }

    const isVideo = isVideoInput(input);

    const endpoint = isVideo
      ? "https://api.bitmind.ai/detect-video"
      : "https://api.bitmind.ai/detect-image";

    const body = isVideo ? { video: input } : { image: input };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BITMIND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Bitmind API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = formatReply(data, isVideo ? "video" : "image");
    
    if (convId) await saveMessage(convId, "assistant", reply);

    return NextResponse.json({
      reply: reply,
      result: data,
      subnetID: "subnet-66",
      conversationId: convId,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Bitmind API Error:", message);
    return NextResponse.json(
      {
        error: message,
        reply: "**Detection failed** — Unable to process this file or URL. Ensure the link points to a valid, publicly accessible image or video.",
      },
      { status: 500 }
    );
  }
}
