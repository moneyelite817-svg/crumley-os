// src/app/api/ai/route.ts
// ══════════════════════════════════════════════════════
// ANTHROPIC API ROUTE — supports text + vision (images)
// Add to .env.local: ANTHROPIC_API_KEY=sk-ant-...
// ══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      imageBase64,    // base64 string (no data: prefix)
      imageMediaType, // "image/jpeg" | "image/png" | "image/webp"
      model,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: true, message: "prompt required" }, { status: 400 });
    }

    // Build content array — text-only or text + image
    const content: Anthropic.MessageParam["content"] = [];

    if (imageBase64) {
      content.push({
        type: "image",
        source: {
          type:       "base64",
          media_type: (imageMediaType || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data:       imageBase64,
        },
      });
    }

    content.push({ type: "text", text: prompt });

    const message = await client.messages.create({
      model:      model || "claude-opus-4-5",
      max_tokens: 1500,
      messages:   [{ role: "user", content }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("");

    return NextResponse.json({ text });

  } catch (err: any) {
    const msg = err?.message || "Unknown error";
    const isCredit = msg.includes("credit") || msg.includes("billing") || msg.includes("quota");
    return NextResponse.json(
      { error: true, message: msg, isCredit },
      { status: 500 }
    );
  }
}
