/* ============================================================
   dash-app.jsx — routing, language, tweaks, mount
   ============================================================ */
const TWEAKS_DEFAULT = /*EDITMODE-BEGIN*/{
  "defaultLang": "en",
  "accent": "sage",
  "density": "comfortable"
}/*EDITMODE-END*/;

function DashApp() {
  const [tw, setTweak] = useTweaks(TWEAKS_DEFAULT);
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
  React.useEffect(() => { normalizeStats(); }, []);

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

  const titles = {
    home: { title: `${greeting(t)}, ${STUDENT.first}`, sub: t.todayis },
    lessons: { title: t.pLessons, sub: t.pLessonsSub },
    drills: { title: t.pDrills, sub: t.pDrillsSub },
    deck: { title: t.pDeck, sub: t.pDeckSub },
    assignments: { title: t.pAssign, sub: t.pAssignSub },
    progress: { title: t.pProgress, sub: t.pProgressSub },
    feed: { title: t.pFeed, sub: t.pFeedSub },
    meetings: { title: t.pMeet, sub: t.pMeetSub },
    account: { title: t.pAccount, sub: t.pAccountSub },
  };
  // pages that render their own header
  const ownHeader = ["lessons", "deck", "drills", "progress", "assignments", "feed", "meetings", "account"];
  const showTopbar = !["drills", "deck"].includes(view);

  let Page = Dashboard;
  if (view === "lessons") Page = LessonsPage;
  else if (view === "drills") Page = DrillsPage;
  else if (view === "deck") Page = DeckPage;
  else if (view === "progress") Page = ProgressPage;
  else if (view === "assignments") Page = AssignmentsPage;
  else if (view === "feed") Page = FeedPage;
  else if (view === "meetings") Page = MeetingsPage;
  else if (view === "account") Page = AccountPage;

  return (
    <div className={"app lang-" + lang}>
      <Sidebar view={view} go={go} t={t} lang={lang} expanded={expanded} setExpanded={setExpanded} profileOpen={profileOpen} setProfileOpen={setProfileOpen} />
      <div className="main" ref={mainRef}>
        <div className="content">
          {showTopbar ? (
            <Topbar t={t} lang={lang} setLang={setLang} go={go}
              title={view === "home" ? titles.home.title : ""}
              sub={view === "home" ? titles.home.sub : ""} />
          ) : null}
          {/* For non-home pages the topbar shows only chrome; titles render inside the page head.
              But we still want lang toggle reachable on deck/drills, so show a slim bar there. */}
          {!showTopbar ? (
            <div className="topbar" style={{ marginBottom: 10 }}>
              <button className="back-link" onClick={() => go("home")} style={{ margin: 0 }}>
                <Icon name="chevron-l" size={18} /> {t.back}
              </button>
              <div className="tb-right">
                <div className="lang-seg">
                  <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
                  <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ES</button>
                </div>
              </div>
            </div>
          ) : null}

          <Page t={t} lang={lang} go={go} toast={toast} />
        </div>
      </div>

      {toastMsg ? <div className="toast"><Icon name="check" size={18} /> {toastMsg}</div> : null}

      {logoutOpen ? (
        <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setLogoutOpen(false); }}>
          <div className="modal">
            <div className="celebrate" style={{ background: "#f7e3df", color: "var(--rose)" }}><Icon name="logout" size={32} /></div>
            <div className="big">{t.logoutQ}</div>
            <p>{t.logoutSub}</p>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setLogoutOpen(false)}>{t.cancel}</button>
              <button className="btn btn-navy" onClick={() => { setLogoutOpen(false); go("home"); toast(lang === "es" ? "Sesión cerrada (demo)" : "Logged out (demo)"); }}>{t.logout}</button>
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

ReactDOM.createRoot(document.getElementById("root")).render(<DashApp />);
