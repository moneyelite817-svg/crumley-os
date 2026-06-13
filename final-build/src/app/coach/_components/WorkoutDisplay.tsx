// ══════════════════════════════════════════════════════
// SHARED WORKOUT DISPLAY — import this in both
// coach/roster/page.tsx and coach/program/page.tsx
// ══════════════════════════════════════════════════════

export interface WorkoutSection {
  title: string;
  emoji: string;
  time: string;
  color: string;
  lines: string[];
}

const SECTION_MAP: Record<string, { color: string; emoji: string }> = {
  "ACTIVATION":    { color: "#f39c12", emoji: "⚡" },
  "WARM":          { color: "#f39c12", emoji: "🔥" },
  "MOBILITY":      { color: "#9b59b6", emoji: "🧘" },
  "NEURAL":        { color: "#e74c3c", emoji: "💥" },
  "POWER":         { color: "#e74c3c", emoji: "💥" },
  "SPEED":         { color: "#00d084", emoji: "🏃" },
  "AGILITY":       { color: "#00d084", emoji: "🏃" },
  "STRENGTH A":    { color: "#1a6eff", emoji: "💪" },
  "STRENGTH B":    { color: "#4a8fff", emoji: "💪" },
  "STRENGTH":      { color: "#1a6eff", emoji: "💪" },
  "CONDITIONING":  { color: "#e74c3c", emoji: "🔥" },
  "CORE":          { color: "#f0c040", emoji: "🧠" },
  "COOLDOWN":      { color: "#9b59b6", emoji: "🧊" },
  "RECOVERY":      { color: "#9b59b6", emoji: "🧊" },
  "OVERVIEW":      { color: "rgba(255,255,255,0.4)", emoji: "📋" },
  "SESSION":       { color: "#1a6eff", emoji: "📋" },
  "DAY":           { color: "#1a6eff", emoji: "📅" },
  "WEEK":          { color: "#1a6eff", emoji: "🗓" },
  "COACH":         { color: "#f0c040", emoji: "🎯" },
  "NEXT":          { color: "#00d084", emoji: "📅" },
  "BENCHMARK":     { color: "#f0c040", emoji: "📊" },
  "TEST":          { color: "#f0c040", emoji: "📊" },
};

// ── Detect if a string is workout-formatted content ──
export function isWorkoutContent(text: string): boolean {
  return (
    text.includes("━━━") ||
    /^#{1,3}\s+.*(WARM|POWER|STRENGTH|SPEED|CONDITIONING|CORE|COOLDOWN|ACTIVATION)/im.test(text) ||
    (text.includes("SESSION PLAN") && text.includes("DB + Bands"))
  );
}

