"use client";
import { useState, useEffect } from "react";

const DOC_KEY = "cros_active_doc_v1";
const DOCS_KEY = "cros_job_documents_v1";

function saveDocument(doc: any) {
  try {
    const e = JSON.parse(localStorage.getItem(DOCS_KEY) || "[]");
    localStorage.setItem(DOCS_KEY, JSON.stringify([doc, ...e.filter((d: any) => d.id !== doc.id)]));
  } catch {}
}

function todayFmt() {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function ContractPage() {
  const [job, setJob] = useState<any>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saved, setSaved] = useState(false);
  const [docId] = useState(`ctr-${Date.now()}`);
  const [fields, setFields] = useState({
    ownerName: "", ownerName2: "",
    propertyAddress: "", cityState: "Dallas, Texas",
    referredBy: "", installDate: "", endDate: "",
    stagingFee: "", depositPaid: "", renewalRate: "1,450",
    agreementDate: todayFmt(),
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DOC_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setJob(data);
        setFields(prev => ({
          ...prev,
          propertyAddress: data.address || "",
          referredBy: data.agent || data.referral || "",
          installDate: data.installDate || "",
          endDate: data.endDate || "",
          stagingFee: data.price?.toString() || "2,750",
          depositPaid: data.deposit?.toString() || "0",
        }));
      }
    } catch {}
  }, []);

  function f(k: string, v: string) { setFields(p => ({ ...p, [k]: v })); }
  const balance = Math.max(0, parseFloat(fields.stagingFee || "0") - parseFloat(fields.depositPaid || "0"));

  function handleSave() {
    const doc = {
      id: docId, jobId: job?.id || "", docType: "contract",
      title: `Staging Agreement — ${fields.propertyAddress?.split(",")[0] || "Property"}`,
      generatedAt: new Date().toISOString(), status: "draft",
      data: { fields, job },
    };
    saveDocument(doc);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inp2: any = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", fontFamily: "system-ui", fontSize: 13, outline: "none", padding: "7px 10px", width: "100%", boxSizing: "border-box" as const };
  const lbl2: any = { fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 4, display: "block" };

  if (mode === "edit") return (
    <main style={{ minHeight: "100vh", background: "#03060f", paddingBottom: 100, fontFamily: "system-ui" }}>
      <div style={{ background: "rgba(3,6,15,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "14px 16px", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => history.back()} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>← Back</button>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#1A5CCC" }}>📋 STAGING AGREEMENT</span>
        <button onClick={() => setMode("preview")} style={{ background: "#1A5CCC", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Preview →</button>
      </div>
      <div style={{ padding: "20px 16px" }}>
        {job && (
          <div style={{ background: "rgba(26,92,204,0.08)", border: "1px solid rgba(26,92,204,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1A5CCC", marginBottom: 4 }}>AUTO-FILLED FROM JOB</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{job.address} · {job.agent || "Agent"} · ${job.price?.toLocaleString()}</div>
          </div>
        )}
        {[
          { section: "PROPERTY & PARTIES", fields: [
            { l: "Owner Name #1", k: "ownerName", p: "Property owner full name" },
            { l: "Owner Name #2 (if applicable)", k: "ownerName2", p: "Second owner name" },
            { l: "Property Address", k: "propertyAddress", p: "123 Main St" },
            { l: "City, State", k: "cityState", p: "Dallas, Texas" },
            { l: "Referred By (Realtor/Agent)", k: "referredBy", p: "Leston Eustache" },
          ]},
          { section: "AGREEMENT DATES & FEES", fields: [
            { l: "Agreement Date", k: "agreementDate", p: todayFmt() },
            { l: "Install Date", k: "installDate", p: "e.g. June 15, 2026" },
            { l: "End Date (90 days)", k: "endDate", p: "e.g. September 15, 2026" },
            { l: "Staging Fee ($)", k: "stagingFee", p: "2750" },
            { l: "Deposit Paid ($)", k: "depositPaid", p: "0" },
            { l: "Renewal Rate ($)", k: "renewalRate", p: "1450" },
          ]},
        ].map(section => (
          <div key={section.section} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>{section.section}</div>
            {section.fields.map(field => (
              <div key={field.k} style={{ marginBottom: 10 }}>
                <label style={lbl2}>{field.l}</label>
                <input value={(fields as any)[field.k]} onChange={e => f(field.k, e.target.value)} placeholder={field.p} style={inp2} />
              </div>
            ))}
          </div>
        ))}
        <div style={{ background: "rgba(26,92,204,0.08)", border: "1px solid rgba(26,92,204,0.2)", borderRadius: 12, padding: "14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Staging Fee</span><span style={{ fontSize: 13 }}>${parseFloat(fields.stagingFee||"0").toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Deposit Paid</span><span style={{ fontSize: 13, color: "#00d084" }}>-${parseFloat(fields.depositPaid||"0").toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: "#1A5CCC" }}>BALANCE DUE</span><span style={{ fontSize: 17, fontWeight: 900, color: balance > 0 ? "#f0c040" : "#00d084" }}>${balance.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 16px", background: "rgba(3,6,15,0.97)", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10 }}>
        <button onClick={handleSave} style={{ flex: 1, background: saved ? "#00d084" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: saved ? "#000" : "rgba(255,255,255,0.6)", borderRadius: 12, padding: "14px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>{saved ? "✓ SAVED" : "💾 Save"}</button>
        <button onClick={() => setMode("preview")} style={{ flex: 2, background: "#1A5CCC", border: "none", color: "#fff", borderRadius: 12, padding: "14px", cursor: "pointer", fontSize: 15, fontWeight: 900 }}>👁 PREVIEW CONTRACT</button>
      </div>
    </main>
  );

  // ── PREVIEW — matches the branded contract ──
  const { ownerName, ownerName2, propertyAddress, cityState, referredBy, installDate, endDate, stagingFee, depositPaid, renewalRate, agreementDate } = fields;
  const NAVY = "#0A1628"; const BLUE = "#1A5CCC"; const LBLUE = "#E8EEF8";
  const s = (text: string) => ({ fontFamily: "Georgia, serif", fontSize: 13, color: NAVY, lineHeight: 1.7 });

  return (
    <div style={{ fontFamily: "Georgia, serif", minHeight: "100vh", background: "#fff" }}>
      <div className="no-print" style={{ background: NAVY, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={() => setMode("edit")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>← Edit</button>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#fff" }}>Staging Agreement</div>
        <button onClick={handleSave} style={{ background: saved ? "#00d084" : "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: saved ? "#000" : "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{saved ? "✓ Saved" : "💾 Save"}</button>
        <button onClick={() => window.print()} style={{ background: BLUE, border: "none", color: "#fff", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 14, fontWeight: 900 }}>🖨 Print / PDF</button>
      </div>

      <div id="contract-doc" style={{ maxWidth: 800, margin: "0 auto", padding: "32px 40px", background: "#fff" }}>
        {/* Masthead */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "Arial, sans-serif", color: NAVY, marginBottom: 4 }}>All In One <span style={{ color: BLUE }}>LUXURY</span> Designs</div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#777", fontFamily: "Arial, sans-serif", marginBottom: 10 }}>DESIGNS INSPIRED TO ENHANCE</div>
          <div style={{ borderBottom: `4px solid ${NAVY}`, marginBottom: 8 }} />
          <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 16, color: NAVY, letterSpacing: "0.1em", marginBottom: 4 }}>HOME STAGING SERVICES AGREEMENT</div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: BLUE, letterSpacing: "0.08em", marginBottom: 16 }}>LIABILITY WAIVER & PROPERTY RESPONSIBILITY NOTICE</div>
        </div>

        {/* Parties table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
          <tbody>
            <tr>
              <td style={{ background: NAVY, border: `2px solid ${BLUE}`, padding: "12px 16px", width: "50%", verticalAlign: "top" }}>
                <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 11, color: BLUE, letterSpacing: "0.1em", marginBottom: 6 }}>SERVICE PROVIDER</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 3 }}>All In One Luxury Designs</div>
                <div style={{ fontSize: 12, color: LBLUE }}>Owner: Terrance Crumley</div>
                <div style={{ fontSize: 12, color: LBLUE }}>DFW Metroplex, Texas</div>
              </td>
              <td style={{ background: LBLUE, border: `1px solid #c5d0e0`, padding: "12px 16px", verticalAlign: "top" }}>
                <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 11, color: NAVY, letterSpacing: "0.1em", marginBottom: 6 }}>SUBJECT PROPERTY</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: NAVY, marginBottom: 3 }}>{propertyAddress || "____________________"}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{cityState}</div>
                <div style={{ fontSize: 12, color: "#555" }}>Referred by: {referredBy || "____________________"}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Agreement date */}
        <p style={s("")}>This Home Staging Services Agreement (the "Agreement") is entered into as of <strong>{agreementDate}</strong> between All In One Luxury Designs ("Company") and the property owner(s) of <strong>{propertyAddress || "[Property Address]"}, {cityState}</strong> ("<strong>{ownerName || "Owner"}{ownerName2 ? ` and ${ownerName2}` : ""}</strong>" or "Client").</p>

        {/* Section headers */}
        {[
          { title: "SECTION 1 — AGREEMENT OVERVIEW", content: `This Agreement governs the full-turnkey home staging services to be performed by All In One Luxury Designs at ${propertyAddress || "the Subject Property"}. By signing, the Owner acknowledges having read and agreed to all terms, including the liability provisions in Section 3.` },
          { title: "SECTION 2 — STAGING SERVICES", content: "All In One Luxury Designs will provide full-turnkey home staging at the Subject Property. All staging inventory — including furniture, artwork, décor, bedding, rugs, plants, and accessories — remains the sole and exclusive property of All In One Luxury Designs at all times. The Owner acquires no ownership interest or right of use beyond the staging period." },
        ].map(sec => (
          <div key={sec.title} style={{ marginBottom: 14 }}>
            <div style={{ background: NAVY, padding: "6px 12px 6px 14px", borderLeft: `5px solid ${BLUE}`, fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 11, color: "#fff", letterSpacing: "0.08em", marginBottom: 8 }}>{sec.title}</div>
            <p style={{ ...s(""), margin: "0 0 8px 0" }}>{sec.content}</p>
          </div>
        ))}

        {/* Section 3 - Liability */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ background: NAVY, padding: "6px 12px 6px 14px", borderLeft: `5px solid ${BLUE}`, fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 11, color: "#fff", letterSpacing: "0.08em", marginBottom: 8 }}>SECTION 3 — OWNER LIABILITY FOR STAGING INVENTORY</div>
          <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 11, color: BLUE, textAlign: "center", marginBottom: 10 }}>THIS SECTION CONTAINS IMPORTANT LEGAL OBLIGATIONS. PLEASE READ CAREFULLY.</div>
          <div style={{ background: LBLUE, border: `1px solid ${NAVY}`, borderLeft: `6px solid ${BLUE}`, padding: "14px 16px", marginBottom: 10 }}>
            <p style={{ ...s(""), margin: 0, fontWeight: 700 }}>
              The Owner of <strong>{propertyAddress || "[Property Address]"}</strong> hereby accepts full financial and legal responsibility for all staging inventory delivered by All In One Luxury Designs from the date of installation ({installDate || "____________________"}) through the date of complete removal.
            </p>
          </div>
          {[
            ["3.1  LOST ITEMS.", "Owner is responsible for the full replacement value of any staging item that is lost, misplaced, or cannot be located at pickup."],
            ["3.2  DAMAGED ITEMS.", "Owner is responsible for the full replacement or repair cost of any item damaged while on the Subject Property, regardless of cause — including damage by buyers, agents, contractors, or any visitors."],
            ["3.3  STOLEN ITEMS.", "Owner is responsible for the full replacement value of any stolen item. A police report must be filed immediately and provided to All In One Luxury Designs. Filing a report does not relieve financial responsibility."],
            ["3.4  PAYMENT OF DAMAGES.", "Any amounts owed shall be payable within fourteen (14) days of written notice. Failure to pay may result in legal action and the Owner's responsibility for all collection costs and attorney's fees."],
          ].map(([title, text]) => (
            <p key={title} style={{ ...s(""), margin: "0 0 8px 0" }}><strong>{title}</strong> {text}</p>
          ))}
        </div>

        {/* Sections 4-8 */}
        {[
          { title: "SECTION 4 — OWNER OBLIGATIONS", content: "Owner agrees to: maintain all staging items in clean, undamaged condition; inform all visitors that items belong to All In One Luxury Designs; not use, move, or rearrange staging items; keep the property secured; and immediately notify All In One Luxury Designs of any damage, theft, or incident." },
          { title: "SECTION 5 — STAGING PERIOD & RENEWAL", content: `The initial staging period is ninety (90) days from ${installDate || "the installation date"}, ending ${endDate || "the end date"}. If the property remains listed after 90 days, renewal is available at $${parseFloat(renewalRate||"1450").toLocaleString()}/term. Early termination requires 48-hour notice and pickup within 7 business days.` },
          { title: "SECTION 6 — FEES & PAYMENT", content: `Staging fee: $${parseFloat(stagingFee||"0").toLocaleString()}. Deposit paid: $${parseFloat(depositPaid||"0").toLocaleString()}. Balance due: $${balance.toLocaleString()}. Payment accepted via Zelle, Venmo, or Cash payable to All In One LLC. All fees are non-refundable once installation is complete. Outstanding balances may result in immediate inventory removal.` },
          { title: "SECTION 7 — INDEMNIFICATION", content: "The Owner shall indemnify and hold harmless All In One Luxury Designs, Terrance Crumley, employees, and agents from any claims, losses, or expenses arising from the Owner's breach of this Agreement, loss or damage to staging inventory, or the Owner's negligence or willful misconduct." },
          { title: "SECTION 8 — GENERAL PROVISIONS", content: "This Agreement is governed by the laws of Texas. Disputes shall be resolved in Dallas County courts. No modification is valid without written consent of both parties." },
        ].map(sec => (
          <div key={sec.title} style={{ marginBottom: 14 }}>
            <div style={{ background: NAVY, padding: "6px 12px 6px 14px", borderLeft: `5px solid ${BLUE}`, fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 11, color: "#fff", letterSpacing: "0.08em", marginBottom: 8 }}>{sec.title}</div>
            <p style={{ ...s(""), margin: "0 0 8px 0" }}>{sec.content}</p>
          </div>
        ))}

        {/* Acknowledgment box */}
        <div style={{ background: "#f5f6f8", border: `2px solid ${NAVY}`, borderLeft: `6px solid ${BLUE}`, padding: "16px 18px", margin: "18px 0" }}>
          <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 12, color: NAVY, textAlign: "center", letterSpacing: "0.1em", marginBottom: 10 }}>OWNER ACKNOWLEDGMENT</div>
          <p style={{ ...s(""), margin: 0, fontWeight: 700 }}>
            I/We, {ownerName ? <strong>{ownerName}{ownerName2 ? ` and ${ownerName2}` : ""}</strong> : "the Owner(s)"}, owner(s) of {propertyAddress || "[Property Address]"}, hereby acknowledge having read and fully understood this Agreement, including all liability provisions. I/We accept full financial responsibility for any staging inventory belonging to All In One Luxury Designs that is lost, damaged, or stolen while at the Subject Property.
          </p>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: 24 }}>
          <div style={{ background: NAVY, padding: "6px 12px 6px 14px", borderLeft: `5px solid ${BLUE}`, fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 11, color: "#fff", letterSpacing: "0.08em", marginBottom: 18 }}>SECTION 9 — SIGNATURES</div>
          <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 11, color: "#777", letterSpacing: "0.1em", marginBottom: 16 }}>PROPERTY OWNER(S)</div>
          {[
            { label: `Owner #1 Signature${ownerName ? ` — ${ownerName}` : ""}`, right: "Date" },
            { label: `Owner #1 Printed Name`, right: "" },
            ...(ownerName2 ? [
              { label: `Owner #2 Signature — ${ownerName2}`, right: "Date" },
              { label: "Owner #2 Printed Name", right: "" },
            ] : []),
          ].map((sig, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 12, marginBottom: 20, alignItems: "flex-end" }}>
              <div>
                <div style={{ borderBottom: `2px solid #999`, height: 32 }} />
                <div style={{ fontFamily: "Arial, sans-serif", fontSize: 10, color: "#777", fontWeight: 700, letterSpacing: "0.06em", marginTop: 4 }}>{sig.label}</div>
              </div>
              <div />
              {sig.right && (
                <div>
                  <div style={{ borderBottom: `2px solid #999`, height: 32 }} />
                  <div style={{ fontFamily: "Arial, sans-serif", fontSize: 10, color: "#777", fontWeight: 700, letterSpacing: "0.06em", marginTop: 4 }}>{sig.right}</div>
                </div>
              )}
            </div>
          ))}
          <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 11, color: "#777", letterSpacing: "0.1em", marginTop: 24, marginBottom: 16 }}>ALL IN ONE LUXURY DESIGNS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 12, marginBottom: 8, alignItems: "flex-end" }}>
            <div><div style={{ borderBottom: "2px solid #999", height: 32 }} /><div style={{ fontFamily: "Arial, sans-serif", fontSize: 10, color: "#777", fontWeight: 700, marginTop: 4 }}>Authorized Representative Signature</div></div>
            <div />
            <div><div style={{ borderBottom: "2px solid #999", height: 32 }} /><div style={{ fontFamily: "Arial, sans-serif", fontSize: 10, color: "#777", fontWeight: 700, marginTop: 4 }}>Date</div></div>
          </div>
          <div style={{ fontSize: 13, color: "#555", fontStyle: "italic", marginTop: 4 }}>Terrance Crumley — Owner, All In One Luxury Designs</div>
          <div style={{ borderTop: "1px solid #ddd", marginTop: 24, paddingTop: 12, textAlign: "center", fontSize: 11, color: "#888", fontStyle: "italic" }}>Both parties should retain a fully executed copy. This Agreement becomes effective upon signature by all required parties.</div>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } body { margin: 0; } #contract-doc { max-width: 100%; padding: 20px; } }`}</style>
    </div>
  );
}
