// ══════════════════════════════════════════════════════════
// AI API ROUTE — secure server-side Anthropic calls
// Never exposes the API key to the browser
// ══════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n");

    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("AI route error:", e);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
