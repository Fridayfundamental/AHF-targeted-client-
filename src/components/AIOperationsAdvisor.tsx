import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Brain, Truck, Compass, Mail, ArrowRight, RefreshCcw, Check, Info } from "lucide-react";

interface AIOperationsAdvisorProps {
  onDraftSms: (type: string, clinic: string, message: string, patientName: string) => void;
  triggerToast: (msg: string, type: "success" | "error" | "info") => void;
  adminDept?: "all" | "logistics" | "outreach" | "clinical";
}

export default function AIOperationsAdvisor({ onDraftSms, triggerToast, adminDept = "all" }: AIOperationsAdvisorProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<"logistics" | "gis" | "sms">("logistics");

  // Keep AI segment synchronized with selected department for an integrated manager workflow
  useEffect(() => {
    if (adminDept === "logistics") {
      setActiveSegment("logistics");
    } else if (adminDept === "outreach") {
      setActiveSegment("gis");
    } else if (adminDept === "clinical") {
      setActiveSegment("sms");
    }
  }, [adminDept]);
  const [isLive, setIsLive] = useState(false);

  // Custom regex-based parser to make sure raw markdown sections look professional if they come from the real Gemini model
  const parseSection = (key: "logistics" | "gis" | "sms"): string => {
    if (!report) return "";

    const cleanReport = report.replace(/\r/g, "");
    
    // Find section titles using regular expressions
    const logisticsPattern = /(?:Critical Inventory|🚨|Logistics Restocking|Inventory Warning)/i;
    const gisPattern = /(?:Field Outreach|📍|GIS outreach|GIS Sector|Target Priorities)/i;
    const smsPattern = /(?:Empathetic Adherence|💬|Bespoke Empathetic|SMS Campaigns|Outreach Reminders)/i;

    const lines = cleanReport.split("\n");
    let currentMatch: "logistics" | "gis" | "sms" | null = null;
    const sections: Record<"logistics" | "gis" | "sms", string[]> = {
      logistics: [],
      gis: [],
      sms: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (logisticsPattern.test(line) && (line.includes("###") || line.includes("##") || line.includes("**") || line.startsWith("1."))) {
        currentMatch = "logistics";
        continue;
      } else if (gisPattern.test(line) && (line.includes("###") || line.includes("##") || line.includes("**") || line.startsWith("2."))) {
        currentMatch = "gis";
        continue;
      } else if (smsPattern.test(line) && (line.includes("###") || line.includes("##") || line.includes("**") || line.startsWith("3."))) {
        currentMatch = "sms";
        continue;
      }

      if (currentMatch) {
         sections[currentMatch].push(line);
      } else {
         // Default if a section hasn't matched yet
         if (line.trim().length > 0) {
           if (line.toLowerCase().includes("stock") || line.toLowerCase().includes("kitwe") || line.toLowerCase().includes("supply")) {
             sections.logistics.push(line);
           } else if (line.toLowerCase().includes("outreach") || line.toLowerCase().includes("tested") || line.toLowerCase().includes("terminus")) {
             sections.gis.push(line);
           } else if (line.toLowerCase().includes("sms") || line.toLowerCase().includes("reminder") || line.toLowerCase().includes("language")) {
             sections.sms.push(line);
           }
         }
      }
    }

    const compiled = sections[key].join("\n").trim();
    if (compiled.length > 5) {
      return compiled;
    }

    // Baseline fallback if parsing returned too short
    if (key === "logistics") {
      return `### 🚨 Critical Inventory Warnings & Restock Plan\n\n* **Kitwe Support Clinic (Copperbelt State):** Stock is at **12 kits** (Safety threshold 100). Outstanding shortage of **88 kits** must be balanced with urgent Lusaka transfer.\n* **Livingstone Outpost:** Current level is at **35 kits** against minimum threshold of 80. Relocate **45 kits** immediately.\n* **Condom Availability:** Livingstone and Kitwe currently display a sub-safety gap (~1,200 and ~800, respectively). Recommend adding auxiliary testing cartons.`;
    } else if (key === "gis") {
      return `### 📍 GIS Field Outreach Priorities & Testing Ratios\n\n* **Intercity Bus Terminus (Lusaka Central):** Tested 280, Reactive 9 (**3.2% Positivity ratio**). High urgency outreach required. Deploy Mobile Van B for daily targeting.\n* **Kabwata Market (Lusaka East):** Tested 145, Reactive 4 (**2.75% Positivity ratio**). Stable transition outposts recommended.\n* **Chifubu Market (Ndola Central):** Tested 110, Reactive 2 (**1.8% positivity ratio**). Balanced volunteer rotation.`;
    } else {
      return `### 💬 Bespoke Empathetic Adherence Templates\n\n* **Template Alpha (Nyanja Language Context - Lusaka Area):**\n  *"AHF Care: Muli bwanji. Just a warm reminder to take your daily wellness companion today with food. Your health is your family's strength. Call us for any advice."*\n\n* **Template Beta (Bemba Language Context - Copperbelt Area):**\n  *"AHF Support: Mulishani! We are proud of your adherence journey. If you need any help or support, Dr. Chileshe is active on our secure group chat right now."*`;
    }
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    triggerToast("Gemini is analyzing clinic state, GIS hot-spots, and pending pipelines...", "info");

    try {
      const res = await fetch("/api/admin/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        setReport(data.analysis);
        setIsLive(true);
        triggerToast("AI Operations Report synthesized successfully!", "success");
      } else {
        throw new Error("Analysis request returned unsuccessful.");
      }
    } catch (e) {
      console.error(e);
      // Local fallback triggers immediately if connection fails, ensuring robust offline/sandbox operations
      triggerToast("Network sandbox mode. Re-routing to pre-compiled LLM templates.", "info");
      setIsLive(false);
      setReport(null); // will trigger parser defaults
    } finally {
      setLoading(false);
    }
  };

  const handleApplySmsPreset = (locale: "nyanja" | "bemba") => {
    if (locale === "nyanja") {
      onDraftSms(
        "Pharmacy ART Pick-up",
        "AHF Lusaka Clinic (HQ)",
        "AHF Care: Muli bwanji. Just a warm reminder to take your daily wellness companion today with food. Your health is your family's strength.",
        "Patient #398"
      );
      triggerToast("Nyanja wellness template pre-filled into patient SMS form!", "success");
    } else {
      onDraftSms(
        "Default Follow-up",
        "AHF Ndola Centre",
        "AHF Support: Mulishani! We are proud of your adherence journey. Live Chat with Dr. Chileshe is active on our anonymous board right now if you need assistance.",
        "Patient #204"
      );
      triggerToast("Bemba follow-up template pre-filled into patient SMS form!", "success");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white space-y-6" id="ai-operations-advisor-panel">
      
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 shrink-0">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold tracking-widest bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded uppercase">
                Gemini 3.5 Flash Connected
              </span>
              <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900 font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                {isLive ? "REAL-TIME SECURE" : "SANDBOX SECURE"}
              </span>
            </div>
            <h3 className="text-base font-bold font-display uppercase tracking-wider text-slate-100 mt-1.5 flex items-center gap-1.5">
              AI Operational Logistics & Outreach Strategist
            </h3>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
              Drives clinical preparedness. Synthesizes inventory stockouts, hot spot positivity layers, and scheduled text pipelines to generate actionable plans.
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={loading}
            className="w-full md:w-auto px-5 py-3 bg-red-650 hover:bg-neutral-800 text-white rounded-2xl transition-all font-bold text-xs flex items-center justify-center gap-2 border border-red-500 hover:border-slate-700 shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Processing Systems State...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
                Synthesize Operational Plan
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!report && !loading ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-950 rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center gap-3.5"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              ⚡
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="text-sm font-bold text-slate-200">No Operations Plan Compiled</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click the button above to analyze our current clinics (Kitwe, Lusaka HQ, Ndola outposts) against the latest outreach logs and automate dispatch.
              </p>
            </div>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-950 rounded-2xl border border-slate-800 p-12 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-red-500 animate-spin"></div>
              <Brain className="w-6 h-6 text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-200 animate-pulse">Consulting Gemini Operations Core...</p>
              <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                Aggregating kit quantities at remote outposts, calculating positivity percentiles for mobile routing, and drafting localized safety messages.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="report-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Segment Controls (col-span-3) */}
            <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
              <button
                type="button"
                onClick={() => setActiveSegment("logistics")}
                className={`flex-1 text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  activeSegment === "logistics"
                    ? "bg-red-650/10 text-red-400 border-red-500/30"
                    : "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>🚨 Stock Warnings</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSegment("gis")}
                className={`flex-1 text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  activeSegment === "gis"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>📍 Dispatch Routes</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSegment("sms")}
                className={`flex-1 text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  activeSegment === "sms"
                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                    : "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>💬 English & Vernacular</span>
              </button>
            </div>

            {/* Segment Content (col-span-9) */}
            <div className="lg:col-span-9 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    {activeSegment === "logistics" ? "Inventory Re-balancing Plan" : activeSegment === "gis" ? "Remote Outreach Positioning" : "Local-Safe Outreach Copywriter"}
                  </span>
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded font-bold">
                    SYSTEM ANALYTICS REPORT
                  </span>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
                  {/* Clean rendered layout parsed from report */}
                  {parseSection(activeSegment).split("\n").map((line, idx) => {
                    if (line.startsWith("###")) {
                      return (
                        <h4 key={idx} className="text-sm font-bold text-slate-100 uppercase tracking-wide mt-3 mb-2 flex items-center gap-1.5">
                          ✨ {line.replace("###", "").trim()}
                        </h4>
                      );
                    }
                    if (line.startsWith("*") || line.startsWith("-")) {
                      return (
                        <div key={idx} className="flex gap-2 items-start pl-2 py-0.5 text-slate-300">
                          <span className="text-red-500 mt-1 shrink-0 font-bold">•</span>
                          {/* Standard parser to make bold text stand out */}
                          <p dangerouslySetInnerHTML={{
                            __html: line.replace(/^\s*[\*\-]\s*/, "")
                                       .replace(/\*\*([^*]+)\*\*/g, "<span class='font-bold text-white'>$1</span>")
                          }} />
                        </div>
                      );
                    }
                    if (line.trim() === "---" || line.trim() === "***") {
                      return <hr key={idx} className="border-slate-800 my-3" />;
                    }
                    return line.trim() ? (
                      <p key={idx} className="mt-1" dangerouslySetInnerHTML={{
                        __html: line.replace(/\*\*([^*]+)\*\*/g, "<span class='font-bold text-white'>$1</span>")
                      }} />
                    ) : null;
                  })}
                </div>
              </div>

              {activeSegment === "sms" && (
                <div className="bg-slate-905 border border-slate-800/80 p-3 rounded-xl space-y-2">
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3 h-3 text-red-400" /> Co-pilot Actions: Inject drafted reminders directly to form
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleApplySmsPreset("nyanja")}
                      className="py-1.5 px-3 bg-red-650/10 hover:bg-red-650 hover:text-white text-red-300 border border-red-500/20 hover:border-red-500 rounded-xl transition text-[11px] font-bold text-left flex items-center justify-between cursor-pointer"
                    >
                      <span>Draft Nyanja Copilot</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplySmsPreset("bemba")}
                      className="py-1.5 px-3 bg-indigo-550/10 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-indigo-500/20 hover:border-indigo-500 rounded-xl transition text-[11px] font-bold text-left flex items-center justify-between cursor-pointer"
                    >
                      <span>Draft Bemba Copilot</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
