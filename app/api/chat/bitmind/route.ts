// app/api/chat/bitmind/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image, messages } = await req.json();

    const imageInput = image || messages?.at(-1)?.content || "";

    const response = await fetch("https://api.bitmind.ai/detect-image", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BITMIND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageInput }),
    });

    if (!response.ok) {
      throw new Error(`Bitmind API error: ${response.statusText}`);
    }

    const data = await response.json();

    const isAI = data.isAI;
    // console.log("Bitmind API Response:", data);
    const confidence = (data.confidence * 100).toFixed(1);
    const conf = parseFloat(confidence);

    const confPercent = `${confidence}%`;
    let verdict: string;
    let detail: string;

    if (isAI && conf >= 90) {
      verdict = `**AI-Generated** — ${confPercent} confidence`;
      detail = "High-confidence detection of synthetic origin.";
    } else if (isAI && conf >= 70) {
      verdict = `**Likely AI-Generated** — ${confPercent} confidence`;
      detail = "Multiple indicators point to synthetic generation.";
    } else if (isAI) {
      verdict = `**Possibly AI-Generated** — ${confPercent} confidence`;
      detail = "Results lean synthetic, though evidence is limited.";
    } else if (!isAI && conf >= 90) {
      verdict = `**Authentic** — ${confPercent} confidence`;
      detail = "No indications of AI generation detected.";
    } else if (!isAI && conf >= 70) {
      verdict = `**Likely Authentic** — ${confPercent} confidence`;
      detail = "The image appears genuine with minimal synthetic markers.";
    } else {
      verdict = `**Uncertain** — ${confPercent} confidence`;
      detail = "Inconclusive result; the image could not be reliably classified.";
    }

    const reply = `${verdict}\n\n${detail}`;

    return NextResponse.json({
      reply,
      result: data,
      subnetID: "subnet-66",
    });

  } catch (error) {
    console.error("Bitmind API Error:", error);
    return NextResponse.json(
      { error: "Failed to detect image." },
      { status: 500 }
    );
  }
}
