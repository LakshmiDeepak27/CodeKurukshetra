import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import EditorWorkspace from "../../Editor/src/App.jsx";
import "../../Editor/src/index.css";

const API = import.meta.env.VITE_API_URL || "/api";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const PAGE_PATHS = { home: "/", signin: "/signin", signup: "/signup", dashboard: "/dashboard", editor: "/editor", battle: "/battle", profile: "/profile" };
const PRIVATE_PAGES = new Set(["dashboard", "editor", "battle", "profile"]);
const pageFromPath = (pathname = window.location.pathname) => Object.entries(PAGE_PATHS).find(([, path]) => path === pathname)?.[0] || "home";

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function App() {
  const [page, setPage] = useState(() => localStorage.getItem("ck_token") ? "checking" : pageFromPath());
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("ck_theme") || "light");
  const scrollToMission = () => document.querySelector("#mission")?.scrollIntoView({ behavior: "smooth" });
  const navigate = (next, replace = false) => { const path = PAGE_PATHS[next] || "/"; if (window.location.pathname !== path) window.history[replace ? "replaceState" : "pushState"]({}, "", path); setPage(next); };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ck_theme", theme);
  }, [theme]);
  useEffect(() => { const onPopState = () => setPage(pageFromPath()); window.addEventListener("popstate", onPopState); return () => window.removeEventListener("popstate", onPopState); }, []);

  useEffect(() => {
    const token = localStorage.getItem("ck_token");
    if (!token) { if (PRIVATE_PAGES.has(pageFromPath())) navigate("signin", true); return; }
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ user: activeUser }) => { setUser(activeUser); const requested = pageFromPath(); navigate(PRIVATE_PAGES.has(requested) ? requested : "dashboard", true); })
      .catch(() => { localStorage.removeItem("ck_token"); navigate("signin", true); });
  }, []);

  function completeAuth({ token, user: activeUser }) {
    localStorage.setItem("ck_token", token);
    setUser(activeUser);
    navigate("dashboard", true);
  }

  function signOut() {
    localStorage.removeItem("ck_token");
    setUser(null);
    navigate("home", true);
  }

  if (page === "checking") return <main className="auth-shell"><ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} /><p className="eyebrow">Checking your session…</p></main>;
  if (page === "signin" || page === "signup") return <AuthPage mode={page} onBack={() => navigate("home")} onSwitch={navigate} onSuccess={completeAuth} theme={theme} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} />;
  if (page === "dashboard") return <Dashboard user={user} onSignOut={signOut} theme={theme} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} onOpenEditor={(probId) => { if (probId) localStorage.setItem("ck_last_problem", probId); navigate("editor"); }} onOpenBattle={() => navigate("battle")} onOpenProfile={() => navigate("profile")} />;
  if (page === "editor") return <EditorWorkspace onExit={() => navigate("dashboard")} />;
  if (page === "battle") return <Battle user={user} onBack={() => navigate("dashboard")} />;
  if (page === "profile") return <Profile user={user} theme={theme} onBack={() => navigate("dashboard")} />;  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top">CODE <span>KURUKSHETRA</span></a>
        <div className="nav-actions">
          <button className="text-button" onClick={scrollToMission}>About</button>
          <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
          <button className="outline-button" onClick={() => navigate("signin")}>Sign in</button>
        </div>
      </nav>

      <section id="top" className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">01 / Learn. Duel. Evolve.</p>
          <h1>WRITE CODE.<br />WIN BATTLES.</h1>
          <p className="intro">A focused arena for programmers who want to solve harder problems, sharpen their instincts, and challenge their friends head-to-head.</p>
          <div className="actions">
            <button className="solid-button" onClick={() => navigate("signup")}>Enter the arena <Arrow /></button>
            <button className="outline-button" onClick={scrollToMission}>Explore the arena <Arrow /></button>
          </div>
        </div>
        <aside className="battlefield" aria-label="Animated Code Kurukshetra mark">
          <p className="eyebrow">The digital battlefield</p>
          <DataWatch />
          <div className="duel"><strong>DS</strong><span>data structures loaded</span></div>
        </aside>
      </section>

      <section id="mission" className="features shell">
        {[
          ["01", "PROBLEMS", "Practice deliberately with clear test cases and instant feedback."],
          ["02", "EDITOR", "A fast, distraction-free workspace for every solution."],
          ["03", "DUELS", "Challenge friends and prove who solves first."],
        ].map(([number, title, description]) => (
          <article key={title}>
            <span className="eyebrow">{number}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="stats shell" aria-label="Platform highlights">
        <div><strong>04</strong><span>Languages ready</span></div>
        <div><strong>&lt; 1s</strong><span>Target judge feedback</span></div>
        <div><strong>∞</strong><span>Ways to improve</span></div>
      </section>

      <section className="arena-preview shell">
        <div className="preview-copy"><p className="eyebrow">Built for momentum</p><h2>LESS NOISE.<br />MORE THINKING.</h2><p>Problems, tests, and your code live in one deliberate workspace. When the dashboard arrives, this will be your command centre.</p><button className="outline-button" onClick={() => navigate("signup")}>Create your account <Arrow /></button></div>
        <div className="code-preview" aria-label="Code editor preview"><div className="code-title"><span /><span /><span /> main.cpp</div><pre><code><em>#include</em> &lt;iostream&gt;{`\n\n`}<em>int</em> main() {'{'}{`\n`}  <em>return</em> solve();{`\n`}{'}'}</code></pre><div className="test-result">✓ sample test passed <span>00:12</span></div></div>
      </section>

      <section className="workflow shell">
        <div className="section-heading"><p className="eyebrow">The path</p><h2>FROM PROBLEM<br />TO PROGRESS.</h2></div>
        <div className="steps">
          <article>
            <span className="step-number">01</span>
            <Step1Animation />
            <h3>Choose your challenge</h3>
            <p>Pick a problem that meets you exactly where your skills are.</p>
          </article>
          <article>
            <span className="step-number">02</span>
            <Step2Animation />
            <h3>Build your solution</h3>
            <p>Use the focused editor, run examples, and learn from every attempt.</p>
          </article>
          <article>
            <span className="step-number">03</span>
            <Step3Animation />
            <h3>Raise the stakes</h3>
            <p>Track your progress or take your solution into a future 1v1 duel.</p>
          </article>
        </div>
      </section>

      <section className="closing shell"><p className="eyebrow">Your next battle starts here</p><h2>READY TO<br />WRITE YOUR STORY?</h2><button className="solid-button" onClick={() => navigate("signup")}>Enter the arena <Arrow /></button></section>

      <footer className="footer shell"><a className="brand" href="#top">CODE <span>KURUKSHETRA</span></a><span>© 2026 · Built for the next battle</span><button className="text-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top ↑</button></footer>
    </main>
  );
}

function Step1Animation() {
  const [activeTag, setActiveTag] = useState(0);
  const tags = ["Array", "DP", "Trees", "Graphs"];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTag((prev) => (prev + 1) % tags.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [tags.length]);

  return (
    <div className="step-animation-box">
      <div className="step-tags-wrap">
        {tags.map((tag, i) => (
          <span key={tag} className={`step-tag-pill ${activeTag === i ? "active" : ""}`}>
            {tag}
          </span>
        ))}
      </div>
      <div className="step-diff-row">
        <span>Target Mode</span>
        <span className="step-diff-badge">Medium</span>
      </div>
      <div style={{ font: "10px 'DM Mono', monospace", color: "var(--muted)", marginTop: "6px" }}>
        48+ problem sets matched
      </div>
    </div>
  );
}

function Step2Animation() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev % 3) + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="step-animation-box">
      <div className="step-code-header">
        <div className="step-code-dots"><span/><span/><span/></div>
        <span>solution.cpp</span>
      </div>
      <div style={{ font: "11px 'DM Mono', monospace", color: "var(--ink)", marginBottom: "6px" }}>
        <code>solve(vector&lt;int&gt;& nums)</code>
      </div>
      <div className="step-test-pass">
        <span>[Test {step}/3] Sample Case</span>
        <span>PASS ✓</span>
      </div>
    </div>
  );
}

