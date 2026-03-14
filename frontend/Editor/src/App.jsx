import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { fetchProblem, fetchTestCases, submitCode } from "./api";

function mapJudgeStatus(tc) {
  switch (tc.status) {
    case "PASS":
      return "pass";
    case "WA":
      return "fail";
    case "TLE":
      return "tle";
    case "RE":
      return "re";
    default:
      return "fail";
  }
}
// ─── Difficulty Pill ──────────────────────────────────────────────────────────
function DifficultyPill({ level = "Medium" }) {
  const map = {
    Easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    Medium: "text-amber-400  bg-amber-400/10  border-amber-400/20",
    Hard: "text-red-400    bg-red-400/10    border-red-400/20",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${map[level] || map.Medium}`}>
      {level}
    </span>
  );
}

function Tag({ children }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/50 font-mono">
      {children}
    </span>
  );
}

function IOBlock({ label, value }) {
  const [copied, setCopied] = useState(false);
  const safeValue = value ?? "";
  const copy = () => {
    navigator.clipboard.writeText(safeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-white/3 border-b border-white/8">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">{label}</span>
        <button onClick={copy} className="text-xs text-white/30 hover:text-white/70 transition-colors">
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-3 text-sm font-mono text-white/70 leading-relaxed bg-black/20 overflow-x-auto break-words whitespace-pre-wrap" style={{ wordBreak: "break-word" }}>
        {safeValue || "-"}
      </pre>
    </div>
  );
}

// ─── Languages ────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: "cpp", label: "C++17", monacoId: "cpp" },
  { id: "python", label: "Python 3", monacoId: "python" },
  { id: "java", label: "Java 17", monacoId: "java" },
  { id: "js", label: "JavaScript", monacoId: "javascript" },
];

const DEFAULT_CODE = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
   // write your code here
    
    
    return 0;
}`,
  python: `import sys
input = sys.stdin.readline

def main():
    a, b = map(int, input().split())
    print(a + b)

main()`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt(), b = sc.nextInt();
        System.out.println(a + b);
    }
}`,
  js: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const [a, b] = lines[0].split(' ').map(Number);
console.log(a + b);`,
};

