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
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Write your solution here\n\n    return 0;\n}`,
  python: `import sys\n\ndef solve():\n    # Write your solution here\n    s = sys.stdin.readline().strip()\n    if s:\n        print(0)\n\nif __name__ == "__main__":\n    solve()`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        if (scanner.hasNext()) {\n            String s = scanner.next();\n            // Write your solution here\n            System.out.println(0);\n        }\n    }\n}`,
  js: `const input = require("fs").readFileSync(0, "utf8").trim();\nif (input) {\n    // Write your solution here\n    console.log(0);\n}`,
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

function ProblemPanel({ problem, tab, setTab, submissions, onlineCount, onOpenCompanies, onOpenFeedback }) {
  const [hintOpen, setHintOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);

  // Real dynamic engagement state synced with problem backend data
  const [likes, setLikes] = useState(problem?.likes || 0);
  const [dislikes, setDislikes] = useState(problem?.dislikes || 0);
  const [liked, setLiked] = useState(() => localStorage.getItem(`ck_liked_${problem?.id}`) === "true");
  const [disliked, setDisliked] = useState(() => localStorage.getItem(`ck_disliked_${problem?.id}`) === "true");
  const [starred, setStarred] = useState(() => localStorage.getItem(`ck_starred_${problem?.id}`) === "true");
  const [commentsCount, setCommentsCount] = useState(problem?.commentsCount || problem?.comments?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentsList, setCommentsList] = useState(problem?.comments || []);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (problem) {
      setLikes(problem.likes || 0);
      setDislikes(problem.dislikes || 0);
      setCommentsCount(problem.commentsCount || problem.comments?.length || 0);
      setCommentsList(problem.comments || []);
    }
  }, [problem]);

  const handleLike = () => {
    if (liked) {
      setLikes(prev => Math.max(0, prev - 1));
      setLiked(false);
      localStorage.removeItem(`ck_liked_${problem?.id}`);
      fetch(`/api/problems/${problem?.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "unlike" }) }).catch(() => { });
    } else {
      setLikes(prev => prev + 1);
      setLiked(true);
      localStorage.setItem(`ck_liked_${problem?.id}`, "true");
      fetch(`/api/problems/${problem?.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "like" }) }).catch(() => { });
      if (disliked) {
        setDislikes(prev => Math.max(0, prev - 1));
        setDisliked(false);
        localStorage.removeItem(`ck_disliked_${problem?.id}`);
        fetch(`/api/problems/${problem?.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "undislike" }) }).catch(() => { });
      }
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDislikes(prev => Math.max(0, prev - 1));
      setDisliked(false);
      localStorage.removeItem(`ck_disliked_${problem?.id}`);
      fetch(`/api/problems/${problem?.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "undislike" }) }).catch(() => { });
    } else {
      setDislikes(prev => prev + 1);
      setDisliked(true);
      localStorage.setItem(`ck_disliked_${problem?.id}`, "true");
      fetch(`/api/problems/${problem?.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "dislike" }) }).catch(() => { });
      if (liked) {
        setLikes(prev => Math.max(0, prev - 1));
        setLiked(false);
        localStorage.removeItem(`ck_liked_${problem?.id}`);
        fetch(`/api/problems/${problem?.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "unlike" }) }).catch(() => { });
      }
    }
  };

  const toggleStar = () => {
    const nextState = !starred;
    setStarred(nextState);
    if (nextState) {
      localStorage.setItem(`ck_starred_${problem?.id}`, "true");
      setToastMessage("Problem saved to your bookmarks!");
    } else {
      localStorage.removeItem(`ck_starred_${problem?.id}`);
      setToastMessage("Removed from bookmarks.");
    }
    setTimeout(() => setToastMessage(""), 2200);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setToastMessage("Problem URL copied to clipboard!");
    setTimeout(() => setToastMessage(""), 2200);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const author = "You";
    const text = newComment.trim();
    setCommentsList(prev => [...prev, { author, text, createdAt: new Date() }]);
    setCommentsCount(prev => prev + 1);
    setNewComment("");
    fetch(`/api/problems/${problem?.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, text })
    }).catch(() => { });
  };

  const tabs = ["Description", "Editorial", "Submissions", "Solutions"];
  const solved = (submissions || []).some((item) => { const verdict = item.verdict || item.status; return verdict === "Accepted" || verdict === "PASS"; });
  return <aside className="problem-panel">
    {toastMessage && (
      <div className="toast-notification">
        {toastMessage}
      </div>
    )}
    <div className="problem-tabs" role="tablist">{tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={tab === item ? "active" : ""}><Icon name={TAB_ICONS[item]} size={15} />{item}</button>)}</div>
    <div className="problem-body">
      <div className="problem-heading" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="problem-heading-top">
          <h1>{problem.title}</h1>
          <div className="heading-badges">
            {solved && <span className="solved-check">✓ Solved</span>}
            <Difficulty level={problem.difficulty} />
          </div>
        </div>
        <div className="meta-row">
          <button className={`meta-pill ${topicsOpen ? "active" : ""}`} onClick={() => setTopicsOpen((value) => !value)} aria-expanded={topicsOpen} title="Filter topic tags">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM5 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" /></svg>
            Topics
          </button>
          <button className="meta-pill" title="View targeted companies" onClick={onOpenCompanies}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Companies
          </button>
          <button className={`meta-pill ${hintOpen ? "active" : ""}`} onClick={() => setHintOpen((value) => !value)} aria-expanded={hintOpen} title="Show problem hint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zm3-19C7.58 2 4 5.58 4 10c0 2.76 1.38 5.2 3.5 6.67V19a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2.33c2.12-1.47 3.5-3.91 3.5-6.67 0-4.42-3.58-8-8-8z" /></svg>
            Hint
          </button>
        </div>
        {topicsOpen && <div className="tag-row">{(problem.tags || ["Arrays", "Greedy", "String Manipulation"]).map((tag) => <span key={tag}>{tag}</span>)}</div>}
        {hintOpen && <p className="hint">Treat boundaries carefully by analyzing consecutive zero/one block segments before performing the trade operation.</p>}
      </div>
      {tab === "Description" && <>
        <p className="statement" style={{ whiteSpace: 'pre-wrap' }}>{problem.statement}</p>
        <Section title="Examples"><div className="example-grid"><CodeBlock label="Example 1" value={`Input: s = "${problem.sampleInput || "01"}"\nOutput: ${problem.sampleOutput || "1"}`} /></div></Section>
        <Section title="Constraints"><ul>{(problem.constraints || ["1 <= s.length <= 10^5", "s consists only of '0' and '1' characters."]).map((item) => <li key={item}>{item}</li>)}</ul></Section>

        {showComments && (
          <div className="comments-section" style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#fff', fontWeight: '600' }}>Community Discussion ({commentsCount})</h3>
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your thoughts or ask a question..."
                style={{ flex: 1, background: 'var(--panel-soft)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
              <button type="submit" className="subtle-btn" style={{ padding: '6px 12px' }}>Post</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {commentsList.map((c, i) => (
                <div key={i} style={{ background: 'var(--panel-soft)', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}>
                  <strong style={{ color: 'var(--accent)', marginRight: '6px' }}>{c.author}</strong>
                  <span style={{ color: '#e5e7eb' }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>}
      {tab === "Editorial" && (
        <div className="editorial-content" style={{ color: "#e5e7eb", lineHeight: "1.7", fontSize: "14px" }}>
          <h3 style={{ fontSize: "16px", color: "#fff", marginBottom: "8px", fontWeight: "600" }}>Solution & Algorithmic Breakdown</h3>
          <p style={{ color: "#9ca3af", marginBottom: "16px" }}>
            This problem requires analyzing contiguous segments or binary blocks. Below is the detailed algorithmic approach.
          </p>
          <h4 style={{ color: "var(--accent)", fontSize: "14px", marginBottom: "6px", fontWeight: "600" }}>Approach 1: Greedy Linear Scan</h4>
          <p style={{ margin: "0 0 12px" }}>
            Traverse the input string or array sequentially. Evaluate trade section boundaries to maximize total active elements.
          </p>
          <div style={{ background: "var(--panel-soft)", padding: "12px", borderRadius: "8px", margin: "14px 0", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
            <strong>Algorithm Steps:</strong><br />
            1. Initialize <code>max_val = 0</code> and <code>curr = 0</code>.<br />
            2. Iterate through each element in the input sequence.<br />
            3. Compute local section trade bounds.<br />
            4. Return the global maximum score.
          </div>
          <h4 style={{ color: "var(--accent)", fontSize: "14px", margin: "16px 0 6px", fontWeight: "600" }}>Complexity Analysis</h4>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            <li><strong>Time Complexity:</strong> \(O(N)\) — Single scan through input sequence of length \(N\).</li>
            <li><strong>Space Complexity:</strong> \(O(1)\) — Constant additional space.</li>
          </ul>
        </div>
      )}
      {tab === "Solutions" && (
        <div className="solutions-content">
          <h3 style={{ fontSize: "15px", color: "#fff", marginBottom: "12px", fontWeight: "600" }}>Official Multi-Language Solutions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <header style={{ display: "flex", justifyContent: "space-between", color: "#ffa116", fontWeight: "600", fontSize: "13px", marginBottom: "6px" }}>
                <span>C++17 Solution (Optimal O(N))</span>
                <button className="subtle-btn" style={{ fontSize: "10px", padding: "2px 8px" }} onClick={() => { navigator.clipboard.writeText(`int solve(string s) {\n    int n = s.length(), maxScore = 0;\n    for(int i = 0; i < n; i++) {\n        if(s[i] == '1') maxScore++;\n    }\n    return maxScore;\n}`); setToastMessage("C++ Solution copied!"); setTimeout(() => setToastMessage(""), 2000); }}>Copy</button>
              </header>
              <pre style={{ background: "var(--panel-soft)", padding: "12px", borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#d1d5db", margin: 0, whiteSpace: "pre-wrap" }}>
                {`int solve(string s) {
    int n = s.length(), maxScore = 0;
    for(int i = 0; i < n; i++) {
        if(s[i] == '1') maxScore++;
    }
    return maxScore;
}`}
              </pre>
            </div>

            <div>
              <header style={{ display: "flex", justifyContent: "space-between", color: "#3bdcff", fontWeight: "600", fontSize: "13px", marginBottom: "6px" }}>
                <span>Python 3 Solution</span>
                <button className="subtle-btn" style={{ fontSize: "10px", padding: "2px 8px" }} onClick={() => { navigator.clipboard.writeText(`class Solution:\n    def solve(self, s: str) -> int:\n        return s.count('1')`); setToastMessage("Python Solution copied!"); setTimeout(() => setToastMessage(""), 2000); }}>Copy</button>
              </header>
              <pre style={{ background: "var(--panel-soft)", padding: "12px", borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#d1d5db", margin: 0, whiteSpace: "pre-wrap" }}>
                {`class Solution:
    def solve(self, s: str) -> int:
        return s.count('1')`}
              </pre>
            </div>
          </div>
        </div>
      )}
      {tab === "Submissions" && <SubmissionList submissions={submissions} />}
    </div>
    <div className="engagement-bar">
      <div className="engagement-actions">
        <button onClick={handleLike} title="Upvote problem" className={liked ? "active-like" : ""}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
          <span>{likes}</span>
        </button>
        <button onClick={handleDislike} title="Downvote problem" className={disliked ? "active-dislike" : ""}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={disliked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" /></svg>
          <span>{dislikes}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} title="Discussions & Comments" className={showComments ? "active-comment" : ""}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          <span>{commentsCount}</span>
        </button>
        <button onClick={toggleStar} title={starred ? "Remove from bookmarks" : "Bookmark problem"} className={starred ? "active-star" : ""}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={starred ? "#ffb800" : "none"} stroke={starred ? "#ffb800" : "currentColor"} strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </button>
        <button onClick={handleShare} title="Share problem link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
        </button>
        <button onClick={onOpenFeedback} title="Report issue / Feedback" aria-label="Report issue or give feedback">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        </button>
      </div>
      <span className="online-badge" title={`${onlineCount} active coders online on CodeKurukshetra solving problems right now`}>
        <span className="online-dot" />
        {onlineCount} Online
      </span>
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
  const [problemId, setProblemId] = useState(() => localStorage.getItem("ck_last_problem") || "maximize-active-section-with-trade-i");
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
  const [customCases, setCustomCases] = useState([{ input: "01", expected: "1" }]);
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
  const [aiOpen, setAiOpen] = useState(false);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("general");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [layoutPresetIndex, setLayoutPresetIndex] = useState(0);

  // Timer states - initialized to false so user manually starts timer
  const [time, setTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState("");

  const showToast = (msg) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(""), 2200);
  };

  // Online count state
  const [onlineCount, setOnlineCount] = useState(1);

  const editorRef = useRef(null);
  const uploadRef = useRef(null);
  const workspaceRef = useRef(null);
  const resizeRef = useRef(null);

  const selectedLanguage = LANGUAGES.find((item) => item.id === language) || LANGUAGES[0];
  const editorOptions = useMemo(() => ({ fontSize, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontLigatures: true, minimap: { enabled: minimap }, wordWrap: wordWrap ? "on" : "off", lineNumbers: lineNumbers ? "on" : "off", scrollBeyondLastLine: false, renderLineHighlight: "gutter", smoothScrolling: true, cursorBlinking: "smooth", padding: { top: 16, bottom: 16 }, tabSize: 4, bracketPairColorization: { enabled: true }, guides: { bracketPairs: true }, folding: true, automaticLayout: true }), [fontSize, lineNumbers, minimap, wordWrap]);

  useEffect(() => { localStorage.setItem("ck_editor_theme", editorTheme); localStorage.setItem("ck_word_wrap", wordWrap); localStorage.setItem("ck_minimap", minimap); localStorage.setItem("ck_line_numbers", lineNumbers); }, [editorTheme, wordWrap, minimap, lineNumbers]);
  useEffect(() => { localStorage.setItem("ck_editor_left_width", String(leftWidth)); localStorage.setItem("ck_editor_console_height", String(consoleHeight)); }, [leftWidth, consoleHeight]);

  // Stopwatch timer interval
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Online count poller - Real backend data
  useEffect(() => {
    const getCount = () => {
      fetch("/api/auth/online")
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => {
          if (typeof data.count === "number") setOnlineCount(data.count);
        })
        .catch(() => {
          setOnlineCount(1);
        });
    };
    getCount();
    const interval = setInterval(getCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const handleReturnToDashboard = () => {
    if (onExit) {
      onExit();
    } else {
      window.location.href = "/dashboard";
    }
  };

  const cycleLayoutPresets = () => {
    const presets = [42, 28, 60, 10];
    const nextIdx = (layoutPresetIndex + 1) % presets.length;
    setLayoutPresetIndex(nextIdx);
    setLeftWidth(presets[nextIdx]);
  };

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
  useEffect(() => {
    fetchCurrentUser().then(({ user: activeUser }) => {
      setUser(activeUser);
      return loadSubmissions();
    }).catch(() => {
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "null");
        if (stored) setUser(stored);
        else setUser({ name: "Lakshmi Deepak", email: "deepak@codekurukshetra.com" });
      } catch {
        setUser({ name: "Lakshmi Deepak", email: "deepak@codekurukshetra.com" });
      }
      setSubmissions([]);
    });
  }, [loadSubmissions]);

  const handlePrevProblem = () => {
    if (!problems.length) return;
    const currIdx = problems.findIndex((p) => p.id === problemId);
    const prevIdx = (currIdx - 1 + problems.length) % problems.length;
    const nextId = problems[prevIdx].id;
    setProblemId(nextId);
    localStorage.setItem("ck_last_problem", nextId);
  };

  const handleNextProblem = () => {
    if (!problems.length) return;
    const currIdx = problems.findIndex((p) => p.id === problemId);
    const nextIdx = (currIdx + 1) % problems.length;
    const nextId = problems[nextIdx].id;
    setProblemId(nextId);
    localStorage.setItem("ck_last_problem", nextId);
  };

  const handleRandomProblem = () => {
    if (!problems.length) return;
    const randomIdx = Math.floor(Math.random() * problems.length);
    const nextId = problems[randomIdx].id;
    setProblemId(nextId);
    localStorage.setItem("ck_last_problem", nextId);
  };

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
  useEffect(() => { const move = (event) => { if (!resizeRef.current) return; const current = resizeRef.current; if (current.kind === "left" && workspaceRef.current) { const rect = workspaceRef.current.getBoundingClientRect(); setLeftWidth(Math.min(75, Math.max(8, current.left + ((event.clientX - current.x) / rect.width) * 100))); } if (current.kind === "console") setConsoleHeight(Math.min(560, Math.max(170, current.console + current.y - event.clientY))); }; const end = () => { resizeRef.current = null; document.body.style.userSelect = ""; }; document.addEventListener("mousemove", move); document.addEventListener("mouseup", end); return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", end); }; }, [consoleHeight, leftWidth]);

  function resetCode() { localStorage.removeItem(`ck_draft_${problemId}_${language}`); setCode(DEFAULT_CODE[language] || ""); showToast("Code reset to starter template!"); }
  function formatCode() { editorRef.current?.getAction("editor.action.formatDocument")?.run(); showToast("Code document formatted!"); }
  function copyCode() { navigator.clipboard.writeText(code); showToast("Code copied to clipboard!"); }
  function downloadCode() { const url = URL.createObjectURL(new Blob([code], { type: "text/plain" })); const link = document.createElement("a"); link.href = url; link.download = `solution.${selectedLanguage.extension}`; link.click(); URL.revokeObjectURL(url); showToast(`Downloaded solution.${selectedLanguage.extension}`); }
  function uploadCode(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { setCode(String(reader.result || "")); showToast(`Uploaded ${file.name}`); }; reader.readAsText(file); event.target.value = ""; }

  const handleSendFeedback = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackOpen(false);
      setFeedbackText("");
    }, 1800);
  };

  if (!problem) return <main className="workspace-loader"><div className="loader-ring" /><p>{workspaceError || "Loading CodeKurukshetra workspace…"}</p><button onClick={loadProblem}>Retry</button></main>;
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
    { label: "Return to Dashboard", key: "", action: handleReturnToDashboard },
  ];

  return <main className="workspace-shell">
    {/* AI Assistant Modal */}
    {aiOpen && (
      <div className="palette-backdrop" onMouseDown={() => setAiOpen(false)}>
        <div className="custom-modal-card" onMouseDown={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "#a855f7", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: "600" }}>
              <span>✨</span> CodeKurukshetra AI Assistant
            </h3>
            <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer" }}>×</button>
          </div>
          <p style={{ color: "#d1d5db", fontSize: "13px", lineHeight: "1.6" }}>
            Need help solving <strong>{problem.title}</strong>? Here are targeted hints and algorithmic guidance:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            <div style={{ background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.25)", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", color: "#e9d5ff" }}>
              <strong>Hint 1:</strong> Identify contiguous zero and one sequences. Notice how boundary trades modify total sequence values.
            </div>
            <div style={{ background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.25)", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", color: "#e9d5ff" }}>
              <strong>Optimal Complexity:</strong> Time Complexity: \(O(N)\), Auxiliary Space: \(O(1)\).
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Target Companies Modal */}
    {companiesOpen && (
      <div className="palette-backdrop" onMouseDown={() => setCompaniesOpen(false)}>
        <div className="custom-modal-card" onMouseDown={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "#ffa116", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: "600" }}>
              🏢 Target Interview Companies
            </h3>
            <button onClick={() => setCompaniesOpen(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer" }}>×</button>
          </div>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "14px" }}>
            Companies that frequently ask <strong>{problem.title}</strong> in technical interviews:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {[
              { name: "Google", freq: "High (88%)", color: "#4285F4" },
              { name: "Amazon", freq: "Very High (94%)", color: "#FF9900" },
              { name: "Meta", freq: "Medium (76%)", color: "#0668E1" },
              { name: "Microsoft", freq: "High (82%)", color: "#00A4EF" },
              { name: "Uber", freq: "High (80%)", color: "#000000" },
              { name: "Flipkart", freq: "Very High (91%)", color: "#2874F0" },
            ].map((comp) => (
              <div key={comp.name} style={{ background: "var(--panel-alt)", border: "1px solid var(--border)", padding: "10px 12px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "600", fontSize: "13px", color: "#fff" }}>{comp.name}</span>
                <span style={{ fontSize: "11px", color: "#37c55f", background: "rgba(55, 197, 95, 0.12)", padding: "2px 8px", borderRadius: "12px", fontWeight: "500" }}>{comp.freq}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Feedback Modal */}
    {feedbackOpen && (
      <div className="palette-backdrop" onMouseDown={() => setFeedbackOpen(false)}>
        <div className="custom-modal-card" onMouseDown={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: "600" }}>
              💬 Submit Problem Feedback
            </h3>
            <button onClick={() => setFeedbackOpen(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer" }}>×</button>
          </div>
          {feedbackSubmitted ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#2db55d", fontSize: "14px", fontWeight: "600" }}>
              ✓ Thank you! Your feedback has been received.
            </div>
          ) : (
            <form onSubmit={handleSendFeedback} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ fontSize: "12px", color: "#9ca3af" }}>
                Feedback Type:
                <select value={feedbackCategory} onChange={e => setFeedbackCategory(e.target.value)} style={{ width: "100%", marginTop: "4px", background: "var(--panel-alt)", border: "1px solid var(--border)", padding: "8px", borderRadius: "6px", color: "#fff" }}>
                  <option value="general">General Feedback</option>
                  <option value="testcase">Testcase Issue / Bug</option>
                  <option value="typo">Statement Typo</option>
                  <option value="solution">Editorial / Solution Doubt</option>
                </select>
              </label>
              <label style={{ fontSize: "12px", color: "#9ca3af" }}>
                Details:
                <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Describe the issue or share your suggestion..." rows={4} style={{ width: "100%", marginTop: "4px", background: "var(--panel-alt)", border: "1px solid var(--border)", padding: "8px", borderRadius: "6px", color: "#fff", resize: "vertical", fontFamily: "inherit" }} required />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                <button type="button" className="subtle-btn" onClick={() => setFeedbackOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Submit Feedback</button>
              </div>
            </form>
          )}
        </div>
      </div>
    )}

    {/* Premium Modal */}
    {premiumOpen && (
      <div className="palette-backdrop" onMouseDown={() => setPremiumOpen(false)}>
        <div className="custom-modal-card" style={{ border: "1px solid #ffa116" }} onMouseDown={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, color: "#ffa116", display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: "700" }}>
              👑 CodeKurukshetra Premium
            </h3>
            <button onClick={() => setPremiumOpen(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer" }}>×</button>
          </div>
          <p style={{ color: "#d1d5db", fontSize: "13px", lineHeight: "1.5" }}>
            Supercharge your competitive programming and interview prep with exclusive features:
          </p>
          <ul style={{ paddingLeft: "20px", color: "#e5e7eb", fontSize: "13px", lineHeight: "1.8", margin: "12px 0 18px" }}>
            <li>⚡ <strong>Unlimited AI Code Assistance</strong> & Step-by-Step Debugging</li>
            <li>🎯 <strong>Company-Specific Problem Packs</strong> (Google, Meta, Amazon, Microsoft)</li>
            <li>⚔️ <strong>1v1 Battle Arena Perks</strong> (Custom duels, rating protection)</li>
            <li>📹 <strong>Full Video Editorials</strong> & Detailed System Design Walkthroughs</li>
          </ul>
          <button className="premium-btn-gold" style={{ width: "100%", justifyContent: "center", height: "36px", fontSize: "13px" }} onClick={() => { setPremiumOpen(false); alert("CodeKurukshetra Premium activated for session!"); }}>
            Upgrade to Premium Now
          </button>
        </div>
      </div>
    )}

    <header className="workspace-nav">
      <div className="nav-left">
        <button
          className="workspace-brand-text"
          onClick={handleReturnToDashboard}
          title="Return to CodeKurukshetra Dashboard"
          aria-label="Return to CodeKurukshetra Dashboard"
        >
          <span className="brand-code">CODE</span>
          <span className="brand-kurukshetra">KURUKSHETRA</span>
        </button>
        <div className="problem-list-wrap">
          <button className="icon-btn wide dropdown-trigger" onClick={() => setProblemMenuOpen((value) => !value)} aria-expanded={problemMenuOpen} title="Select problem">
            <span className="label" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{problem.title}</span>
            <span className="caret-down" style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>▼</span>
          </button>
          {problemMenuOpen && (
            <div className="problem-list-menu" role="menu">
              {problems.map((item) => (
                <button
                  key={item.id}
                  role="menuitem"
                  className={item.id === problemId ? "active" : ""}
                  onClick={() => {
                    setProblemId(item.id);
                    localStorage.setItem("ck_last_problem", item.id);
                    setProblemMenuOpen(false);
                  }}
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="icon-btn arrow-btn" title="Previous problem" aria-label="Previous problem" onClick={handlePrevProblem}><Icon name="left" size={14} /></button>
        <button className="icon-btn arrow-btn" title="Next problem" aria-label="Next problem" onClick={handleNextProblem}><Icon name="right" size={14} /></button>
      </div>

      <div className="nav-center">
        <button className="icon-btn layout-trigger" title="Cycle Split Layout (50/50, 30/70, 70/30, Full)" aria-label="Cycle Split Layout" onClick={cycleLayoutPresets}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
        </button>
        <button className="icon-btn run-circle-btn" title="Run Sample Cases (Ctrl+')" aria-label="Run" disabled={loading} onClick={() => { setConsoleOpen(true); setConsoleTab("Testcase"); run("run"); }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        </button>
        <button className="submit-pill-green" disabled={loading} onClick={() => { setConsoleOpen(true); setConsoleTab("Test Results"); run("submit"); }} title="Submit Solution (Ctrl+Enter)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}><path d="M12 13V22M12 13L9 16M12 13L15 16M20 17.58A7 7 0 1 0 7.73 8.35 4.5 4.5 0 0 0 8 17.2h12" /></svg>
          Submit
        </button>
        <button className="icon-btn debug-trigger" title="Toggle debug console" aria-label="Toggle debug console" onClick={() => { setConsoleOpen(!consoleOpen); setConsoleTab("Console"); }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="6" y="8" width="12" height="11" rx="2" /><path d="M9 8V5a3 3 0 0 1 6 0v3M4 12h2M18 12h2M4 16h2M18 16h2M8 20l-2 2M16 20l2 2" /></svg>
        </button>
        <button className="icon-btn ai-trigger" title="CodeKurukshetra AI Assistant" aria-label="AI helper" onClick={() => setAiOpen(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: '#a855f7' }}><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275Z" fill="currentColor" /></svg>
        </button>
      </div>

      <div className="nav-right">
        <button className="icon-btn" title="Reset panel layout" aria-label="Reset panel layout" onClick={() => setLeftWidth(42)}><Icon name="grid" /></button>
        <button className="icon-btn" title="Command palette (Ctrl+Shift+P)" aria-label="Command palette" onClick={() => setPaletteOpen(true)}><Icon name="settings" /></button>

        {/* Manual Stopwatch Timer */}
        <div className="timer-chip-leetcode" title="Stopwatch Session Timer (Click play to start timing)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          <span style={{ color: timerRunning ? '#2db55d' : '#ef4444', fontWeight: 'bold' }}>{formatTime(time)}</span>
          <button className="timer-action" onClick={() => { setTimerRunning(!timerRunning); showToast(timerRunning ? "Timer paused" : "Timer started!"); }} title={timerRunning ? "Pause timer" : "Start timer"} style={{ background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {timerRunning ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            )}
          </button>
          <button className="timer-action" onClick={() => { setTime(0); setTimerRunning(false); showToast("Timer reset"); }} title="Reset timer" style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
          </button>
        </div>
        {/* User Profile Avatar Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className="avatar-circle-btn"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            title={user ? user.name : "User Profile"}
            aria-label="User Profile"
          >
            {(user?.name || "L").slice(0, 1).toUpperCase()}
          </button>

          {profileMenuOpen && (
            <div className="profile-dropdown-menu">
              <div className="profile-header">
                <strong>{user?.name || "Lakshmi Deepak"}</strong>
                <span>{user?.email || "deepak@codekurukshetra.com"}</span>
              </div>
              <div className="profile-divider" />
              <button className="profile-menu-item" onClick={handleReturnToDashboard}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
                Dashboard Overview
              </button>
              <button className="profile-menu-item" onClick={() => { setProfileMenuOpen(false); setPremiumOpen(true); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                My Account & Premium
              </button>
              <div className="profile-divider" />
              <button className="profile-menu-item signout" onClick={handleReturnToDashboard}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Exit to Dashboard
              </button>
            </div>
          )}
        </div>
        <button className="premium-btn-gold" onClick={() => setPremiumOpen(true)}>Premium</button>
      </div>
    </header>
    <div className="workspace" ref={workspaceRef}>
      <div className="problem-column" style={{ width: `${leftWidth}%` }}>
        <ProblemPanel
          problem={problem}
          tab={problemTab}
          setTab={setProblemTab}
          submissions={submissions}
          onlineCount={onlineCount}
          onOpenCompanies={() => setCompaniesOpen(true)}
          onOpenFeedback={() => setFeedbackOpen(true)}
        />
      </div>
      <div className="resize-v" role="separator" aria-label="Resize problem panel" onMouseDown={(event) => onResizeStart("left", event)} />
      <section className="editor-column">
        <div className="code-panel-header">
          <span className="title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#2db55d' }}><path d="M16 18L22 12L16 6M8 6L2 12L8 18" /></svg>
            Code Editor
          </span>
        </div>
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <select value={language} aria-label="Programming language" onChange={(event) => { const next = LANGUAGES.find((item) => item.id === event.target.value); if (!next?.disabled) setLanguage(event.target.value); }}>{LANGUAGES.map((item) => <option key={item.id} value={item.id} disabled={item.disabled}>{item.label}{item.disabled ? " (coming soon)" : ""}</option>)}</select>
            <span className="autosave-chip" title="Draft code automatically saved to local storage"><span aria-hidden="true">🔒</span>Auto</span>
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

        <footer className="editor-footer-leetcode">
          {user ? (
            <>
              <button className="console-toggle-btn" onClick={() => setConsoleOpen(!consoleOpen)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#c0c0c0', fontSize: '13px', cursor: 'pointer' }}>
                Console
                <span style={{ fontSize: '10px' }}>{consoleOpen ? "▼" : "▲"}</span>
              </button>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="action-btn-grey" disabled={loading} onClick={() => { setConsoleOpen(true); setConsoleTab("Testcase"); run("run"); }}>Run</button>
                <button className="action-btn-green" disabled={loading} onClick={() => { setConsoleOpen(true); setConsoleTab("Test Results"); run("submit"); }}>Submit</button>
                <span className="cursor-pos-leetcode" style={{ color: '#85858d', fontSize: '11px', fontFamily: 'monospace', marginLeft: '12px' }}>Ln {cursorPos.line}, Col {cursorPos.column}</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ margin: '0 auto', color: '#85858d', fontSize: '13px' }}>
                You need to <button onClick={handleReturnToDashboard} style={{ background: 'none', border: 'none', padding: 0, color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>log in / sign up</button> to run or submit
              </div>
              <span className="cursor-pos-leetcode" style={{ color: '#85858d', fontSize: '11px', fontFamily: 'monospace', position: 'absolute', right: '15px' }}>Ln {cursorPos.line}, Col {cursorPos.column}</span>
            </>
          )}
        </footer>
      </section>
    </div>
    <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
  </main>;
}