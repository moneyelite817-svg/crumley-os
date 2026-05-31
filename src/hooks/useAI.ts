// Client hook to call the secure AI route
"use client";
import { useState } from "react";

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function generate(prompt: string) {
    setLoading(true); setResult(""); setError("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data.text);
    } catch {
      setError("Connection error. Try again.");
    }
    setLoading(false);
  }

  return { loading, result, error, generate, setResult };
}