function Step3Animation() {
  const [timerVal, setTimerVal] = useState(45);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerVal((prev) => (prev <= 1 ? 45 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="step-animation-box">
      <div className="step-duel-vs">
        <div className="step-player-card">
          <strong>YOU</strong>
          <span>1420 RP</span>
        </div>
        <div className="step-vs-badge">VS</div>
        <div className="step-player-card">
          <strong>RIVAL</strong>
          <span>1450 RP</span>
        </div>
      </div>
      <div className="step-rating-gain">
        00:{String(timerVal).padStart(2, "0")} · Match Live (+32 RP)
      </div>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle icon-only"
      onClick={onToggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        padding: 0,
        borderRadius: "8px",
        border: "1px solid var(--line, #3e3e38)",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        transition: "all 0.16s ease",
      }}
    >
      {theme === "light" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

const DATA_STRUCTURES = [
  { name: "STACK", icon: "↥", type: "stack", accent: "var(--lime)" },
  { name: "QUEUE", icon: "→", type: "queue", accent: "var(--cyan)" },
  { name: "TREE", icon: "⌘", type: "tree", accent: "var(--violet)" },
  { name: "GRAPH", icon: "◌", type: "graph", accent: "var(--orange)" },
  { name: "HASH", icon: "#", type: "hash", accent: "var(--cyan)" },
  { name: "HEAP", icon: "△", type: "heap", accent: "var(--violet)" },
];

function DataWatch() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = DATA_STRUCTURES[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % DATA_STRUCTURES.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  return <div className="data-watch" role="img" aria-label={`Animated watch showing ${active.name} data structure`} style={{ "--structure-accent": active.accent }}>
    <div className="watch-band top-band" />
    <div className="watch-band bottom-band" />
    <div className="watch-glow" />
    <div className="watch-orbit">
      {DATA_STRUCTURES.map((structure, index) => <span key={structure.name} style={{ "--slot": index }}><i>{structure.icon}</i>{structure.name}</span>)}
    </div>
    <div className="watch-case">
      <div className="watch-ticks" />
      <div className="watch-face">
        <span className="face-kicker">ACTIVE STRUCTURE</span>
        <div key={active.name} className={`face-symbol ${active.type}`}><span /><span /><span /><span /></div>
        <strong key={`${active.name}-label`} className="face-label changing-label">{active.name}</strong>
        <span className="face-index">{String(activeIndex + 1).padStart(2, "0")} / 06</span>
      </div>
    </div>
  </div>;
}

function AuthPage({ mode, onBack, onSwitch, onSuccess, theme, onToggleTheme }) {
  const signUp = mode === "signup";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleButton = useRef(null);

  const googleSignIn = useCallback(async ({ credential }) => {
    setError("");
    try {
      const response = await fetch(`${API}/auth/google`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Google sign-in failed");
      onSuccess(result);
    } catch (reason) { setError(reason.message); }
  }, [onSuccess]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButton.current) return undefined;
    const render = () => {
      window.google?.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: googleSignIn });
      window.google?.accounts.id.renderButton(googleButton.current, { theme: "outline", size: "large", width: 320, text: "continue_with" });
    };
    const previous = document.getElementById("google-gis");
    if (previous) { previous.addEventListener("load", render); if (window.google) render(); return () => previous.removeEventListener("load", render); }
    const script = document.createElement("script");
    script.id = "google-gis";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
    return () => script.removeEventListener("load", render);
  }, [googleSignIn]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/${signUp ? "signup" : "signin"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to authenticate");
      onSuccess(result);
    } catch (reason) { setError(reason.message); } finally { setLoading(false); }
  }

  return <main className="auth-shell">
    <section className="auth-card">
      <div className="auth-top"><button className="back" onClick={onBack}>← Back to home</button><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
      <p className="eyebrow">Code Kurukshetra / {signUp ? "Join" : "Welcome back"}</p>
      <h1>{signUp ? "ENTER THE ARENA." : "SIGN IN."}</h1>
      <form onSubmit={submit}>
        {signUp && <Input label="Name" value={form.name} autoComplete="name" onChange={(name) => setForm({ ...form, name })} />}
        <Input label="Email" type="email" value={form.email} autoComplete="email" onChange={(email) => setForm({ ...form, email })} />
        <Input label="Password" type="password" value={form.password} autoComplete={signUp ? "new-password" : "current-password"} hint={signUp ? "Minimum 8 characters" : ""} onChange={(password) => setForm({ ...form, password })} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="solid-button submit" disabled={loading}>{loading ? "PLEASE WAIT…" : signUp ? "CREATE ACCOUNT" : "SIGN IN"}</button>
      </form>
      <div className="divider"><span />OR<span /></div>
      {GOOGLE_CLIENT_ID ? <div ref={googleButton} className="google-button" /> : <p className="google-note">Google sign-in is enabled after you add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>.env</code>.</p>}
      <p className="switch-copy">{signUp ? "Already have an account?" : "New to Code Kurukshetra?"} <button onClick={() => onSwitch(signUp ? "signin" : "signup")}>{signUp ? "Sign in" : "Create one"}</button></p>
    </section>
  </main>;
}

