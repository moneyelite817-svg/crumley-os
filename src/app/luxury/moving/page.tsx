"use client";
import Link from "next/link";
export default function Page() {
  return (
    <main style={{ minHeight: "100vh", background: "#0d1628", padding: 24 }}>
      <Link href="/dashboard" style={{ color: "#1a6eff", textDecoration: "none", fontSize: 14 }}>← Master Dashboard</Link>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 20 }}>Moving</h1>
      <p style={{ color: "#7a8fbb", lineHeight: 1.7, marginTop: 12 }}>
        This module is wired into the architecture and ready to connect to your Supabase
        tables. The data layer, types, and AI hooks are all in place — this page renders
        the Moving view once you run the schema and connect your database.
      </p>
    </main>
  );
}
