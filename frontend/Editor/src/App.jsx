import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { fetchCurrentUser, fetchMySubmissions, fetchProblem, fetchProblems, fetchTestCases, runCustomCases, submitCode } from "./api";

loader.config({ paths: { vs: "/monaco/vs" } });

const LANGUAGES = [
  { id: "cpp", label: "C++17", monacoId: "cpp", extension: "cpp" },
  { id: "python", label: "Python 3", monacoId: "python", extension: "py" },
  { id: "java", label: "Java 17", monacoId: "java", extension: "java" },
  { id: "js", label: "JavaScript", monacoId: "javascript", extension: "js" },
  { id: "go", label: "Go", monacoId: "go", extension: "go", disabled: true },
  { id: "rust", label: "Rust", monacoId: "rust", extension: "rs", disabled: true },
  { id: "csharp", label: "C#", monacoId: "csharp", extension: "cs", disabled: true },
];

const DEFAULT_CODE = {
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Write your solution here\n    int a, b;\n    if (cin >> a >> b) cout << a + b << "\\n";\n    return 0;\n}`,
  python: `import sys\n\ndef solve():\n    # Write your solution here\n    a, b = map(int, sys.stdin.readline().split())\n    print(a + b)\n\nif __name__ == "__main__":\n    solve()`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        int a = scanner.nextInt();\n        int b = scanner.nextInt();\n        System.out.println(a + b);\n    }\n}`,
  js: `const input = require("fs").readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\nconst [a, b] = input;\nconsole.log(a + b);`,
};

const CodeEditor = memo(function CodeEditor({ language, theme, value, onChange, options, onMount }) {
  return <Editor height="100%" language={language} theme={theme} value={value} onChange={(next) => onChange(next ?? "")} onMount={onMount} options={options} loading={<div className="text-sm text-white/50 font-mono">Loading editor…</div>} />;
});