function Input({ label, type = "text", value, onChange, autoComplete, hint }) {
  return <label className="input-label">{label}<input required type={type} minLength={type === "password" ? 8 : undefined} value={value} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>;
}

function mapStatus(status) {
  return ({ PASS: "Accepted", WA: "Wrong Answer", TLE: "Time Limit Exceeded", RE: "Runtime Error" })[status] || status || "Pending";
}

function calculateStreak(submissions) {
  if (!submissions || submissions.length === 0) return 0;
  const dates = new Set(submissions.map(s => new Date(s.created_at).toDateString()));
  let streak = 0;
  let curr = new Date();
  if (!dates.has(curr.toDateString())) {
    curr.setDate(curr.getDate() - 1);
  }
  while (dates.has(curr.toDateString())) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  }
  return streak;
}

function Dashboard({ user, onSignOut, theme, onToggleTheme, onOpenEditor, onOpenBattle, onOpenProfile }) {
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiff, setSelectedDiff] = useState("all");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const initials = (user?.name || "Coder").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  useEffect(() => {
    fetch(`${API}/problems`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setProblems(data?.problems || []))
      .catch(() => setProblems([]));

    const token = localStorage.getItem("ck_token");
    if (token) {
      fetch(`${API}/submissions/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => setSubmissions(data.submissions || []))
        .catch(() => setSubmissions([]));
    }
  }, []);

  const stats = useMemo(() => {
    const totalSubs = submissions.length;
    const todayStr = new Date().toDateString();
    const todayCount = submissions.filter((s) => new Date(s.created_at).toDateString() === todayStr).length;
    const streak = calculateStreak(submissions);
    const solvedSet = new Set(
      submissions
        .filter((s) => s.verdict === "Accepted" || s.status === "PASS" || s.verdict === "PASS")
        .map((s) => s.problem_id)
    );
    const acceptedSubmissions = submissions.filter((s) => s.verdict === "Accepted" || s.status === "PASS" || s.verdict === "PASS").length;
    const rate = totalSubs > 0 ? Math.round((acceptedSubmissions / totalSubs) * 100) : 0;

    const langs = submissions.reduce((acc, s) => {
      acc[s.language] = (acc[s.language] || 0) + 1;
      return acc;
    }, {});
    let best = "—";
    let maxCount = 0;
    for (const [lang, count] of Object.entries(langs)) {
      if (count > maxCount) {
        maxCount = count;
        best = lang === "cpp" ? "C++" : lang === "python" ? "Python" : lang === "java" ? "Java" : lang === "js" ? "JavaScript" : lang;
      }
    }

    return { totalSubs, todayCount, streak, rate, best, solvedSet };
  }, [submissions]);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchDiff = selectedDiff === "all" || p.difficulty.toLowerCase() === selectedDiff.toLowerCase();
      return matchSearch && matchDiff;
    });
  }, [problems, searchQuery, selectedDiff]);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const closeMenu = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === "Escape") setProfileOpen(false); };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  const handleSelectProblem = (problemId) => {
    localStorage.setItem("ck_last_problem", problemId);
    onOpenEditor();
  };

  return (
    <main className={`dashboard-shell dashboard-${theme}`}>
      <nav className="dashboard-nav">
        <a className="brand" href="#dashboard">CODE <span>KURUKSHETRA</span></a>
        <div className="dashboard-nav-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <div className="profile-wrap" ref={profileRef}>
            <div className="profile-controls">
              <button className="profile-identity" onClick={() => { setProfileOpen(false); onOpenProfile(); }} aria-label="Open profile">
                <span className="profile-avatar">{initials}</span>
                <span className="profile-trigger-copy"><b>{user?.name || "Coder"}</b><small>My profile</small></span>
              </button>
              <button className="profile-chevron profile-menu-toggle" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Open profile menu">⌄</button>
            </div>
            {profileOpen && (
              <div className="profile-menu" role="menu">
                <button className="profile-menu-head profile-menu-link" onClick={() => { setProfileOpen(false); onOpenProfile(); }}>
                  <span className="profile-avatar large">{initials}</span>
                  <div><strong>{user?.name || "Coder"}</strong><span>{user?.email || "Account active"}</span></div>
                </button>
                <div className="profile-menu-details">
                  <span><b>Account</b><em>Active</em></span>
                  <span><b>Practice mode</b><em>Ready</em></span>
                </div>
                <button className="profile-menu-action" onClick={() => { setProfileOpen(false); onOpenProfile(); }}>👤 View Profile</button>
                <button className="profile-menu-action danger" onClick={() => { setProfileOpen(false); onSignOut(); }}>↪ Sign out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <section id="dashboard" className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Command centre / 2026</p>
          <h1>WELCOME BACK,<br />{(user?.name || "CODER").toUpperCase()}.</h1>
          <p>Choose your next challenge, sharpen your solution, or prepare to battle another coder.</p>
        </div>
        <aside className="dashboard-progress">
          <div className="progress-profile">
            <span className="profile-avatar large">{initials}</span>
            <div><span>Today’s focus</span><strong>Build momentum</strong></div>
          </div>
          <div className="progress-stats">
            <div><b>{stats.solvedSet.size} / {problems.length || "—"}</b><span>Solved</span></div>
            <div><b>{stats.rate}%</b><span>Acceptance</span></div>
            <div><b>{String(stats.streak).padStart(2, "0")}</b><span>Day Streak</span></div>
          </div>
          <button onClick={() => onOpenEditor()}>Continue Coding <Arrow /></button>
        </aside>
      </section>

      <section style={{ maxWidth: "1280px", margin: "32px auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <p className="eyebrow" style={{ color: "var(--dash-accent)", margin: 0 }}>Practice Library</p>
            <h2 style={{ fontSize: "28px", margin: "4px 0 0", letterSpacing: "-0.04em", color: "var(--dash-text)" }}>CHALLENGE CATALOGUE</h2>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search problems or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "var(--dash-surface)",
                border: "1px solid var(--dash-line)",
                borderRadius: "8px",
                padding: "8px 14px",
                color: "var(--dash-text)",
                fontSize: "13px",
                outline: "none",
                width: "240px",
              }}
            />
            {["all", "Easy", "Medium", "Hard"].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDiff(diff)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid " + (selectedDiff === diff ? "var(--dash-accent)" : "var(--dash-line)"),
                  background: selectedDiff === diff ? "color-mix(in srgb, var(--dash-accent) 15%, transparent)" : "var(--dash-surface)",
                  color: selectedDiff === diff ? "var(--dash-accent)" : "var(--dash-text)",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-line)", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--dash-line)", background: "var(--dash-panel)", color: "var(--dash-muted)" }}>
                <th style={{ padding: "12px 16px", width: "60px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Title & Tags</th>
                <th style={{ padding: "12px 16px", width: "110px" }}>Difficulty</th>
                <th style={{ padding: "12px 16px", width: "140px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.length > 0 ? (
                filteredProblems.map((prob) => {
                  const isSolved = stats.solvedSet.has(prob.id);
                  const diffColor = prob.difficulty === "Easy" ? "#00b8a3" : prob.difficulty === "Medium" ? "#ffc01e" : "#ff375f";
                  return (
                    <tr key={prob.id} style={{ borderBottom: "1px solid var(--dash-line)", transition: "background 0.16s ease" }}>
                      <td style={{ padding: "14px 16px", color: "#2cbb5d", fontWeight: "bold" }}>
                        {isSolved ? "✓" : "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: "600", color: "var(--dash-text)", marginBottom: "4px" }}>{prob.title}</div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {(prob.tags || []).map((t) => (
                            <span key={t} style={{ background: "var(--dash-panel)", color: "var(--dash-muted)", padding: "2px 7px", borderRadius: "4px", fontSize: "11px" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ color: diffColor, fontWeight: "600" }}>{prob.difficulty}</span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => handleSelectProblem(prob.id)}
                          style={{
                            background: "var(--dash-accent)",
                            color: "#141510",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          Solve <Arrow />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--dash-muted)" }}>
                    No matching challenges found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Platform options">
        <article className="dashboard-card featured">
          <span className="dashboard-index">01</span>
          <div className="dashboard-icon">&lt;/&gt;</div>
          <h2>Problems</h2>
          <p>Open the challenge library, run sample cases, and submit a solution from the integrated workspace.</p>
          <div className="dashboard-card-footer">
            <span>{problems.length} available</span>
            <button onClick={() => onOpenEditor()}>Solve problems <Arrow /></button>
          </div>
        </article>
        <article className="dashboard-card">
          <span className="dashboard-index">02</span>
          <div className="dashboard-icon">1v1</div>
          <h2>Battle Arena</h2>
          <p>Challenge another programmer to solve the same problem under pressure.</p>
          <div className="dashboard-card-footer">
            <span>Coming soon</span>
            <button onClick={onOpenBattle}>View arena <Arrow /></button>
          </div>
        </article>
        <article className="dashboard-card">
          <span className="dashboard-index">03</span>
          <div className="dashboard-icon">{`{ }`}</div>
          <h2>Code Editor</h2>
          <p>Jump directly into the full-screen editor with your saved draft and test cases.</p>
          <div className="dashboard-card-footer">
            <span>Autosave enabled</span>
            <button onClick={() => onOpenEditor()}>Open editor <Arrow /></button>
          </div>
        </article>
      </section>

      <section style={{ maxWidth: "1280px", margin: "40px auto 60px", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
          <div>
            <p className="eyebrow" style={{ color: "var(--dash-accent)", margin: 0 }}>Activity Log</p>
            <h3 style={{ fontSize: "22px", margin: "4px 0 0", color: "var(--dash-text)" }}>RECENT SUBMISSIONS</h3>
          </div>
          <button onClick={onOpenProfile} style={{ background: "none", border: "none", color: "var(--dash-accent)", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
            View Full Profile →
          </button>
        </div>
        <div style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-line)", borderRadius: "12px", padding: "16px" }}>
          {submissions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {submissions.slice(0, 5).map((sub) => {
                const verdictLabel = mapStatus(sub.verdict || sub.status);
                const isPass = verdictLabel === "Accepted";
                return (
                  <div key={sub.id} style={{ display: "flex", alignItems: "center", justifySpace: "between", background: "var(--dash-panel)", padding: "12px 16px", borderRadius: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: "var(--dash-text)", fontSize: "14px", display: "block" }}>
                        {sub.problem_title || sub.problem_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </strong>
                      <span style={{ color: "var(--dash-muted)", fontSize: "11px" }}>
                        Language: {sub.language === "cpp" ? "C++" : sub.language === "python" ? "Python" : sub.language === "java" ? "Java" : sub.language} · {new Date(sub.created_at).toLocaleString()}
                      </span>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: isPass ? "#2cbb5d" : "#ef4743",
                        background: isPass ? "rgba(44, 187, 93, 0.15)" : "rgba(239, 71, 67, 0.15)",
                      }}
                    >
                      {verdictLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "24px", color: "var(--dash-muted)" }}>
              No submissions recorded yet. Pick a challenge above to start practice!
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Battle({ user, onBack }) {
  return <main className="battle-shell"><header><button className="back" onClick={onBack}>← Dashboard</button><span className="eyebrow">1v1 battle arena</span></header><section><p className="eyebrow">{user?.name || "Coder"} / Battle mode</p><h1>THE ARENA<br />IS WARMING UP.</h1><p>Head-to-head challenges are next. Your coding workspace is ready in the meantime.</p><button className="solid-button" onClick={onBack}>Back to dashboard <Arrow /></button></section></main>;
}

function Profile({ user, theme, onBack }) {
  const defaults = { name: user?.name || "Coder", username: (user?.name || "coder").toLowerCase().replace(/\s+/g, "_"), email: user?.email || "", location: "India", institution: "Add your institution", program: "Computer Science", graduation: "2027", bio: "Learning by solving one problem at a time.", imageUrl: "" };
  const [profile, setProfile] = useState(() => ({ ...defaults, ...JSON.parse(localStorage.getItem("ck_profile") || "{}") }));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [submissions, setSubmissions] = useState([]);
  const initials = profile.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const save = (event) => {
    event.preventDefault();
    localStorage.setItem("ck_profile", JSON.stringify(draft));
    setProfile(draft);
    setEditing(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("ck_token");
    if (token) {
      fetch(`${API}/submissions/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => setSubmissions(data.submissions || []))
        .catch(() => setSubmissions([]));
    }
  }, []);

  const stats = useMemo(() => {
    const total = submissions.length;
    const dates = new Set(submissions.map((s) => new Date(s.created_at).toDateString()));
    const streak = calculateStreak(submissions);

    const solved = new Set(
      submissions
        .filter((s) => s.verdict === "Accepted" || s.status === "PASS" || s.verdict === "PASS")
        .map((s) => s.problem_id)
    ).size;

    const activityCells = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const active = dates.has(d.toDateString());
      activityCells.push({ date: d.toLocaleDateString(), active });
    }

    const recent = submissions.slice(0, 5);

    return { total, streak, solved, activityCells, recent };
  }, [submissions]);

  return (
    <main className={`profile-page dashboard-${theme}`}>
      <header className="profile-page-nav">
        <button onClick={onBack}>← Dashboard</button>
        <span className="brand">CODE <span>KURUKSHETRA</span></span>
      </header>

      <section className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-avatar-xl">
            {profile.imageUrl ? <img src={profile.imageUrl} alt="Profile" /> : initials}
          </div>
          <h1>{profile.name}</h1>
          <p className="profile-handle">@{profile.username}</p>
          <p className="profile-bio">{profile.bio}</p>
          <div className="profile-social-proof">
            <span><b>0</b> Following</span>
            <span><b>0</b> Followers</span>
          </div>
          <button className="profile-edit-btn" onClick={() => { setDraft(profile); setEditing(true); }}>Edit profile</button>
          <dl>
            <div><dt>Location</dt><dd>⌖ {profile.location}</dd></div>
            <div><dt>Education</dt><dd>♧ {profile.institution}</dd></div>
            <div><dt>Program</dt><dd>{profile.program} · {profile.graduation}</dd></div>
          </dl>
          <div className="community-stats">
            <h3>Community stats</h3>
            <span>◉ Views <b>12</b></span>
            <span>✓ Solved Problems <b>{stats.solved}</b></span>
            <span>◌ Discussions <b>0</b></span>
            <span>★ Reputation <b>{stats.solved * 10}</b></span>
          </div>
          <div className="profile-tags">
            <h3>Languages & skills</h3>
            <p><i>C++</i><i>Python</i><i>Problem Solving</i><i>Algorithms</i><i>Data Structures</i></p>
          </div>
        </aside>

        <section className="profile-main">
          <div className="profile-heading">
            <div>
              <p className="eyebrow">Learning profile</p>
              <h2>YOUR PROGRESS</h2>
            </div>
            <span className="profile-email">{profile.email || "Email not added"}</span>
          </div>

          <div className="profile-stat-grid">
            <article><b>{stats.solved}</b><span>Problems solved</span></article>
            <article><b>{stats.total}</b><span>Submissions</span></article>
            <article><b>{String(stats.streak).padStart(2, "0")}</b><span>Current streak</span></article>
            <article><b>{stats.solved > 0 ? "1" : "0"}</b><span>Badges earned</span></article>
          </div>

          <div className="profile-feature-grid">
            <article className="rating-card">
              <span>Practice rating</span>
              <b>{stats.solved > 0 ? 1200 + stats.solved * 15 : "—"}</b>
              <small>Complete more challenges to raise your skill rating.</small>
              <div className="rating-line"><i /><i /><i /><i /><i /><i /></div>
            </article>
            <article className="badge-card">
              <span>Badges</span>
              <b>{stats.solved > 0 ? 1 : 0}</b>
              <div><i>⌘</i><i>★</i><i>✓</i></div>
              <small>Earn badges by building consistent practice habits.</small>
            </article>
          </div>

          <div className="profile-section">
            <h3>Education & Organization</h3>
            <div className="education-card">
              <span className="education-mark">⌘</span>
              <div>
                <strong>{profile.institution}</strong>
                <p>{profile.program} · Expected graduation {profile.graduation}</p>
                <small>Personalized learning recommendations enabled.</small>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-title-row">
              <h3>Practice activity (Past 365 Days)</h3>
              <span>{stats.activityCells.filter((c) => c.active).length} active days · Current streak {stats.streak}</span>
            </div>
            <div className="activity-grid">
              {stats.activityCells.map((cell, index) => (
                <i key={index} className={cell.active ? "active" : ""} title={cell.date} />
              ))}
            </div>
            <p className="activity-caption">Daily activity heat-map derived from your problem submissions.</p>
          </div>

          <div className="profile-section">
            <div className="section-title-row">
              <h3>Recent activity</h3>
            </div>
            <div className="recent-list">
              {stats.recent.length > 0 ? (
                stats.recent.map((sub) => (
                  <div key={sub.id}>
                    <b>Submitted solution for {sub.problem_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ({mapStatus(sub.verdict || sub.status)})</b>
                    <span>{sub.language === "cpp" ? "C++" : sub.language === "python" ? "Python" : sub.language === "java" ? "Java" : sub.language} · {new Date(sub.created_at).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <>
                  <div><b>Your first submission will appear here</b><span>Start a problem from the dashboard</span></div>
                  <div><b>Learning track ready</b><span>Update your profile to personalize recommendations</span></div>
                </>
              )}
            </div>
          </div>
        </section>
      </section>

      {editing && (
        <div className="profile-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(false); }}>
          <form className="profile-modal" onSubmit={save}>
            <header>
              <div>
                <p className="eyebrow">Personalize your profile</p>
                <h2>Edit profile</h2>
              </div>
              <button type="button" onClick={() => setEditing(false)} aria-label="Close profile editor">×</button>
            </header>
            <div className="profile-form-grid">
              <label>Full name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <label>Username<input required value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} /></label>
              <label>Location<input required value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label>
              <label>Institution<input required value={draft.institution} onChange={(event) => setDraft({ ...draft, institution: event.target.value })} /></label>
              <label>Program / degree<input required value={draft.program} onChange={(event) => setDraft({ ...draft, program: event.target.value })} /></label>
              <label>Graduation year<input required pattern="[0-9]{4}" value={draft.graduation} onChange={(event) => setDraft({ ...draft, graduation: event.target.value })} /></label>
              <label className="full">Profile image URL <input type="url" placeholder="https://…" value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} /></label>
              <label className="full">About you<textarea required value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} /></label>
            </div>
            <footer>
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit">Save profile</button>
            </footer>
          </form>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
