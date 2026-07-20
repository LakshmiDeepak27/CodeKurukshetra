import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import EditorWorkspace from "../../Editor/src/App.jsx";
import "../../Editor/src/index.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function App() {
  const [page, setPage] = useState(() => localStorage.getItem("ck_token") ? "checking" : "home");
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("ck_theme") || "light");
  const scrollToMission = () => document.querySelector("#mission")?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ck_theme", theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem("ck_token");
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ user: activeUser }) => { setUser(activeUser); setPage("dashboard"); })
      .catch(() => { localStorage.removeItem("ck_token"); setPage("home"); });
  }, []);

  function completeAuth({ token, user: activeUser }) {
    localStorage.setItem("ck_token", token);
    setUser(activeUser);
    setPage("dashboard");
  }

  function signOut() {
    localStorage.removeItem("ck_token");
    setUser(null);
    setPage("home");
  }

  if (page === "checking") return <main className="auth-shell"><ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} /><p className="eyebrow">Checking your session…</p></main>;
  if (page === "signin" || page === "signup") return <AuthPage mode={page} onBack={() => setPage("home")} onSwitch={setPage} onSuccess={completeAuth} theme={theme} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} />;
  if (page === "dashboard") return <Dashboard user={user} onSignOut={signOut} theme={theme} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} onOpenEditor={() => setPage("editor")} />;
  if (page === "editor") return <EditorWorkspace onExit={() => setPage("dashboard")} />;

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top">CODE <span>KURUKSHETRA</span></a>
        <div className="nav-actions">
          <button className="text-button" onClick={scrollToMission}>About</button>
          <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
          <button className="outline-button" onClick={() => setPage("signin")}>Sign in</button>
        </div>
      </nav>

      <section id="top" className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">01 / Learn. Duel. Evolve.</p>
          <h1>WRITE CODE.<br />WIN BATTLES.</h1>
          <p className="intro">A focused arena for programmers who want to solve harder problems, sharpen their instincts, and challenge their friends head-to-head.</p>
          <div className="actions">
            <button className="solid-button" onClick={() => setPage("signup")}>Enter the arena <Arrow /></button>
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

      <section className="workflow shell">
        <div className="section-heading"><p className="eyebrow">The path</p><h2>FROM PROBLEM<br />TO PROGRESS.</h2></div>
        <div className="steps">
          {[
            ["01", "Choose your challenge", "Pick a problem that meets you exactly where your skills are."],
            ["02", "Build your solution", "Use the focused editor, run examples, and learn from every attempt."],
            ["03", "Raise the stakes", "Track your progress or take your solution into a future 1v1 duel."],
          ].map(([number, title, copy]) => <article key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="arena-preview shell">
        <div className="preview-copy"><p className="eyebrow">Built for momentum</p><h2>LESS NOISE.<br />MORE THINKING.</h2><p>Problems, tests, and your code live in one deliberate workspace. When the dashboard arrives, this will be your command centre.</p><button className="outline-button" onClick={() => setPage("signup")}>Create your account <Arrow /></button></div>
        <div className="code-preview" aria-label="Code editor preview"><div className="code-title"><span /><span /><span /> main.cpp</div><pre><code><em>#include</em> &lt;iostream&gt;{`\n\n`}<em>int</em> main() {'{'}{`\n`}  <em>return</em> solve();{`\n`}{'}'}</code></pre><div className="test-result">✓ sample test passed <span>00:12</span></div></div>
      </section>

      <section className="closing shell"><p className="eyebrow">Your next battle starts here</p><h2>READY TO<br />WRITE YOUR STORY?</h2><button className="solid-button" onClick={() => setPage("signup")}>Enter the arena <Arrow /></button></section>

      <footer className="footer shell"><a className="brand" href="#top">CODE <span>KURUKSHETRA</span></a><span>© 2026 · Built for the next battle</span><button className="text-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top ↑</button></footer>
    </main>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return <button className="theme-toggle" onClick={onToggle} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}><span>{theme === "light" ? "◐" : "☼"}</span><b>{theme === "light" ? "Dark" : "Light"}</b></button>;
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

function Dashboard({ user, onSignOut, theme, onToggleTheme, onOpenEditor }) {
  const [problemCount, setProblemCount] = useState("—");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    fetch(`${API}/problems`).then((response) => response.ok ? response.json() : null).then((data) => setProblemCount(data?.problems?.length ?? "—")).catch(() => setProblemCount("—"));
  }, []);
  return <main className="dashboard-shell">
    <nav className="dashboard-nav"><a className="brand" href="#dashboard">CODE <span>KURUKSHETRA</span></a><div className="dashboard-nav-actions"><ThemeToggle theme={theme} onToggle={onToggleTheme} /><span className="dashboard-user">{user?.name || "Coder"}</span><button className="outline-button dashboard-signout" onClick={onSignOut}>Sign out</button></div></nav>
    <section id="dashboard" className="dashboard-hero"><p className="eyebrow">Command centre / 2026</p><h1>WELCOME BACK,<br />{(user?.name || "CODER").toUpperCase()}.</h1><p>Choose your next challenge, sharpen your solution, or prepare to battle another coder.</p></section>
    <section className="dashboard-grid" aria-label="Platform options">
      <article className="dashboard-card featured"><span className="dashboard-index">01</span><div className="dashboard-icon">&lt;/&gt;</div><h2>Problems</h2><p>Open the challenge library, run sample cases, and submit a solution from the integrated workspace.</p><div className="dashboard-card-footer"><span>{problemCount} available</span><button onClick={onOpenEditor}>Solve problems <Arrow /></button></div></article>
      <article className="dashboard-card"><span className="dashboard-index">02</span><div className="dashboard-icon">1v1</div><h2>Battle Arena</h2><p>Challenge another programmer to solve the same problem under pressure.</p><div className="dashboard-card-footer"><span>Coming soon</span><button onClick={() => setNotice("1v1 battles are being prepared for the arena.")}>Notify me <Arrow /></button></div></article>
      <article className="dashboard-card"><span className="dashboard-index">03</span><div className="dashboard-icon">{`{ }`}</div><h2>Code Editor</h2><p>Jump directly into the full-screen editor with your saved draft and test cases.</p><div className="dashboard-card-footer"><span>Autosave enabled</span><button onClick={onOpenEditor}>Open editor <Arrow /></button></div></article>
    </section>
    {notice && <div className="dashboard-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
