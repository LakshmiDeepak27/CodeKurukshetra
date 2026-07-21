import { useCallback, useEffect, useRef, useState } from "react";
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
  if (page === "dashboard") return <Dashboard user={user} onSignOut={signOut} theme={theme} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} onOpenEditor={() => navigate("editor")} onOpenBattle={() => navigate("battle")} onOpenProfile={() => navigate("profile")} />;
  if (page === "editor") return <EditorWorkspace onExit={() => navigate("dashboard")} />;
  if (page === "battle") return <Battle user={user} onBack={() => navigate("dashboard")} />;
  if (page === "profile") return <Profile user={user} theme={theme} onBack={() => navigate("dashboard")} />;

  return (
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
        <div className="preview-copy"><p className="eyebrow">Built for momentum</p><h2>LESS NOISE.<br />MORE THINKING.</h2><p>Problems, tests, and your code live in one deliberate workspace. When the dashboard arrives, this will be your command centre.</p><button className="outline-button" onClick={() => navigate("signup")}>Create your account <Arrow /></button></div>
        <div className="code-preview" aria-label="Code editor preview"><div className="code-title"><span /><span /><span /> main.cpp</div><pre><code><em>#include</em> &lt;iostream&gt;{`\n\n`}<em>int</em> main() {'{'}{`\n`}  <em>return</em> solve();{`\n`}{'}'}</code></pre><div className="test-result">✓ sample test passed <span>00:12</span></div></div>
      </section>

      <section className="closing shell"><p className="eyebrow">Your next battle starts here</p><h2>READY TO<br />WRITE YOUR STORY?</h2><button className="solid-button" onClick={() => navigate("signup")}>Enter the arena <Arrow /></button></section>

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

function Dashboard({ user, onSignOut, theme, onToggleTheme, onOpenEditor, onOpenBattle, onOpenProfile }) {
  const [problemCount, setProblemCount] = useState("—");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const initials = (user?.name || "Coder").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  useEffect(() => {
    fetch(`${API}/problems`).then((response) => response.ok ? response.json() : null).then((data) => setProblemCount(data?.problems?.length ?? "—")).catch(() => setProblemCount("—"));
  }, []);
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
  return <main className={`dashboard-shell dashboard-${theme}`}>
    <nav className="dashboard-nav"><a className="brand" href="#dashboard">CODE <span>KURUKSHETRA</span></a><div className="dashboard-nav-actions"><ThemeToggle theme={theme} onToggle={onToggleTheme} /><div className="profile-wrap" ref={profileRef}><div className="profile-controls"><button className="profile-identity" onClick={() => { setProfileOpen(false); onOpenProfile(); }} aria-label="Open profile"><span className="profile-avatar">{initials}</span><span className="profile-trigger-copy"><b>{user?.name || "Coder"}</b><small>My profile</small></span></button><button className="profile-chevron profile-menu-toggle" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Open profile menu">⌄</button></div>{profileOpen && <div className="profile-menu" role="menu"><button className="profile-menu-head profile-menu-link" onClick={() => { setProfileOpen(false); onOpenProfile(); }}><span className="profile-avatar large">{initials}</span><div><strong>{user?.name || "Coder"}</strong><span>{user?.email || "Account active"}</span></div></button><div className="profile-menu-details"><span><b>Account</b><em>Active</em></span><span><b>Practice mode</b><em>Ready</em></span></div><button className="profile-menu-action danger" onClick={() => { setProfileOpen(false); onSignOut(); }}>↪ Sign out</button></div>}</div></div></nav>
    <section id="dashboard" className="dashboard-hero"><div className="dashboard-hero-copy"><p className="eyebrow">Command centre / 2026</p><h1>WELCOME BACK,<br />{(user?.name || "CODER").toUpperCase()}.</h1><p>Choose your next challenge, sharpen your solution, or prepare to battle another coder.</p></div><aside className="dashboard-progress"><div className="progress-profile"><span className="profile-avatar large">{initials}</span><div><span>Today’s focus</span><strong>Build momentum</strong></div></div><div className="progress-stats"><div><b>{problemCount}</b><span>Problems ready</span></div><div><b>0</b><span>Submissions today</span></div><div><b>01</b><span>Current streak</span></div></div><button onClick={onOpenEditor}>Continue coding <Arrow /></button></aside></section>
    <section className="dashboard-grid" aria-label="Platform options">
      <article className="dashboard-card featured"><span className="dashboard-index">01</span><div className="dashboard-icon">&lt;/&gt;</div><h2>Problems</h2><p>Open the challenge library, run sample cases, and submit a solution from the integrated workspace.</p><div className="dashboard-card-footer"><span>{problemCount} available</span><button onClick={onOpenEditor}>Solve problems <Arrow /></button></div></article>
      <article className="dashboard-card"><span className="dashboard-index">02</span><div className="dashboard-icon">1v1</div><h2>Battle Arena</h2><p>Challenge another programmer to solve the same problem under pressure.</p><div className="dashboard-card-footer"><span>Coming soon</span><button onClick={onOpenBattle}>View arena <Arrow /></button></div></article>
      <article className="dashboard-card"><span className="dashboard-index">03</span><div className="dashboard-icon">{`{ }`}</div><h2>Code Editor</h2><p>Jump directly into the full-screen editor with your saved draft and test cases.</p><div className="dashboard-card-footer"><span>Autosave enabled</span><button onClick={onOpenEditor}>Open editor <Arrow /></button></div></article>
    </section>
    <section className="dashboard-insights"><article className="daily-challenge"><span className="eyebrow">Daily challenge</span><h2>Start with<br />your next win.</h2><p>A focused problem is ready whenever you are. Build a habit one submission at a time.</p><button onClick={onOpenEditor}>Open today’s problem <Arrow /></button></article><article><span className="eyebrow">Learning summary</span><div className="insight-metrics"><div><b>{problemCount}</b><span>Challenges available</span></div><div><b>0%</b><span>Acceptance rate</span></div><div><b>—</b><span>Best language</span></div></div><p className="insight-note">Your stats and language breakdown will update automatically as you submit solutions.</p></article><article><span className="eyebrow">Next up</span><ul className="next-up-list"><li><i />Complete your education profile</li><li><i />Solve your first challenge</li><li><i />Join the 1v1 arena</li></ul></article></section>
  </main>;
}

function Battle({ user, onBack }) {
  return <main className="battle-shell"><header><button className="back" onClick={onBack}>← Dashboard</button><span className="eyebrow">1v1 battle arena</span></header><section><p className="eyebrow">{user?.name || "Coder"} / Battle mode</p><h1>THE ARENA<br />IS WARMING UP.</h1><p>Head-to-head challenges are next. Your coding workspace is ready in the meantime.</p><button className="solid-button" onClick={onBack}>Back to dashboard <Arrow /></button></section></main>;
}

function Profile({ user, theme, onBack }) {
  const defaults = { name: user?.name || "Coder", username: (user?.name || "coder").toLowerCase().replace(/\s+/g, "_"), email: user?.email || "", location: "India", institution: "Add your institution", program: "Computer Science", graduation: "2027", bio: "Learning by solving one problem at a time.", imageUrl: "" };
  const [profile, setProfile] = useState(() => ({ ...defaults, ...JSON.parse(localStorage.getItem("ck_profile") || "{}") }));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const initials = profile.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const save = (event) => { event.preventDefault(); localStorage.setItem("ck_profile", JSON.stringify(draft)); setProfile(draft); setEditing(false); };
  return <main className={`profile-page dashboard-${theme}`}><header className="profile-page-nav"><button onClick={onBack}>← Dashboard</button><span className="brand">CODE <span>KURUKSHETRA</span></span></header><section className="profile-layout"><aside className="profile-sidebar"><div className="profile-avatar-xl">{profile.imageUrl ? <img src={profile.imageUrl} alt="Profile" /> : initials}</div><h1>{profile.name}</h1><p className="profile-handle">@{profile.username}</p><p className="profile-bio">{profile.bio}</p><div className="profile-social-proof"><span><b>0</b> Following</span><span><b>0</b> Followers</span></div><button className="profile-edit-btn" onClick={() => { setDraft(profile); setEditing(true); }}>Edit profile</button><dl><div><dt>Location</dt><dd>⌖ {profile.location}</dd></div><div><dt>Education</dt><dd>♧ {profile.institution}</dd></div><div><dt>Program</dt><dd>{profile.program} · {profile.graduation}</dd></div></dl><div className="community-stats"><h3>Community stats</h3><span>◉ Views <b>0</b></span><span>✓ Solutions <b>0</b></span><span>◌ Discussions <b>0</b></span><span>★ Reputation <b>0</b></span></div><div className="profile-tags"><h3>Languages & skills</h3><p><i>C++</i><i>Python</i><i>Problem Solving</i><i>Algorithms</i></p></div></aside><section className="profile-main"><div className="profile-heading"><div><p className="eyebrow">Learning profile</p><h2>YOUR PROGRESS</h2></div><span className="profile-email">{profile.email || "Email not added"}</span></div><div className="profile-stat-grid"><article><b>0</b><span>Problems solved</span></article><article><b>0</b><span>Submissions</span></article><article><b>01</b><span>Current streak</span></article><article><b>0</b><span>Badges earned</span></article></div><div className="profile-feature-grid"><article className="rating-card"><span>Practice rating</span><b>—</b><small>Complete a challenge to establish your rating.</small><div className="rating-line"><i /><i /><i /><i /><i /><i /></div></article><article className="badge-card"><span>Badges</span><b>0</b><div><i>⌘</i><i>★</i><i>✓</i></div><small>Earn badges by building consistent habits.</small></article></div><div className="profile-section"><h3>Education</h3><div className="education-card"><span className="education-mark">⌘</span><div><strong>{profile.institution}</strong><p>{profile.program} · Expected graduation {profile.graduation}</p><small>Keep your education details current to personalize challenges and learning recommendations.</small></div></div></div><div className="profile-section"><div className="section-title-row"><h3>Practice activity</h3><span>0 active days · Current streak 1</span></div><div className="activity-grid">{Array.from({ length: 364 }, (_, index) => <i key={index} className={index % 47 === 0 || index % 113 === 0 ? "active" : ""} />)}</div><p className="activity-caption">Your submissions and streak activity will appear here as you practice.</p></div><div className="profile-section"><div className="section-title-row"><h3>Recent activity</h3><button className="profile-text-action" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>View all activity →</button></div><div className="recent-list"><div><b>Your first submission will appear here</b><span>Start a problem from the dashboard</span></div><div><b>Learning track ready</b><span>Update your profile to personalize recommendations</span></div></div></div></section></section>{editing && <div className="profile-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(false); }}><form className="profile-modal" onSubmit={save}><header><div><p className="eyebrow">Personalize your profile</p><h2>Edit profile</h2></div><button type="button" onClick={() => setEditing(false)} aria-label="Close profile editor">×</button></header><div className="profile-form-grid"><label>Full name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>Username<input required value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} /></label><label>Location<input required value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label><label>Institution<input required value={draft.institution} onChange={(event) => setDraft({ ...draft, institution: event.target.value })} /></label><label>Program / degree<input required value={draft.program} onChange={(event) => setDraft({ ...draft, program: event.target.value })} /></label><label>Graduation year<input required pattern="[0-9]{4}" value={draft.graduation} onChange={(event) => setDraft({ ...draft, graduation: event.target.value })} /></label><label className="full">Profile image URL <input type="url" placeholder="https://…" value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} /></label><label className="full">About you<textarea required value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} /></label></div><footer><button type="button" onClick={() => setEditing(false)}>Cancel</button><button type="submit">Save profile</button></footer></form></div>}</main>;
}

createRoot(document.getElementById("root")).render(<App />);
