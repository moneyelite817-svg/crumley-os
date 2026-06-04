"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ── Storage key for passing data from jobs page ──
const DOC_KEY = "cros_active_doc_v1";
const DOCS_KEY = "cros_job_documents_v1";

function saveDocument(doc: any) {
  try {
    const existing = JSON.parse(localStorage.getItem(DOCS_KEY) || "[]");
    const updated = [doc, ...existing.filter((d: any) => d.id !== doc.id)];
    localStorage.setItem(DOCS_KEY, JSON.stringify(updated));
  } catch {}
}

function getInvoiceNumber() {
  const n = parseInt(localStorage.getItem("cros_invoice_counter") || "1000");
  localStorage.setItem("cros_invoice_counter", String(n + 1));
  return `AIOL-${n + 1}`;
}

interface LineItem { description: string; price: number; qty: number; }

export default function InvoicePage() {
  const [job, setJob] = useState<any>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", price: 0, qty: 1 }]);
  const [discount, setDiscount] = useState(0);
  const [includesTax, setIncludesTax] = useState(false);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saved, setSaved] = useState(false);
  const [docId] = useState(`inv-${Date.now()}`);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DOC_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setJob(data);
        // Auto-fill first line item from job
        if (data.jobType === "transfer") {
          setItems([{ description: "Home Staging Transfer — 90-Day Term", price: data.price || 1450, qty: 1 }]);
        } else if (data.jobType === "moving") {
          setItems([{ description: "Moving Services", price: data.price || 800, qty: 1 }]);
        } else {
          setItems([{ description: "Full Turnkey Home Staging Install — 90-Day Term", price: data.price || 2750, qty: 1 }]);
        }
      }
    } catch {}
    const today = new Date();
    const due = new Date(today); due.setDate(due.getDate() + 2);
    setInvoiceDate(today.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }));
    setDueDate(due.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }));
    setInvoiceNo(getInvoiceNumber());
  }, []);

  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const discountAmt = discount;
  const taxAmt = includesTax ? (subtotal - discountAmt) * 0.1 : 0;
  const total = subtotal - discountAmt + taxAmt;

  function addItem() { setItems([...items, { description: "", price: 0, qty: 1 }]); }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, k: keyof LineItem, v: any) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  }

  function handleSave() {
    const doc = {
      id: docId, jobId: job?.id || "", clientId: job?.client || "",
      docType: "invoice", title: `Invoice ${invoiceNo} — ${job?.address?.split(",")[0] || ""}`,
      generatedAt: new Date().toISOString(), status: "draft",
      data: { invoiceNo, invoiceDate, dueDate, items, discount, includesTax, notes, job, total },
    };
    saveDocument(doc);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handlePrint() { window.print(); }

  // ── INPUT STYLES ──
  const inp: any = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontFamily: "system-ui", fontSize: 13, outline: "none", padding: "6px 10px" };

  // ── EDIT MODE ──
  if (mode === "edit") return (
    <main style={{ minHeight: "100vh", background: "#03060f", paddingBottom: 100, fontFamily: "system-ui" }}>
      <div style={{ background: "rgba(3,6,15,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "14px 16px", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => history.back()} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>← Back</button>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#1A5CCC" }}>📄 INVOICE</span>
        <button onClick={() => setMode("preview")} style={{ background: "#1A5CCC", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Preview →</button>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* Invoice Meta */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>INVOICE DETAILS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[{ l: "INVOICE #", v: invoiceNo, set: setInvoiceNo }, { l: "INVOICE DATE", v: invoiceDate, set: setInvoiceDate }, { l: "DUE DATE", v: dueDate, set: setDueDate }].map((f, i) => (
              <div key={i}><div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: 4 }}>{f.l}</div><input value={f.v} onChange={e => f.set(e.target.value)} style={{ ...inp, width: "100%", boxSizing: "border-box" }} /></div>
            ))}
          </div>
        </div>

        {/* Client Info */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>INVOICE TO</div>
          {job ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{job.client || job.agent || "Client"}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{job.phone || "—"}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{job.address}</div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>No job selected. Go back and tap Generate Invoice from a job.</div>
          )}
        </div>

        {/* Line Items */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>LINE ITEMS</div>
          {items.map((item, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 4 }}>DESCRIPTION</div>
              <input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Service description" style={{ ...inp, width: "100%", boxSizing: "border-box", marginBottom: 6 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" }}>
                <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 3 }}>PRICE $</div><input type="number" value={item.price} onChange={e => updateItem(i, "price", parseFloat(e.target.value) || 0)} style={{ ...inp, width: "100%", boxSizing: "border-box" }} /></div>
                <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 3 }}>QTY</div><input type="number" value={item.qty} onChange={e => updateItem(i, "qty", parseInt(e.target.value) || 1)} style={{ ...inp, width: "100%", boxSizing: "border-box" }} /></div>
                {items.length > 1 && <button onClick={() => removeItem(i)} style={{ background: "rgba(255,68,68,0.15)", border: "1px solid rgba(255,68,68,0.3)", color: "#ff6b6b", borderRadius: 8, padding: "8px", cursor: "pointer", fontSize: 13, marginTop: 16 }}>✕</button>}
              </div>
            </div>
          ))}
          <button onClick={addItem} style={{ background: "rgba(26,92,204,0.1)", border: "1px solid rgba(26,92,204,0.3)", color: "#1A5CCC", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, width: "100%", marginTop: 6 }}>+ Add Line Item</button>
        </div>

        {/* Totals */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>TOTALS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 4 }}>DISCOUNT $</div><input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} style={{ ...inp, width: "100%", boxSizing: "border-box" }} /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 16 }}>
              <div onClick={() => setIncludesTax(!includesTax)} style={{ width: 20, height: 20, borderRadius: 4, background: includesTax ? "#1A5CCC" : "rgba(255,255,255,0.1)", border: `1px solid ${includesTax ? "#1A5CCC" : "rgba(255,255,255,0.2)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {includesTax && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Include 10% Tax</span>
            </div>
          </div>
          <div style={{ marginTop: 14, background: "rgba(26,92,204,0.1)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Subtotal</span><span style={{ fontSize: 13 }}>${subtotal.toLocaleString()}</span></div>
            {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Discount</span><span style={{ fontSize: 13, color: "#00d084" }}>-${discount.toLocaleString()}</span></div>}
            {includesTax && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Tax (10%)</span><span style={{ fontSize: 13 }}>${taxAmt.toFixed(2)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 8 }}><span style={{ fontSize: 16, fontWeight: 900, color: "#1A5CCC" }}>TOTAL</span><span style={{ fontSize: 18, fontWeight: 900, color: "#1A5CCC" }}>${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>ADDITIONAL NOTES</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special notes for this invoice..." style={{ ...inp, width: "100%", boxSizing: "border-box", height: 60, resize: "none" as const }} />
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 16px", background: "rgba(3,6,15,0.97)", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10 }}>
        <button onClick={handleSave} style={{ flex: 1, background: saved ? "#00d084" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: saved ? "#000" : "rgba(255,255,255,0.6)", borderRadius: 12, padding: "14px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
          {saved ? "✓ SAVED" : "💾 Save Draft"}
        </button>
        <button onClick={() => setMode("preview")} style={{ flex: 2, background: "#1A5CCC", border: "none", color: "#fff", borderRadius: 12, padding: "14px", cursor: "pointer", fontSize: 15, fontWeight: 900 }}>
          👁 PREVIEW INVOICE
        </button>
      </div>
    </main>
  );

  // ── PREVIEW MODE — matches the uploaded template ──
  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", background: "#fff" }}>
      {/* Action bar (screen only) */}
      <div className="no-print" style={{ background: "#0A1628", padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={() => setMode("edit")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>← Edit</button>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#fff" }}>Invoice #{invoiceNo}</div>
        <button onClick={handleSave} style={{ background: saved ? "#00d084" : "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: saved ? "#000" : "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          {saved ? "✓ Saved" : "💾 Save"}
        </button>
        <button onClick={handlePrint} style={{ background: "#1A5CCC", border: "none", color: "#fff", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 14, fontWeight: 900 }}>🖨 Print / PDF</button>
      </div>

      {/* INVOICE DOCUMENT */}
      <div id="invoice-doc" style={{ maxWidth: 800, margin: "0 auto", background: "#fff" }}>
        {/* Header bar - black with blue diagonal accent */}
        <div style={{ background: "#0d0d1a", height: 60, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "45%", background: "#1A5CCC", clipPath: "polygon(0 0, 85% 0, 70% 100%, 0 100%)", opacity: 0.9 }} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "35%", background: "#2266dd", clipPath: "polygon(0 0, 75% 0, 60% 100%, 0 100%)", opacity: 0.7 }} />
          <div style={{ position: "absolute", left: 8, top: 8, width: "25%", height: 8, background: "#1A5CCC", borderRadius: 4 }} />
          <div style={{ position: "absolute", left: 8, top: 20, width: "18%", height: 5, background: "#1A5CCC", borderRadius: 3 }} />
        </div>

        {/* Main content */}
        <div style={{ padding: "24px 32px" }}>
          {/* Top row: Logo + INVOICE */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div>
              {/* Logo placeholder / branding */}
              <div style={{ width: 70, height: 70, borderRadius: "50%", border: "3px solid #0d0d1a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, background: "#fff" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, marginBottom: 2 }}>
                    {[0,1,2,3].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#0d0d1a" }} />)}
                  </div>
                  <div style={{ fontSize: 5, fontWeight: 900, color: "#0d0d1a", lineHeight: 1.1 }}>ALL IN ONE<br/><span style={{ color: "#1A5CCC" }}>LUXURY</span></div>
                </div>
              </div>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#0d0d1a", letterSpacing: 1 }}>ALL IN ONE <span style={{ color: "#1A5CCC" }}>LUXURY</span></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: "#0d0d1a", letterSpacing: -1, lineHeight: 1 }}>INVOICE</div>
              <div style={{ marginTop: 10 }}>
                {[{ l: "Invoice No:", v: invoiceNo }, { l: "Due Date:", v: dueDate }, { l: "Invoice Date:", v: invoiceDate }].map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "flex-end", gap: 8, fontSize: 13, marginBottom: 2 }}>
                    <span style={{ color: "#666" }}>{f.l}</span><span style={{ fontWeight: 700, color: "#0d0d1a", minWidth: 90, textAlign: "right" }}>{f.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Client info + Payment method */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 32, marginBottom: 28 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14, color: "#0d0d1a", marginBottom: 8, letterSpacing: 0.5 }}>INVOICE TO:</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0d0d1a", marginBottom: 3 }}>{job?.client || job?.agent || "____________________"}</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 2 }}>Phone: {job?.phone || "____________________"}</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 2 }}>Email: ____________________</div>
              <div style={{ fontSize: 13, color: "#555" }}>Address: {job?.address || "____________________"}</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 180 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: "#0d0d1a", marginBottom: 8, letterSpacing: 0.5 }}>PAYMENT METHOD</div>
              <div style={{ fontSize: 13, color: "#333", marginBottom: 3 }}>All Checks Payable to</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0d0d1a" }}>All in One LLC</div>
              <div style={{ fontSize: 13, color: "#333", marginTop: 4 }}>Zelle/Venmo</div>
            </div>
          </div>

          {/* Line items table */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ background: "#1A5CCC", display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "10px 14px", borderRadius: "4px 4px 0 0" }}>
              {["DESCRIPTION", "PRICE", "QTY", "SUBTOTAL"].map(h => (
                <div key={h} style={{ fontSize: 12, fontWeight: 900, color: "#fff", letterSpacing: 0.8, textAlign: h !== "DESCRIPTION" ? "right" as const : "left" as const }}>{h}</div>
              ))}
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "12px 14px", borderBottom: "1px solid #ddd", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <div style={{ fontSize: 13, color: "#0d0d1a" }}>{item.description || "—"}</div>
                <div style={{ fontSize: 13, color: "#0d0d1a", textAlign: "right" }}>${item.price.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: "#0d0d1a", textAlign: "right" }}>{item.qty}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0d0d1a", textAlign: "right" }}>${(item.price * item.qty).toLocaleString()}</div>
              </div>
            ))}
            {/* Empty rows to match template */}
            {items.length < 3 && Array.from({ length: 3 - items.length }).map((_, i) => (
              <div key={`empty-${i}`} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "12px 14px", borderBottom: "1px solid #ddd", height: 38 }} />
            ))}
          </div>

          {/* Bottom: Terms + Totals */}
          <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
            {/* Left: Terms */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 13, color: "#0d0d1a", marginBottom: 8, letterSpacing: 0.5 }}>TERMS AND CONDITIONS</div>
              <div style={{ fontSize: 12, color: "#444", lineHeight: 1.6, marginBottom: 6 }}>
                Please send payment within 48 hrs of agreed date of installation. There will be 10% interest charge per day on late invoice.
              </div>
              {notes && <div style={{ fontSize: 12, color: "#444", lineHeight: 1.6, marginBottom: 8, fontStyle: "italic" }}>{notes}</div>}
              <div style={{ fontWeight: 900, fontSize: 13, color: "#0d0d1a", marginBottom: 10 }}>THANK YOU FOR YOUR BUSINESS</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "#1A5CCC", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>📞</span>
                  <span style={{ fontSize: 13, color: "#0d0d1a", fontWeight: 600 }}>817-897-7575</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "#1A5CCC", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>✉</span>
                  <span style={{ fontSize: 13, color: "#0d0d1a" }}>Alln1luxurystays@gmail.com</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "#1A5CCC", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>📷</span>
                  <span style={{ fontSize: 13, color: "#0d0d1a" }}>@All.inone.luxury.design</span>
                </div>
              </div>
            </div>

            {/* Right: Totals */}
            <div style={{ minWidth: 200 }}>
              {[{ l: "Sub-total :", v: `$${subtotal.toLocaleString()}`, bold: false }, { l: "Discount :", v: discount > 0 ? `-$${discount.toLocaleString()}` : "$0", bold: false }, ...(includesTax ? [{ l: "tax (10%) :", v: `$${taxAmt.toFixed(2)}`, bold: false }] : [])].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderBottom: "1px solid #eee", fontSize: 13, color: "#333" }}>
                  <span>{row.l}</span><span style={{ fontWeight: row.bold ? 900 : 400 }}>{row.v}</span>
                </div>
              ))}
              <div style={{ background: "#1A5CCC", display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: "0 0 6px 6px" }}>
                <span style={{ fontWeight: 900, fontSize: 14, color: "#fff" }}>Total :</span>
                <span style={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              {/* Signature */}
              <div style={{ marginTop: 32, textAlign: "center" }}>
                <div style={{ borderBottom: "2px solid #0d0d1a", marginBottom: 4, paddingBottom: 16 }} />
                <div style={{ fontWeight: 900, fontSize: 14, color: "#0d0d1a", letterSpacing: 1 }}>TERRANCE CRUMLEY</div>
                <div style={{ fontSize: 12, color: "#555", letterSpacing: 0.5 }}>COMPANY CEO</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div style={{ background: "#0d0d1a", height: 50, position: "relative", overflow: "hidden", marginTop: 8 }}>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "45%", background: "#1A5CCC", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 15% 100%)", opacity: 0.9 }} />
          <div style={{ position: "absolute", right: 12, bottom: 6, width: "20%", height: 6, background: "#1A5CCC", borderRadius: 3 }} />
          <div style={{ position: "absolute", right: 12, bottom: 16, width: "14%", height: 4, background: "#1A5CCC", borderRadius: 2 }} />
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          #invoice-doc { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