const ICON_PATHS = {
  list: <><path d="M4 6h16M4 12h16M4 18h16" /><path d="M2 6h.01M2 12h.01M2 18h.01" /></>,
  left: <path d="m15 18-6-6 6-6" />, right: <path d="m9 18 6-6-6-6" />,
  shuffle: <><path d="m18 14 4 4-4 4" /><path d="m2 2 4 4 12 12" /><path d="m22 2-4 4" /><path d="M2 22 7 17" /><path d="M14 6h8v8" /></>,
  terminal: <><path d="m4 17 6-6-6-6" /><path d="M12 19h8" /></>, play: <path d="m8 5 11 7-11 7Z" />,
  panel: <><rect width="18" height="14" x="3" y="5" rx="2" /><path d="M3 10h18" /></>, grid: <><rect width="6" height="6" x="3" y="3" rx="1" /><rect width="6" height="6" x="15" y="3" rx="1" /><rect width="6" height="6" x="3" y="15" rx="1" /><rect width="6" height="6" x="15" y="15" rx="1" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.35 2.35-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.01 1.55V20.5h-3v-.08A1.7 1.7 0 0 0 10.5 18.9a1.7 1.7 0 0 0-1.88.34l-.06.06-2.35-2.35.06-.06A1.7 1.7 0 0 0 6.61 15a1.7 1.7 0 0 0-1.55-1.01H5v-3h.06A1.7 1.7 0 0 0 6.61 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06L8.56 5.7l.06.06A1.7 1.7 0 0 0 10.5 6.1a1.7 1.7 0 0 0 1.01-1.55V4.5h3v.08A1.7 1.7 0 0 0 15.5 6.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.35 2.35-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.55 1.01H21v3h-.06A1.7 1.7 0 0 0 19.4 15Z" /></>,
  refresh: <><path d="M21 12a9 9 0 0 1-15.2 6.5L3 16" /><path d="M3 21v-5h5" /><path d="M3 12A9 9 0 0 1 18.2 5.5L21 8" /><path d="M21 3v5h-5" /></>, userplus: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>,
  code: <><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" /></>, align: <><path d="M3 5h18M3 9h12M3 13h18M3 17h12" /></>, copy: <><rect width="13" height="13" x="8" y="8" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>, braces: <path d="M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1M16 3h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1" />, reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>, panelleft: <><rect width="18" height="14" x="3" y="5" rx="2" /><path d="M9 5v14" /></>
};
function Icon({ name, size = 16 }) { return <svg className="ui-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON_PATHS[name]}</svg>; }

function mapStatus(status) {
  return ({ PASS: "Accepted", WA: "Wrong Answer", TLE: "Time Limit Exceeded", RE: "Runtime Error" })[status] || status || "Pending";
}

function StatusPill({ verdict, loading }) {
  if (loading) return <span className="status-pill running"><i />Running…</span>;
  if (!verdict) return null;
  const label = mapStatus(verdict === "Accepted" ? "PASS" : verdict === "Wrong Answer" ? "WA" : verdict === "Compilation Error" ? "Compilation Error" : verdict);
  const kind = label === "Accepted" ? "accepted" : "failed";
  return <span className={`status-pill ${kind}`}>{label}</span>;
}

function Difficulty({ level = "Easy" }) {
  return <span className={`difficulty-pill ${(level || "Easy").toLowerCase()}`}>{level}</span>;
}

const TAB_ICONS = { Description: "list", Editorial: "code", Submissions: "refresh", Solutions: "braces" };

function ProblemPanel({ problem, tab, setTab, submissions }) {
  const [hintOpen, setHintOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const tabs = ["Description", "Editorial", "Submissions", "Solutions"];
  const solved = (submissions || []).some((item) => { const verdict = item.verdict || item.status; return verdict === "Accepted" || verdict === "PASS"; });
  return <aside className="problem-panel">
    <div className="problem-tabs" role="tablist">{tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={tab === item ? "active" : ""}><Icon name={TAB_ICONS[item]} size={15} />{item}</button>)}</div>
    <div className="problem-heading">
      <div className="problem-heading-top">
        <h1>{problem.title}</h1>
        <div className="heading-badges">
          {solved && <span className="solved-check">✓ Solved</span>}
          <Difficulty level={problem.difficulty} />
        </div>
      </div>
      <div className="meta-row">
        <button className={topicsOpen ? "active" : ""} onClick={() => setTopicsOpen((value) => !value)} aria-expanded={topicsOpen}>◇ Topics</button>
        <button title="Companies (Premium)">▣ Companies</button>
        <button className={hintOpen ? "active" : ""} onClick={() => setHintOpen((value) => !value)} aria-expanded={hintOpen}>✺ Hint</button>
      </div>
      {topicsOpen && <div className="tag-row">{(problem.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>}
      {hintOpen && <p className="hint">Start with the direct approach, then look for the data structure that avoids repeated work.</p>}
    </div>
    <div className="problem-body">
      {tab === "Description" && <>
        <p className="statement">{problem.statement}</p>
        <Section title="Examples"><div className="example-grid"><CodeBlock label="Example 1" value={`Input: ${problem.sampleInput || "—"}\nOutput: ${problem.sampleOutput || "—"}`} /></div></Section>
        <Section title="Constraints"><ul>{(problem.constraints || []).map((item) => <li key={item}>{item}</li>)}</ul></Section>
      </>}
      {tab === "Editorial" && <EmptyPanel title="Editorial coming soon" text="A full explanation and complexity analysis will be added for this challenge." />}
      {tab === "Solutions" && <EmptyPanel title="Community solutions" text="Verified solutions will appear here in a future update." />}
      {tab === "Submissions" && <SubmissionList submissions={submissions} />}
    </div>
    <div className="engagement-bar">
      <div className="engagement-actions">
        <button title="Like">▲ 0</button>
        <button title="Dislike">▽</button>
        <button title="Comments">✉ 0</button>
        <button title="Save to list">☆</button>
        <button title="Share">↗</button>
        <button title="Help" aria-label="Help">?</button>
      </div>
      <span className="online-badge"><span className="online-dot" />0 Online</span>
    </div>
  </aside>;
}

function Section({ title, children }) { return <section className="problem-section"><h2>{title}</h2>{children}</section>; }
function CodeBlock({ label, value }) { return <div className="code-block"><header>{label}<button onClick={() => navigator.clipboard.writeText(value || "")}>Copy</button></header><pre>{value || "—"}</pre></div>; }
function EmptyPanel({ title, text }) { return <div className="empty-panel"><strong>{title}</strong><p>{text}</p></div>; }
function SubmissionList({ submissions }) { return submissions?.length ? <div className="submission-list">{submissions.map((item) => <div key={item.id}><strong>{item.verdict || item.status}</strong><span>{item.language} · {new Date(item.created_at).toLocaleString()}</span></div>)}</div> : <EmptyPanel title="No submissions yet" text="Sign in and submit a solution to build your history." />; }

function ConsolePanel({ height, activeTab, setActiveTab, customCases, setCustomCases, results, consoleLines, loading, onRunCustom, onRunSamples, submissions }) {
  const [activeCase, setActiveCase] = useState(0);
  const tabs = ["Testcase", "Test Results", "Console", "Output", "Submissions"];
  const safeActiveCase = Math.min(activeCase, Math.max(customCases.length - 1, 0));
  const current = customCases[safeActiveCase] || customCases[0];
  const updateCase = (field, value) => setCustomCases((cases) => cases.map((item, index) => index === safeActiveCase ? { ...item, [field]: value } : item));
  return <section className="console-panel" style={{ height }}>
    <div className="console-header"><div className="console-tabs" role="tablist">{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "active" : ""}>{tab}</button>)}</div><StatusPill loading={loading} /></div>
    <div className="console-content">
      {activeTab === "Testcase" && <>
        <div className="case-tabs">{customCases.map((_, index) => <button key={index} onClick={() => setActiveCase(index)} className={safeActiveCase === index ? "active" : ""}>Case {index + 1}</button>)}<button aria-label="Add testcase" onClick={() => { setCustomCases([...customCases, { input: "", expected: "" }]); setActiveCase(customCases.length); }}>+</button></div>
        <div className="custom-case"><label>Input<textarea value={current?.input || ""} onChange={(event) => updateCase("input", event.target.value)} placeholder="Custom input" /></label><label>Expected output<textarea value={current?.expected || ""} onChange={(event) => updateCase("expected", event.target.value)} placeholder="Expected output" /></label></div>
        <div className="console-actions"><button className="subtle-btn" disabled={loading || customCases.length === 1} onClick={() => { setCustomCases(customCases.filter((_, index) => index !== activeCase)); setActiveCase(0); }}>Remove case</button><button className="primary-btn" onClick={onRunCustom} disabled={loading}>Run custom cases</button><button className="subtle-btn" onClick={onRunSamples} disabled={loading}>Run sample cases</button></div>
      </>}
      {activeTab === "Test Results" && <ResultList results={results} />}
      {activeTab === "Console" && <pre className="console-log">{consoleLines.length ? consoleLines.join("\n") : "Ready. Run code to see judge activity."}</pre>}
      {activeTab === "Output" && <ResultList results={results} showOutput />}
      {activeTab === "Submissions" && <SubmissionList submissions={submissions} />}
    </div>
  </section>;
}

function ResultList({ results, showOutput = false }) { return results?.length ? <div className="results-list">{results.map((result, index) => <article key={index} className={result.status === "PASS" ? "pass" : "fail"}><header><strong>Case {index + 1}</strong><span>{mapStatus(result.status)}</span></header><div><b>Input</b><pre>{result.input}</pre></div>{!showOutput && <div><b>Expected</b><pre>{result.expected}</pre></div>}<div><b>Your output</b><pre>{result.output || (result.status === "TLE" ? "Time Limit Exceeded" : result.status === "RE" ? "Runtime Error" : "—")}</pre></div></article>)}</div> : <EmptyPanel title="No results yet" text="Run a sample or custom testcase to see the result here." />; }

function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { if (open) requestAnimationFrame(() => inputRef.current?.focus()); }, [open]);
  if (!open) return null;
  const visible = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()));
  return <div className="palette-backdrop" role="presentation" onMouseDown={onClose}><section className="command-palette" role="dialog" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a command" aria-label="Filter commands" />{visible.map((command) => <button key={command.label} onClick={() => { command.action(); onClose(); }}><span>{command.label}</span><kbd>{command.key}</kbd></button>)}</section></div>;
}