// ── Parse raw text into section cards ──
export function parseWorkout(text: string): WorkoutSection[] {
  if (!text) return [];
  const sections: WorkoutSection[] = [];
  const lines = text.split("\n");
  let current: WorkoutSection | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Match ━━━ TITLE (X min) ━━━ OR **BOLD TITLE**
    const headerMatch =
      line.match(/━+\s*(.+?)\s*━+/) ||
      (line.startsWith("**") && line.endsWith("**") ? [null, line.replace(/\*\*/g, "")] : null) ||
      // Also match ### style headers from legacy format
      line.match(/^#{1,3}\s+(.+)/);

    if (headerMatch) {
      if (current && current.lines.length > 0) sections.push(current);
      const title = (headerMatch[1] || "").replace(/[*_#]/g, "").trim();
      const timeMatch = title.match(/\((\d+\s*min)\)/i) || title.match(/\|\s*(\d+\s*min)/i);
      const time = timeMatch ? timeMatch[1] : "";
      const cleanTitle = title.replace(/\(.*?\)/g, "").replace(/\|.*$/, "").replace(/[━─=\-]{2,}/g, "").trim();
      if (!cleanTitle || cleanTitle.length < 2) continue;

      let color = "#1a6eff", emoji = "📌";
      for (const [key, val] of Object.entries(SECTION_MAP)) {
        if (cleanTitle.toUpperCase().includes(key)) { color = val.color; emoji = val.emoji; break; }
      }
      current = { title: cleanTitle, emoji, time, color, lines: [] };
      continue;
    }

    // Skip separator lines
    if (line.match(/^[━─=\|\-]{3,}$/) || line.match(/^\*{3,}$/)) continue;

    if (current) {
      current.lines.push(line);
    } else {
      // Pre-section content
      current = { title: "SESSION OVERVIEW", emoji: "📋", time: "", color: "rgba(255,255,255,0.4)", lines: [line] };
    }
  }
  if (current && current.lines.length > 0) sections.push(current);
  return sections;
}

// ── Render a single line inside a section ──
function ExerciseLine({ line }: { line: string }) {
  // Detect exercise lines: 1. Name or A1. Name or B2. Name
  const isExercise = /^[A-Z]?\d+[\.\):]|^[A-Z]\d[\.\):]|^\d+\.\s+[A-Z]/i.test(line);

  if (!isExercise) {
    // Table rows from legacy format — flatten them
    if (line.startsWith("|") && !line.match(/^[\|\-\s]+$/)) {
      const cells = line.split("|").map(c => c.trim()).filter(c => c && !c.match(/^-+$/));
      if (cells.length >= 2) {
        const [exName, ...rest] = cells;
        return (
          <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>{exName}</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {rest.map((cell, i) => {
                const isWeight = /\d+\s*(lb|lbs|kg)/i.test(cell) && cell.length < 20;
                const isRest = /rest|sec|min/i.test(cell) && cell.length < 20;
                const isCue = cell.length > 20;
                return (
                  <span key={i} style={{ fontSize: 12, padding: "4px 11px", borderRadius: 100, fontWeight: isWeight || isRest ? 700 : 400, background: isWeight ? "rgba(26,110,255,0.2)" : isRest ? "rgba(240,192,64,0.15)" : isCue ? "rgba(0,208,132,0.1)" : "rgba(255,255,255,0.08)", color: isWeight ? "#6699ff" : isRest ? "#f0c040" : isCue ? "#00d084" : "rgba(255,255,255,0.7)" }}>
                    {cell}
                  </span>
                );
              })}
            </div>
          </div>
        );
      }
    }

    const isBullet = line.startsWith("•") || line.startsWith("-");
    const cleaned = line.replace(/^[•\-]\s*/, "").replace(/\*\*/g, "");
    return (
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 3, paddingLeft: isBullet ? 8 : 0 }}>
        {isBullet ? "• " : ""}{cleaned}
      </div>
    );
  }

  // Exercise line — extract name and detail chips
  const namePart = line.replace(/^[A-Z]?\d+[\.\)\:\s]*/i, "");
  const segments = namePart.split(/\s+[@—–\|]\s+/);
  const name = segments[0].trim();
  const details = segments.slice(1).join(" ");

  return (
    <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>{name}</div>
      {details && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
          {details.split(/[|,]/).map((d, i) => {
            const t = d.trim();
            if (!t) return null;
            const isWeight = /\d+\s*(lb|lbs|kg|x\d)/i.test(t) && t.length < 22;
            const isRest = /rest/i.test(t);
            const isCue = t.length > 25;
            return (
              <span key={i} style={{ fontSize: 12, padding: "4px 11px", borderRadius: 100, fontWeight: isWeight || isRest ? 700 : 400, background: isWeight ? "rgba(26,110,255,0.2)" : isRest ? "rgba(240,192,64,0.15)" : isCue ? "rgba(0,208,132,0.1)" : "rgba(255,255,255,0.08)", color: isWeight ? "#6699ff" : isRest ? "#f0c040" : isCue ? "#00d084" : "rgba(255,255,255,0.7)" }}>
                {t}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// THE UNIFIED DISPLAY COMPONENT
// Use this everywhere a workout needs to be shown.
// ══════════════════════════════════════════════════════
export function WorkoutDisplay({ text, compact = false }: { text: string; compact?: boolean }) {
  const sections = parseWorkout(text);

  if (!sections.length) {
    // Fallback: plain text for non-workout content
    return (
      <div style={{ background: "#0d0d14", border: "1px solid #222", borderRadius: 14, padding: "16px", fontSize: 14, lineHeight: 1.9, color: "#fff", whiteSpace: "pre-wrap", fontFamily: "system-ui", maxHeight: compact ? "45vh" : "none", overflowY: compact ? "auto" : "visible" }}>
        {text}
      </div>
    );
  }

  return (
    <div>
      {sections.map((sec, i) => (
        <div key={i} style={{ background: "#0d0d14", border: `1px solid ${sec.color}33`, borderRadius: compact ? 12 : 16, marginBottom: compact ? 10 : 14, overflow: "hidden" }}>
          {/* Section header */}
          <div style={{ background: `${sec.color}18`, borderBottom: `1px solid ${sec.color}22`, padding: compact ? "10px 14px" : "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: compact ? 18 : 22 }}>{sec.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: compact ? 13 : 15, fontWeight: 900, color: sec.color }}>{sec.title}</div>
              {sec.time && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>⏱ {sec.time}</div>}
            </div>
          </div>
          {/* Exercises */}
          <div style={{ padding: compact ? "12px 14px" : "14px 16px" }}>
            {sec.lines.map((line, j) => <ExerciseLine key={j} line={line} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
