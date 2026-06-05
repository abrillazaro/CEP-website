/* ============================================================
   instr-app.jsx — Instructor Dashboard shell: routing, language,
   tweaks, mount. Asserts the instructor role so the shared
   social pages (assignments / meetings / feed) render in
   create-and-grade mode.
   ============================================================ */

/* Assert instructor role BEFORE first render so shared pages start correct. */
try { setRole("instructor"); } catch (e) {}

const TWEAKS_DEFAULT_I = /*EDITMODE-BEGIN*/{
  "defaultLang": "en",
  "accent": "navy",
  "density": "comfortable"
}/*EDITMODE-END*/;

function InstrApp() {
  const [tw, setTweak] = useTweaks(TWEAKS_DEFAULT_I);
  const [lang, setLang] = React.useState(tw.defaultLang || "en");
  React.useEffect(() => { setLang(tw.defaultLang || "en"); }, [tw.defaultLang]);

  const [view, setView] = React.useState("home");
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(() => {
    try { return localStorage.getItem("cep_rail_expanded") === "1"; } catch (e) { return false; }
  });
  React.useEffect(() => {
    try { localStorage.setItem("cep_rail_expanded", expanded ? "1" : "0"); } catch (e) {}
  }, [expanded]);
  const [toastMsg, setToastMsg] = React.useState("");
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const mainRef = React.useRef(null);
  const t = STR[lang] || STR.en;

  const toast = (m) => { setToastMsg(m); setTimeout(() => setToastMsg(""), 2600); };
  const go = (v) => {
    setView(v); setProfileOpen(false);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "auto" });
  };
  React.useEffect(() => { window.__cepLogout = () => setLogoutOpen(true); }, []);
  React.useEffect(() => { setRole("instructor"); normalizeStats(); }, []);

  // accent tweak
  React.useEffect(() => {
    const root = document.documentElement;
    const map = { sage: "#5d7c69", navy: "#20395c", gold: "#bd8b3e", plum: "#6b4e7a" };
    if (tw.accent && map[tw.accent]) {
      root.style.setProperty("--sage", map[tw.accent]);
      const deepMap = { sage: "#465c4f", navy: "#152840", gold: "#946a28", plum: "#523b5e" };
      root.style.setProperty("--sage-deep", deepMap[tw.accent]);
    }
  }, [tw.accent]);
  React.useEffect(() => {
    document.documentElement.style.setProperty("--rail-w", tw.density === "compact" ? "84px" : "96px");
  }, [tw.density]);

  const L = (en, es) => (lang === "es" ? es : en);
  const titles = {
    home: { title: `${greeting(t)}, ${INSTRUCTOR.first}`, sub: L("Here's what needs your attention.", "Esto necesita tu atención.") },
    assignments: { title: L("Grading", "Calificar"), sub: L("Create and grade your class's work.", "Crea y califica el trabajo de tu clase.") },
    meetings: { title: L("Sessions", "Clases"), sub: L("Schedule live classes for your cohort.", "Programa clases en vivo para tu grupo.") },
    announce: { title: L("Announcements", "Anuncios"), sub: L("Post updates to your class — each one is visible for one week.", "Publica avisos para tu clase — cada uno es visible durante una semana.") },
    feed: { title: L("Class Feed", "Muro de clase"), sub: L("Share updates and connect with your class.", "Comparte y conecta con tu clase.") },
    students: { title: L("Students", "Estudiantes"), sub: L("Track each student's submissions and progress.", "Sigue las entregas y el progreso.") },
    account: { title: L("Account Settings", "Configuración"), sub: L("Manage your instructor profile.", "Administra tu perfil.") }
  };
  // pages that render their own header
  const ownHeader = ["students", "account"];
  const showHomeTopbar = view === "home" || view === "assignments" || view === "meetings" || view === "feed";

  let Page = InstrHome;
  if (view === "assignments") Page = AssignmentsPage;
  else if (view === "meetings") Page = MeetingsPage;
  else if (view === "announce") Page = AnnouncementsPage;
  else if (view === "feed") Page = FeedPage;
  else if (view === "students") Page = RosterPage;
  else if (view === "account") Page = InstrAccountPage;

  // assignments/meetings/feed render their own page-head-row but no topbar chrome,
  // so we always show the topbar (greeting only on home) for search + lang + bell.
  const tbTitle = view === "home" ? titles.home.title : "";
  const tbSub = view === "home" ? titles.home.sub : "";

  return (
    <div className={"app lang-" + lang}>
      <InstrSidebar view={view} go={go} lang={lang} expanded={expanded} setExpanded={setExpanded}
        profileOpen={profileOpen} setProfileOpen={setProfileOpen} />
      <div className="main" ref={mainRef}>
        <div className="content">
          <InstrTopbar lang={lang} setLang={setLang} go={go} title={tbTitle} sub={tbSub} />
          <Page t={t} lang={lang} go={go} toast={toast} />
        </div>
      </div>

      {toastMsg ? <div className="toast"><Icon name="check" size={18} /> {toastMsg}</div> : null}

      {logoutOpen ? (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setLogoutOpen(false); }}>
          <div className="modal">
            <div className="celebrate" style={{ background: "#f7e3df", color: "var(--rose)" }}><Icon name="logout" size={32} /></div>
            <div className="big">{L("Log out of CEP?", "¿Cerrar sesión en CEP?")}</div>
            <p>{L("You can pick up right where you left off next time.", "La próxima vez retomas justo donde lo dejaste.")}</p>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setLogoutOpen(false)}>{L("Cancel", "Cancelar")}</button>
              <button className="btn btn-navy" onClick={() => {
                setLogoutOpen(false);
                try { localStorage.removeItem('sb-qkxhzpicqjxodeadhcvw-auth-token'); localStorage.removeItem('cep-instructor-session'); } catch(e) {}
                window.location.href = 'index.html';
              }}>{L("Log out", "Cerrar sesión")}</button>
            </div>
          </div>
        </div>
      ) : null}

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakRadio label="Accent color" value={tw.accent} options={["sage", "navy", "gold", "plum"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label="Rail density" value={tw.density} options={["comfortable", "compact"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Content" />
        <TweakRadio label="Default language" value={tw.defaultLang} options={["en", "es"]}
          onChange={(v) => setTweak("defaultLang", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<InstrApp />);