export default function App({ onExit }) {
  const [problemId, setProblemId] = useState("two-sum");
  const [problem, setProblem] = useState(null);
  const [problems, setProblems] = useState([]);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE.cpp);
  const [fontSize, setFontSize] = useState(14);
  const [editorTheme, setEditorTheme] = useState(() => localStorage.getItem("ck_editor_theme") || "vs-dark");
  const [wordWrap, setWordWrap] = useState(() => localStorage.getItem("ck_word_wrap") === "true");
  const [minimap, setMinimap] = useState(() => localStorage.getItem("ck_minimap") !== "false");
  const [lineNumbers, setLineNumbers] = useState(() => localStorage.getItem("ck_line_numbers") !== "false");
  const [leftWidth, setLeftWidth] = useState(() => Number(localStorage.getItem("ck_editor_left_width")) || 42);
  const [consoleHeight, setConsoleHeight] = useState(() => Number(localStorage.getItem("ck_editor_console_height")) || 270);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [problemTab, setProblemTab] = useState("Description");
  const [consoleTab, setConsoleTab] = useState("Testcase");
  const [customCases, setCustomCases] = useState([{ input: "2 3", expected: "5" }]);
  const [results, setResults] = useState([]);
  const [verdict, setVerdict] = useState("");
  const [consoleLines, setConsoleLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeFile, setActiveFile] = useState("solution");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [problemMenuOpen, setProblemMenuOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const editorRef = useRef(null);
  const uploadRef = useRef(null);
  const workspaceRef = useRef(null);
  const resizeRef = useRef(null);

  const selectedLanguage = LANGUAGES.find((item) => item.id === language) || LANGUAGES[0];
  const editorOptions = useMemo(() => ({ fontSize, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontLigatures: true, minimap: { enabled: minimap }, wordWrap: wordWrap ? "on" : "off", lineNumbers: lineNumbers ? "on" : "off", scrollBeyondLastLine: false, renderLineHighlight: "gutter", smoothScrolling: true, cursorBlinking: "smooth", padding: { top: 16, bottom: 16 }, tabSize: 4, bracketPairColorization: { enabled: true }, guides: { bracketPairs: true }, folding: true, automaticLayout: true }), [fontSize, lineNumbers, minimap, wordWrap]);

  useEffect(() => { localStorage.setItem("ck_editor_theme", editorTheme); localStorage.setItem("ck_word_wrap", wordWrap); localStorage.setItem("ck_minimap", minimap); localStorage.setItem("ck_line_numbers", lineNumbers); }, [editorTheme, wordWrap, minimap, lineNumbers]);
  useEffect(() => { localStorage.setItem("ck_editor_left_width", String(leftWidth)); localStorage.setItem("ck_editor_console_height", String(consoleHeight)); }, [leftWidth, consoleHeight]);

  const loadProblem = useCallback(async () => {
    try {
      const [list, loaded, samples] = await Promise.all([fetchProblems(), fetchProblem(problemId), fetchTestCases(problemId)]);
      setProblems(list); setProblem(loaded); setWorkspaceError("");
      if (samples.length) setCustomCases(samples.map((item) => ({ input: item.input, expected: item.expected })));
    } catch (error) { setWorkspaceError(error.message || "Could not load the workspace"); }
  }, [problemId]);
  useEffect(() => { loadProblem(); }, [loadProblem]);
  useEffect(() => { const saved = localStorage.getItem(`ck_draft_${problemId}_${language}`); setCode(saved || DEFAULT_CODE[language] || ""); }, [problemId, language]);
  useEffect(() => { localStorage.setItem(`ck_draft_${problemId}_${language}`, code); }, [code, language, problemId]);
  const loadSubmissions = useCallback(async () => { try { const { submissions: items } = await fetchMySubmissions(problemId); setSubmissions(items || []); } catch { setSubmissions([]); } }, [problemId]);
  useEffect(() => { fetchCurrentUser().then(({ user: activeUser }) => { setUser(activeUser); return loadSubmissions(); }).catch(() => { setUser(null); setSubmissions([]); }); }, [loadSubmissions]);

  const run = useCallback(async (mode, cases = null) => {
    setConsoleOpen(true); setLoading(true); setResults([]); setVerdict(""); setConsoleLines([`Starting ${mode === "submit" ? "submission" : "run"}…`, `Language: ${selectedLanguage.label}`]);
    try {
      const response = cases ? await runCustomCases(problemId, code, language, cases) : await submitCode(problemId, code, language, mode);
      setResults(response.sampleResults || []); setVerdict(response.verdict || ""); setConsoleLines((lines) => [...lines, `Judge verdict: ${response.verdict || "completed"}`]); setConsoleTab("Test Results");
      if (mode === "submit" && user) loadSubmissions();
    } catch (error) { setVerdict("Compilation Error"); setConsoleLines((lines) => [...lines, `Error: ${error.message}`]); setConsoleTab("Console"); }
    finally { setLoading(false); }
  }, [code, language, loadSubmissions, problemId, selectedLanguage.label, user]);

  useEffect(() => {
    const shortcut = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (event.key === "'") { event.preventDefault(); run("run"); }
      if (event.key === "Enter") { event.preventDefault(); run("submit"); }
      if (event.key.toLowerCase() === "s") { event.preventDefault(); localStorage.setItem(`ck_draft_${problemId}_${language}`, code); setConsoleLines((lines) => [...lines, "Draft saved locally."]); }
      if (event.shiftKey && event.key.toLowerCase() === "p") { event.preventDefault(); setPaletteOpen(true); }
    };
    document.addEventListener("keydown", shortcut); return () => document.removeEventListener("keydown", shortcut);
  }, [code, language, problemId, run]);

  const onResizeStart = (kind, event) => { resizeRef.current = { kind, x: event.clientX, y: event.clientY, left: leftWidth, console: consoleHeight }; document.body.style.userSelect = "none"; };
  useEffect(() => { const move = (event) => { if (!resizeRef.current) return; const current = resizeRef.current; if (current.kind === "left" && workspaceRef.current) { const rect = workspaceRef.current.getBoundingClientRect(); setLeftWidth(Math.min(65, Math.max(28, current.left + ((event.clientX - current.x) / rect.width) * 100))); } if (current.kind === "console") setConsoleHeight(Math.min(560, Math.max(170, current.console + current.y - event.clientY))); }; const end = () => { resizeRef.current = null; document.body.style.userSelect = ""; }; document.addEventListener("mousemove", move); document.addEventListener("mouseup", end); return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", end); }; }, [consoleHeight, leftWidth]);

  function resetCode() { localStorage.removeItem(`ck_draft_${problemId}_${language}`); setCode(DEFAULT_CODE[language] || ""); }
  function formatCode() { editorRef.current?.getAction("editor.action.formatDocument")?.run(); }
  function copyCode() { navigator.clipboard.writeText(code); setConsoleLines((lines) => [...lines, "Code copied to clipboard."]); }
  function downloadCode() { const url = URL.createObjectURL(new Blob([code], { type: "text/plain" })); const link = document.createElement("a"); link.href = url; link.download = `solution.${selectedLanguage.extension}`; link.click(); URL.revokeObjectURL(url); }
  function uploadCode(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setCode(String(reader.result || "")); reader.readAsText(file); event.target.value = ""; }

  if (!problem) return <main className="workspace-loader"><div className="loader-ring" /><p>{workspaceError || "Loading coding workspace…"}</p><button onClick={loadProblem}>Retry</button></main>;
  const commands = [
    { label: "Run sample tests", key: "Ctrl+'", action: () => run("run") },
    { label: "Submit solution", key: "Ctrl+Enter", action: () => run("submit") },
    { label: "Format document", key: "", action: formatCode },
    { label: "Copy code", key: "", action: copyCode },
    { label: "Download code", key: "", action: downloadCode },
    { label: "Upload code", key: "", action: () => uploadRef.current?.click() },
    { label: "Reset to starter code", key: "", action: resetCode },
    { label: "Toggle editor theme", key: "", action: () => setEditorTheme((value) => (value === "vs-dark" ? "vs" : "vs-dark")) },
    { label: "Toggle minimap", key: "", action: () => setMinimap((value) => !value) },
    { label: "Toggle word wrap", key: "", action: () => setWordWrap((value) => !value) },
    { label: "Toggle line numbers", key: "", action: () => setLineNumbers((value) => !value) },
    { label: "Increase font size", key: "", action: () => setFontSize((size) => Math.min(24, size + 1)) },
    { label: "Decrease font size", key: "", action: () => setFontSize((size) => Math.max(10, size - 1)) },
  ];
  return <main className="workspace-shell">
    <header className="workspace-nav">
      <div className="nav-left">
        {onExit ? <button className="workspace-brand" onClick={onExit} aria-label="Return to dashboard"><Icon name="code" size={21} /></button> : <a className="workspace-brand" href="/" aria-label="codekurukshetra home"><Icon name="code" size={21} /></a>}
        <div className="problem-list-wrap">
          <button className="icon-btn wide" onClick={() => setProblemMenuOpen((value) => !value)} aria-expanded={problemMenuOpen}><Icon name="list" /><span className="label">Problem List</span></button>
          {problemMenuOpen && <div className="problem-list-menu" role="menu">{problems.map((item) => <button key={item.id} role="menuitem" className={item.id === problemId ? "active" : ""} onClick={() => { setProblemId(item.id); setProblemMenuOpen(false); }}>{item.title}</button>)}</div>}
        </div>
        <button className="icon-btn" title="Previous problem" aria-label="Previous problem"><Icon name="left" /></button>
        <button className="icon-btn" title="Next problem" aria-label="Next problem"><Icon name="right" /></button>
        <button className="icon-btn" title="Random problem" aria-label="Random problem"><Icon name="shuffle" /></button>
      </div>
      <div className="nav-center">
        <button className="icon-btn" title="Debug console" aria-label="Debug console" onClick={() => { setConsoleOpen(true); setConsoleTab("Console"); }}><Icon name="terminal" /></button>
        <button className="icon-btn run-btn" title="Run (Ctrl+')" aria-label="Run" disabled={loading} onClick={() => run("run")}><Icon name="play" /></button>
        <button className="submit-pill" disabled={loading} onClick={() => run("submit")} title="Submit (Ctrl+Enter)"><Icon name="code" /><span className="label">Submit</span></button>
        <button className={`icon-btn ${consoleOpen ? "selected" : ""}`} title="Toggle testcase panel" aria-label="Toggle testcase panel" onClick={() => setConsoleOpen((open) => !open)}><Icon name="panel" /></button>
      </div>
      <div className="nav-right">
        <button className="icon-btn" title="Layout" aria-label="Layout"><Icon name="grid" /></button>
        <button className="icon-btn" title="Command palette (Ctrl+Shift+P)" aria-label="Command palette" onClick={() => setPaletteOpen(true)}><Icon name="settings" /></button>
        <span className="timer-chip" title="Run count">▶ 0</span>
        <button className="icon-btn" title="Refresh workspace" aria-label="Refresh workspace" onClick={loadProblem}><Icon name="refresh" /></button>
        <button className="icon-btn" title="Invite" aria-label="Invite"><Icon name="userplus" /></button>
        {user ? <span className="avatar-circle" title={user.name}>{(user.name || "U").slice(0, 1).toUpperCase()}</span> : <button className="premium-btn">Sign in</button>}
      </div>
    </header>
    <div className="workspace" ref={workspaceRef}>
      <div className="problem-column" style={{ width: `${leftWidth}%` }}><ProblemPanel problem={problem} tab={problemTab} setTab={setProblemTab} submissions={submissions} /></div>
      <div className="resize-v" role="separator" aria-label="Resize problem panel" onMouseDown={(event) => onResizeStart("left", event)} />
      <section className="editor-column">
        <div className="code-panel-header"><span className="title"><Icon name="code" />Code</span></div>
        <div className="editor-tabs"><button onClick={() => setActiveFile("solution")} className={activeFile === "solution" ? "active" : ""}><i>⌘</i> solution.{selectedLanguage.extension}<span>×</span></button><button onClick={() => setActiveFile("input.txt")} className={activeFile === "input.txt" ? "active" : ""}>input.txt <span>×</span></button><button onClick={() => setActiveFile("output.txt")} className={activeFile === "output.txt" ? "active" : ""}>output.txt <span>×</span></button></div>
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <select value={language} aria-label="Programming language" onChange={(event) => { const next = LANGUAGES.find((item) => item.id === event.target.value); if (!next?.disabled) setLanguage(event.target.value); }}>{LANGUAGES.map((item) => <option key={item.id} value={item.id} disabled={item.disabled}>{item.label}{item.disabled ? " (coming soon)" : ""}</option>)}</select>
            <span className="autosave-chip"><span aria-hidden="true">🔒</span>Auto</span>
          </div>
          <div className="toolbar-group">
            <button className="icon-btn" title="Toggle line numbers" aria-label="Toggle line numbers" onClick={() => setLineNumbers((value) => !value)}><Icon name="align" /></button>
            <button className="icon-btn" title="Copy code" aria-label="Copy code" onClick={copyCode}><Icon name="copy" /></button>
            <button className="icon-btn" title="Format document" aria-label="Format document" onClick={formatCode}><Icon name="braces" /></button>
            <button className="icon-btn" title="Reset to starter code" aria-label="Reset to starter code" onClick={resetCode}><Icon name="reset" /></button>
            <button className="icon-btn" title="Toggle problem panel" aria-label="Toggle problem panel" onClick={() => setLeftWidth((width) => (width < 15 ? 42 : 8))}><Icon name="panelleft" /></button>
            <input ref={uploadRef} type="file" accept=".cpp,.cc,.cxx,.py,.java,.js,.txt" hidden onChange={uploadCode} />
          </div>
        </div>
        <div className="editor-area">{activeFile === "solution" ? <CodeEditor language={selectedLanguage.monacoId} theme={editorTheme} value={code} onChange={setCode} options={editorOptions} onMount={(editor) => { editorRef.current = editor; editor.onDidChangeCursorPosition((event) => setCursorPos({ line: event.position.lineNumber, column: event.position.column })); }} /> : <pre className="virtual-file">{activeFile === "input.txt" ? (customCases[0]?.input || "") : (results[0]?.output || "Run code to populate output.txt")}</pre>}</div>
        {consoleOpen && <><div className="resize-h" role="separator" aria-label="Resize console" onMouseDown={(event) => onResizeStart("console", event)} />
        <ConsolePanel height={consoleHeight} activeTab={consoleTab} setActiveTab={setConsoleTab} customCases={customCases} setCustomCases={setCustomCases} results={results} consoleLines={consoleLines} loading={loading} onRunCustom={() => run("run", customCases)} onRunSamples={() => run("run")} submissions={submissions} /></>}
        <footer className="editor-footer"><span className="save-status"><StatusPill verdict={verdict} loading={loading} /><span aria-hidden="true">●</span>Saved</span><span className="cursor-pos">Ln {cursorPos.line}, Col {cursorPos.column}</span></footer>
      </section>
    </div>
    <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
  </main>;
}