// ─── Individual Case Tab Button ───────────────────────────────────────────────
// status: null | "pending" | "pass" | "fail" | "tle" | "re"
function CaseTab({ label, status, active, onClick }) {
  const statusStyles = {
    null: {
      active: "border-white/20 bg-white/8 text-white/85",
      inactive: "border-white/8  bg-transparent text-white/35 hover:text-white/60 hover:border-white/15",
    },
    pending: {
      active: "border-indigo-400/50 bg-indigo-500/15 text-indigo-300",
      inactive: "border-indigo-400/20 bg-transparent  text-indigo-400/50 hover:border-indigo-400/40",
    },
    pass: {
      active: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
      inactive: "border-emerald-500/25 bg-transparent   text-emerald-500/60 hover:border-emerald-500/40 hover:text-emerald-400",
    },
    fail: {
      active: "border-red-500/50 bg-red-500/15 text-red-300",
      inactive: "border-red-500/25 bg-transparent text-red-500/60 hover:border-red-500/40 hover:text-red-400",
    },
    tle: {
      active: "border-amber-500/50 bg-amber-500/15 text-amber-300",
      inactive: "border-amber-500/25 bg-transparent text-amber-500/60 hover:border-amber-500/40 hover:text-amber-400",
    },
    re: {
      active: "border-orange-500/50 bg-orange-500/15 text-orange-300",
      inactive: "border-orange-500/25 bg-transparent text-orange-500/60 hover:border-orange-500/40 hover:text-orange-400",
    },
  };

  const icon = {
    null: null,
    pending: <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />,
    pass: <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>,
    fail: <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>,
    tle: <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    re: <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  };

  const s = statusStyles[status ?? "null"] ?? statusStyles.null;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all select-none ${active ? s.active : s.inactive
        }`}
    >
      {icon[status ?? "null"] ?? icon.null}
      {label}
    </button>
  );
}

// ─── Bottom Panel ─────────────────────────────────────────────────────────────
function TestPanel({ height = 210, loading, results, submitted, sampleCases, verdict, errorMessage, onSubmit, onTest }) {
  const [activeCase, setActiveCase] = useState(0);
  const [panelTab, setPanelTab] = useState("testcase");

  // Use sample cases for tabs when we have them; otherwise fall back to results
  const displayCases = sampleCases?.length > 0 ? sampleCases : results;
  const total = displayCases.length;

  // Switch to result tab when results arrive (or when there's an error)
  useEffect(() => {
    if (submitted && (results.length > 0 || errorMessage)) setPanelTab("result");
  }, [submitted, results.length, errorMessage]);

  // Reset to first case whenever new results or sample cases come in
  useEffect(() => {
    setActiveCase(0);
  }, [results, sampleCases]);

  // Clamp activeCase when display list changes
  const safeActive = total > 0 ? Math.min(activeCase, total - 1) : 0;
  const tc = displayCases[safeActive];
  const res = results[safeActive];
  const passed = results.filter(r => r?.status === "pass").length;
  const allAC = results.length > 0 && passed === results.length;
  const hasTle = results.some(r => r?.status === "tle");
  const hasRe = results.some(r => r?.status === "re");
  const verdictType = allAC ? "ac" : hasTle ? "tle" : hasRe ? "re" : "wa";
  const showErrorBanner = errorMessage || verdict === "Compilation Error";

  return (
    <div className="border-t border-white/6 bg-[#090909] shrink-0 flex flex-col overflow-hidden" style={{ height }}>

      {/* Header row */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-white/5">

        {/* Panel tabs */}
        <div className="flex items-center gap-0.5">
          {[
            { id: "testcase", label: "Test Cases" },
            { id: "result", label: "Result" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPanelTab(id)}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${panelTab === id
                ? "text-white bg-white/6"
                : "text-white/30 hover:text-white/60"
                }`}
            >
              {label}
              {id === "result" && results.length > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${allAC ? "bg-emerald-500/20 text-emerald-400"
                  : hasTle ? "bg-amber-500/20 text-amber-400"
                    : hasRe ? "bg-orange-500/20 text-orange-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                  {passed}/{results.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTest}
            disabled={loading}
            className="px-4 py-1.5 text-xs rounded-lg border border-white/10 text-white/45 hover:text-white/75 hover:border-white/20 transition-all font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Run Tests
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="run-btn px-5 py-1.5 text-xs rounded-lg text-white font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                Judging…
              </>
            ) : (
              <>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z" /></svg>
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Case tab row: sample cases when available, else results */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
        {displayCases.map((_, i) => {
          const status = loading ? "pending" : results[i]?.status ?? null;
          return (
            <CaseTab
              key={i}
              label={`Case ${i + 1}`}
              status={status}
              active={safeActive === i}
              onClick={() => setActiveCase(i)}
            />
          );
        })}

        {/* Show placeholder tabs while loading (before results arrive) */}
        {loading && displayCases.length === 0 && [0, 1, 2].map(i => (
          <CaseTab
            key={i}
            label={`Case ${i + 1}`}
            status="pending"
            active={safeActive === i}
            onClick={() => setActiveCase(i)}
          />
        ))}

        {/* Overall verdict — right-aligned (Accepted / Wrong Answer / TLE / RE / Compilation Error) */}
        {submitted && !loading && (results.length > 0 || showErrorBanner) && (() => {
          if (showErrorBanner && verdict === "Compilation Error") {
            return (
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold bg-red-500/10 border-red-500/30 text-red-400">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Compilation Error
              </div>
            );
          }
          if (results.length === 0) return null;
          const v = { ac: ["Accepted", "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", "M20 6L9 17l-5-5"], tle: ["Time Limit Exceeded", "bg-amber-500/10 border-amber-500/30 text-amber-400", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"], re: ["Runtime Error", "bg-orange-500/10 border-orange-500/30 text-orange-400", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"], wa: ["Wrong Answer", "bg-red-500/10 border-red-500/30 text-red-400", "M18 6L6 18M6 6l12 12"] };
          const [text, className, icon] = v[verdictType] || v.wa;
          return (
            <div className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${className}`}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={icon} /></svg>
              {text}
            </div>
          );
        })()}
      </div>

      {/* Detail body: error banner on top (like LeetCode), then Input → Expected → Output stacked */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {panelTab === "result" && showErrorBanner && (
          <div className="shrink-0 px-4 pt-3">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-mono text-red-300 whitespace-pre-wrap break-words">
              {errorMessage || verdict === "Compilation Error" ? (errorMessage || "Compilation Error") : null}
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto px-4 py-3">
          {panelTab === "testcase" ? (

            /* ── Test Case view: Input, Expected, Your Output stacked ── */
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-1.5">Input</p>
                <pre className="text-xs font-mono text-white/60 bg-white/3 rounded-lg px-3 py-2 border border-white/6 leading-relaxed min-h-[2rem] overflow-auto whitespace-pre-wrap break-words" style={{ wordBreak: "break-word" }}>{tc?.input ?? "-"}</pre>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-1.5">Expected</p>
                <pre className="text-xs font-mono text-white/60 bg-white/3 rounded-lg px-3 py-2 border border-white/6 leading-relaxed min-h-[2rem] overflow-auto whitespace-pre-wrap break-words" style={{ wordBreak: "break-word" }}>{tc?.expected ?? "-"}</pre>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-1.5">Your Output</p>
                <pre className="text-xs font-mono text-white/60 bg-white/3 rounded-lg px-3 py-2 border border-white/6 leading-relaxed min-h-[2rem] overflow-auto whitespace-pre-wrap break-words" style={{ wordBreak: "break-word" }}>
                  {res?.status === "tle" ? "Time Limit Exceeded" : res?.status === "re" ? "Runtime Error" : (res?.output ?? "-")}
                </pre>
              </div>
            </div>

          ) : (res || showErrorBanner) ? (

            /* ── Result view: error on top already; then Input, Expected, Your Output stacked ── */
            (() => {
              const outputVal = res ? (res.status === "tle" ? "Time Limit Exceeded" : res.status === "re" ? "Runtime Error" : (res.output ?? "—")) : "—";
              const accent = res ? (res.status === "pass" ? "pass" : res.status === "tle" ? "tle" : res.status === "re" ? "re" : "fail") : "null";
              const accentStyles = {
                pass: { label: "text-emerald-500/60", pre: "text-emerald-300 bg-emerald-500/5 border-emerald-500/20" },
                fail: { label: "text-red-500/60", pre: "text-red-300 bg-red-500/5 border-red-500/20" },
                tle: { label: "text-amber-500/60", pre: "text-amber-300 bg-amber-500/5 border-amber-500/20" },
                re: { label: "text-orange-500/60", pre: "text-orange-300 bg-orange-500/5 border-orange-500/20" },
                null: { label: "text-white/25", pre: "text-white/60 bg-white/3 border-white/6" },
              };
              const s = accentStyles[accent] ?? accentStyles.null;
              return (
                <div className="space-y-4">
                  <div>
                    <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1.5 ${accentStyles.null.label}`}>Input</p>
                    <pre className={`text-xs font-mono rounded-lg px-3 py-2 border leading-relaxed min-h-[2rem] overflow-auto whitespace-pre-wrap break-words ${accentStyles.null.pre}`} style={{ wordBreak: "break-word" }}>{tc?.input ?? "-"}</pre>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1.5 ${accentStyles.null.label}`}>Expected</p>
                    <pre className={`text-xs font-mono rounded-lg px-3 py-2 border leading-relaxed min-h-[2rem] overflow-auto whitespace-pre-wrap break-words ${accentStyles.null.pre}`} style={{ wordBreak: "break-word" }}>{tc?.expected ?? "-"}</pre>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1.5 ${s.label}`}>Your Output</p>
                    <pre className={`text-xs font-mono rounded-lg px-3 py-2 border leading-relaxed min-h-[2rem] overflow-auto whitespace-pre-wrap break-words ${s.pre}`} style={{ wordBreak: "break-word" }}>{outputVal}</pre>
                  </div>
                </div>
              );
            })()

          ) : (
            <div className="flex items-center justify-center h-full min-h-[120px]">
              <p className="text-white/20 text-xs">Run your code to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [problem, setProblem] = useState(null);
  const [sampleCases, setSampleCases] = useState([]);
  const [lang, setLang] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE.cpp);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fontSize, setFontSize] = useState(14);
  const [activeTab, setActiveTab] = useState("description");
  const [leftPanelWidthPct, setLeftPanelWidthPct] = useState(42);
  const [testPanelHeight, setTestPanelHeight] = useState(210);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const mainContentRef = useRef(null);
  const resizeStartRef = useRef({ x: 0, pct: 42 });
  const panelResizeStartRef = useRef({ y: 0, h: 210 });
  const [resizingLeft, setResizingLeft] = useState(false);
  const [resizingPanel, setResizingPanel] = useState(false);

  useEffect(() => {
    fetchProblem("two-sum").then(setProblem).catch(console.error);
    fetchTestCases("two-sum").then(setSampleCases).catch(() => setSampleCases([]));
  }, []);

  // Resize left panel (question) vs right (editor)
  useEffect(() => {
    if (!resizingLeft) return;
    const onMove = (e) => {
      const el = mainContentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const deltaPct = ((e.clientX - resizeStartRef.current.x) / rect.width) * 100;
      const newPct = resizeStartRef.current.pct + deltaPct;
      setLeftPanelWidthPct(Math.min(70, Math.max(25, newPct)));
    };
    const onUp = () => setResizingLeft(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingLeft]);

  // Resize test panel height
  useEffect(() => {
    if (!resizingPanel) return;
    const onMove = (e) => {
      const deltaY = panelResizeStartRef.current.y - e.clientY;
      const newH = panelResizeStartRef.current.h + deltaY;
      setTestPanelHeight(Math.min(600, Math.max(120, newH)));
    };
    const onUp = () => setResizingPanel(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingPanel]);

  // Reflow editor when panel resize ends so it uses new dimensions
  useEffect(() => {
    if (!resizingLeft && !resizingPanel) {
      const t = setTimeout(() => {
        editorRef.current?.layout?.();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [resizingLeft, resizingPanel]);



  function switchLang(l) { setLang(l); setCode(DEFAULT_CODE[l]); }

  async function handleSubmit() {
    setLoading(true);
    setSubmitted(false);
    setResults([]);
    setVerdict(null);
    setErrorMessage(null);

    const res = await submitCode("two-sum", code, lang, "submit");

    if (res.status === "error") {
      setErrorMessage(res.message || "Something went wrong");
      setVerdict(null);
      setResults([]);
    } else {
      setVerdict(res.verdict || null);
      setErrorMessage(res.verdict === "Compilation Error" ? "Compilation Error" : null);
      const mapped = (res.sampleResults || []).map(tc => ({
        status: mapJudgeStatus(tc),
        output: tc.output,
        input: tc.input,
        expected: tc.expected,
      }));
      setResults(mapped);





    }
    setSubmitted(true);
    setLoading(false);
  }

  async function handleTest() {
    setLoading(true);
    setSubmitted(false);
    setResults([]);
    setVerdict(null);
    setErrorMessage(null);

    const res = await submitCode("two-sum", code, lang, "run");

    if (res.status === "error") {
      setErrorMessage(res.message || "Something went wrong");
      setVerdict(null);
      setResults([]);
    } else {
      setVerdict(res.verdict || null);
      setErrorMessage(res.verdict === "Compilation Error" ? "Compilation Error" : null);
      const mapped = (res.sampleResults || []).map(tc => ({
        status: mapJudgeStatus(tc),
        output: tc.output,
        input: tc.input,
        expected: tc.expected,
      }));
      setResults(mapped);
    }
    setSubmitted(true);
    setLoading(false);
  }

  if (!problem)
    return (
      <div className="h-screen w-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-white/30 text-sm font-mono">Fetching problem…</p>
        </div>
      </div>
    );




  return (
    <div
      className="h-screen w-screen bg-[#0d0d0f] text-white flex flex-col overflow-hidden"
      style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff15; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #ffffff25; }
        .run-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #6366f1);
          background-size: 200% auto;
          transition: all 0.3s ease;
        }
        .run-btn:hover:not(:disabled) {
          background-position: right center;
          box-shadow: 0 0 20px #6366f140, 0 4px 12px #0004;
          transform: translateY(-1px);
        }
        .run-btn:active:not(:disabled) { transform: translateY(0); }
        .tab-active   { color: #fff; border-bottom: 2px solid #6366f1; }
        .tab-inactive { color: rgba(255,255,255,0.3); border-bottom: 2px solid transparent; }
        .tab-inactive:hover { color: rgba(255,255,255,0.6); }
      `}</style>

      {/* Nav */}
      <header className="flex items-center justify-between px-5 h-12 border-b border-white/6 bg-black/30 backdrop-blur-xl shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-white/20 text-xs">|</span>
          <span style={{ fontFamily: "'Syne', sans-serif" }} className="text-white/80 text-sm font-semibold tracking-wide">
            code<span className="text-indigo-400">arena</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">U</div>
      </header>

      <div ref={mainContentRef} className="flex flex-1 overflow-hidden min-h-0">

        {/* LEFT — Question */}
        <div
          className="flex flex-col border-r border-white/6 overflow-hidden shrink-0"
          style={{ width: `${leftPanelWidthPct}%`, minWidth: 280 }}
        >
          <div className="px-6 pt-5 pb-4 border-b border-white/6 shrink-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-white/30 text-xs font-mono mb-1">#1 · Two Sum</p>
                <h1 style={{ fontFamily: "'Syne', sans-serif" }} className="text-xl font-bold text-white leading-tight">{problem.title}</h1>
              </div>
              <DifficultyPill level={problem.difficulty || "Easy"} />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {(problem.tags || ["Array", "Hash Table"]).map(t => <Tag key={t}>{t}</Tag>)}
            </div>
          </div>

          <div className="flex gap-5 px-6 border-b border-white/6 shrink-0">
            {["description", "editorial"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`py-3 text-xs uppercase tracking-widest font-semibold transition-all ${activeTab === t ? "tab-active" : "tab-inactive"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-5">
            {activeTab === "description" ? (
              <>
                <p className="text-white/60 text-sm leading-7 break-words" style={{ overflowWrap: "break-word" }}>{problem.statement}</p>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-white/25 font-semibold">Examples</p>
                  <IOBlock label="Input" value={problem.sampleInput} />
                  <IOBlock label="Output" value={problem.sampleOutput} />
                </div>
                {problem.constraints && (
                  <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                    <p className="text-xs uppercase tracking-widest text-white/25 font-semibold mb-2">Constraints</p>
                    {problem.constraints.map((c, i) => (
                      <p key={i} className="text-sm font-mono text-white/50"><span className="text-indigo-400 mr-2">•</span>{c}</p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-white/40 text-sm leading-7 italic">Editorial coming soon…</div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-white/6 flex items-center gap-6 shrink-0">
            {[
              { label: "Acceptance", value: problem.acceptance || "67.8%" },
              { label: "Submissions", value: problem.submissions || "12.4M" },
              { label: "Runtime", value: problem.runtime || "O(n)" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-white/25 text-[10px] uppercase tracking-widest">{label}</p>
                <p className="text-white/70 text-xs font-semibold font-mono mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vertical resize handle */}
        <div
          role="separator"
          aria-label="Resize question panel"
          className="w-1 shrink-0 bg-white/5 hover:bg-indigo-500/30 cursor-col-resize transition-colors group flex items-center justify-center"
          onMouseDown={(e) => {
            resizeStartRef.current = { x: e.clientX, pct: leftPanelWidthPct };
            setResizingLeft(true);
          }}
        >
          <div className="w-0.5 h-8 rounded-full bg-white/20 group-hover:bg-indigo-400/60 transition-colors" />
        </div>

        {/* RIGHT — Editor + Test panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-[320px]">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 h-11 border-b border-white/6 bg-black/20 shrink-0">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {LANGUAGES.map(l => (
                <button key={l.id} onClick={() => switchLang(l.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${lang === l.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-white/35 hover:text-white/60"
                    }`}>
                  {l.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white/30">
                <button onClick={() => setFontSize(f => Math.max(10, f - 1))} className="text-xs hover:text-white/60 transition-colors w-5 text-center">A-</button>
                <span className="text-xs font-mono">{fontSize}px</span>
                <button onClick={() => setFontSize(f => Math.min(22, f + 1))} className="text-xs hover:text-white/60 transition-colors w-5 text-center">A+</button>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <button onClick={() => setCode(DEFAULT_CODE[lang])} className="text-xs text-white/30 hover:text-white/60 transition-colors">Reset</button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden min-h-0">
            <Editor
              height="100%"
              language={LANGUAGES.find(l => l.id === lang)?.monacoId || "cpp"}
              theme="vs-dark"
              value={code}
              onChange={setCode}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              options={{
                fontSize,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                renderLineHighlight: "gutter",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                padding: { top: 16, bottom: 16 },
                tabSize: 4,
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
                scrollbar: { vertical: "auto", horizontal: "auto", verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
              }}
            />
          </div>

          {/* Horizontal resize handle for test panel */}
          <div
            role="separator"
            aria-label="Resize test cases panel"
            className="h-1.5 shrink-0 bg-white/5 hover:bg-indigo-500/30 cursor-row-resize transition-colors flex items-center justify-center border-t border-white/6"
            onMouseDown={(e) => {
              panelResizeStartRef.current = { y: e.clientY, h: testPanelHeight };
              setResizingPanel(true);
            }}
          >
            <div className="w-12 h-0.5 rounded-full bg-white/20 hover:bg-indigo-400/60 transition-colors" />
          </div>

          {/* Test Panel */}
          <TestPanel
            height={testPanelHeight}
            loading={loading}
            results={results}
            submitted={submitted}
            sampleCases={sampleCases}
            verdict={verdict}
            errorMessage={errorMessage}
            onSubmit={handleSubmit}
            onTest={handleTest}
          />
        </div>
      </div>
    </div>
  );
}
