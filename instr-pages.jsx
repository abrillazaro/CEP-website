/* ============================================================
   instr-pages.jsx — Instructor experience.
   Reuses the SAME stores as the student dashboard (assignments,
   meetings, feed, the student's own stats) so the two ends stay
   in sync: a student submits → it shows in the grading queue;
   the instructor grades/schedules/posts → the student sees it.

   Shared pages reused as-is (they already adapt to role):
     AssignmentsPage · MeetingsPage · FeedPage   (dash-social.jsx)
   New here: InstrSidebar · InstrTopbar · InstrHome · RosterPage
             · InstrAccountPage
   ============================================================ */
const { useState: iuS, useRef: iuR, useEffect: iuE, useMemo: iuM } = React;

/* tiny bilingual helper */
const L = (lang, en, es) => (lang === "es" ? es : en);

/* instructor nav */
const INSTR_NAV = [
  { id: "home", icon: "home", en: "Overview", es: "Resumen" },
  { id: "assignments", icon: "clipboard", en: "Grading", es: "Calificar" },
  { id: "meetings", icon: "video", en: "Sessions", es: "Clases" },
  { id: "announce", icon: "megaphone", en: "Announcements", es: "Anuncios" },
  { id: "feed", icon: "feed", en: "Class Feed", es: "Muro" },
  { id: "students", icon: "users", en: "Students", es: "Estudiantes" },
  { id: "deck", icon: "deck", en: "Study Deck", es: "Mazo" }
];

/* Enrolled cohort. No students have enrolled in the course yet, so the
   roster is empty — every roster-driven surface shows an honest zero state
   until the first student joins. Add students here as they enroll. */
const CLASSMATES = [];

/* ---------- small local chrome helpers ---------- */
function IArrow() { return <span className="go-arrow"><Icon name="arrow-ur" size={20} /></span>; }
function ILabel({ icon, en, es, lang, light }) {
  return (
    <div className="card-label">
      <span className="ci"><Icon name={icon} size={15} /></span>
      <span className="cl-primary">{L(lang, en, es)}</span>
    </div>);
}
function fmtPct(n) { return n == null ? "—" : n + "%"; }

/* Build the roster from the enrolled cohort. No one is enrolled yet, so this
   returns an empty list. Each enrolled student's live numbers would derive
   from the shared assignments store once they exist. */
function buildRoster(assignments) {
  return CLASSMATES.map((c) => ({
    ...c, initials: c.name.split(" ").map((w) => w[0]).slice(0, 2).join(""),
    real: false, submitted: 0, total: assignments.length, gradedN: 0, pending: 0, avg: null, lastAt: 0
  }));
}

/* ============================================================
   SIDEBAR
   ============================================================ */
function InstrSidebar({ view, go, lang, expanded, setExpanded, profileOpen, setProfileOpen }) {
  const assignments = useAssignments();
  const toGrade = assignments.filter((a) => a.submission && !a.grade).length;
  const me = INSTRUCTOR;
  return (
    <aside className={"rail instr" + (expanded ? " expanded" : "")}>
      <div className="rail-top">
        <div className="rail-logo" onClick={() => go("home")} title="CEP">
          <img src="logo-navy.png" alt="CEP" />
        </div>
        {expanded ?
          <div className="rail-word">Corporate English<small>Instructor</small></div> :
          null}
        <button className="rail-toggle" onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          title={expanded ? L(lang, "Collapse", "Contraer") : L(lang, "Expand", "Expandir")}>
          <Icon name={expanded ? "chevron-l" : "menu"} size={18} />
        </button>
      </div>

      <nav className="rail-nav">
        {INSTR_NAV.map((n) =>
          <button key={n.id} className={"rail-item" + (view === n.id ? " active" : "")}
            onClick={() => go(n.id)} title={!expanded ? L(lang, n.en, n.es) : undefined}>
            <Icon name={n.icon} size={22} />
            <span>{L(lang, n.en, n.es)}</span>
            {n.id === "assignments" && toGrade ? <i className="rail-badge">{toGrade}</i> : null}
          </button>
        )}
      </nav>

      <div className="rail-foot">
        <div className="rail-grade" title={L(lang, "Submissions to grade", "Entregas por calificar")}>
          {expanded ?
            <><Icon name="clipboard" size={15} /><span><b>{toGrade}</b> {L(lang, "to grade", "por calificar")}</span></> :
            <><Icon name="clipboard" size={16} /><b>{toGrade}</b></>}
        </div>
        <button className="rail-profile" onClick={() => setProfileOpen((o) => !o)} title={me.name}>
          <span className={"rail-avatar" + (profileOpen || view === "account" ? " active" : "")}>{me.initials}</span>
          {expanded ?
            <span className="rail-id"><b>{me.name}</b><small>{L(lang, "Instructor", "Instructora")}</small></span> :
            null}
        </button>
      </div>

      {profileOpen ?
        <div className="pop" onMouseLeave={() => setProfileOpen(false)}>
          <div className="pop-head">
            <div className="av" style={{ background: "var(--navy)" }}>{me.initials}</div>
            <div><b>{me.name}</b><small>{L(lang, "Instructor", "Instructora")}</small></div>
          </div>
          <a className="pop-item" href="Student Dashboard.html">
            <Icon name="switch" size={18} /> {L(lang, "Open student dashboard", "Abrir panel del estudiante")}
          </a>
          <button className="pop-item" onClick={() => { go("students"); setProfileOpen(false); }}>
            <Icon name="users" size={18} /> {L(lang, "Students", "Estudiantes")}
          </button>
          <button className="pop-item" onClick={() => { go("account"); setProfileOpen(false); }}>
            <Icon name="gear" size={18} /> {L(lang, "Account settings", "Configuración")}
          </button>
          <button className="pop-item danger" onClick={() => { setProfileOpen(false); window.__cepLogout && window.__cepLogout(); }}>
            <Icon name="logout" size={18} /> {L(lang, "Log out", "Cerrar sesión")}
          </button>
        </div> :
        null}
    </aside>);
}

/* ============================================================
   TOPBAR
   ============================================================ */
function InstrTopbar({ lang, setLang, go, title, sub }) {
  return (
    <div className="topbar">
      <div className="tb-greet">
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="tb-right">
        <div className="tb-search" onClick={() => go("students")}>
          <Icon name="search" size={18} />
          <input placeholder={L(lang, "Search students & tasks…", "Buscar estudiantes y tareas…")} onFocus={(e) => e.target.blur()} readOnly />
        </div>
        <div className="lang-seg">
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ES</button>
        </div>
        <button className="icon-btn" onClick={() => go("feed")} title="Notifications"><Icon name="bell" size={19} /><span className="dot" /></button>
      </div>
    </div>);
}

/* ============================================================
   OVERVIEW (instructor home)
   ============================================================ */
function InstrHome({ lang, go, toast }) {
  const assignments = useAssignments();
  const meetings = useMeetings();
  const feed = useFeed();
  const now = Date.now();

  const needGrading = assignments.filter((a) => a.submission && !a.grade);
  const gradedN = assignments.filter((a) => a.grade).length;
  const nextMeet = meetings
    .filter((m) => (m.when || 0) + (m.durationMin || 0) * 60000 >= now)
    .sort((a, b) => a.when - b.when)[0];
  const latestPost = feed[0];
  const roster = buildRoster(assignments);
  const studentName = STUDENT.name;

  return (
    <div className="view-enter">
      <div className="grid dash-grid">
        {/* Grading queue hero */}
        <div className="card continue click col-8" onClick={() => go("assignments")}>
          <IArrow />
          <ILabel icon="clipboard" en="Grading queue" es="Cola de calificación" lang={lang} />
          {needGrading.length ? (
            <>
              <h2>{needGrading.length} {needGrading.length === 1 ?
                L(lang, "submission to review", "entrega por revisar") :
                L(lang, "submissions to review", "entregas por revisar")}</h2>
              <div className="queue-list">
                {needGrading.slice(0, 3).map((a) => (
                  <div className="queue-row" key={a.id}>
                    <Avatar name={studentName} color="var(--sage)" size={30} />
                    <div className="q-main">
                      <b>{a.title}</b>
                      <span>{studentName}</span>
                    </div>
                    <span className="q-when">{a.submission.at ? relTime(a.submission.at, lang) : ""}</span>
                  </div>
                ))}
              </div>
              <div className="meta">
                <span>{needGrading.length > 3 ? "+" + (needGrading.length - 3) + " " + L(lang, "more", "más") : ""}</span>
                <span className="btn btn-light" onClick={(e) => { e.stopPropagation(); go("assignments"); }}>
                  <Icon name="check" size={15} /> {L(lang, "Start grading", "Empezar a calificar")}
                </span>
              </div>
            </>
          ) : (
            <>
              <h2>{L(lang, "You're all caught up", "Todo al día")}</h2>
              <div className="hero-empty">
                <div className="he-ic"><Icon name="check" size={24} /></div>
                <div>
                  <b style={{ color: "#fff", fontSize: 15 }}>{L(lang, "No submissions waiting", "Nada por revisar")}</b>
                  <p>{L(lang, "New work will appear here the moment a student turns it in.", "El trabajo nuevo aparecerá aquí en cuanto un estudiante lo entregue.")}</p>
                </div>
              </div>
              <div className="meta">
                <span />
                <span className="btn btn-light" onClick={(e) => { e.stopPropagation(); go("assignments"); }}>
                  <Icon name="plus" size={15} /> {L(lang, "New assignment", "Nueva tarea")}
                </span>
              </div>
            </>
          )}
        </div>

        {/* At a glance */}
        <div className="card col-4">
          <ILabel icon="chart" en="At a glance" es="Resumen" lang={lang} />
          <div className="statrow" style={{ flexDirection: "column", gap: 12 }}>
            <div className="stat" style={{ padding: "13px 15px" }}>
              <div className="k"><Icon name="clipboard" size={13} /> {L(lang, "Awaiting grade", "Por calificar")}</div>
              <div className="v" style={{ fontSize: 28 }}>{needGrading.length}</div>
            </div>
            <div className="statrow" style={{ gap: 12 }}>
              <div className="stat" style={{ padding: "13px 15px" }}>
                <div className="k"><Icon name="star" size={13} /> {L(lang, "Graded", "Calificadas")}</div>
                <div className="v" style={{ fontSize: 24 }}>{gradedN}</div>
              </div>
              <div className="stat" style={{ padding: "13px 15px" }}>
                <div className="k"><Icon name="users" size={13} /> {L(lang, "Students", "Estudiantes")}</div>
                <div className="v" style={{ fontSize: 24 }}>{roster.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Next session */}
        <div className="card click col-4" onClick={() => go("meetings")}>
          <IArrow />
          <ILabel icon="video" en="Next session" es="Próxima clase" lang={lang} />
          {nextMeet ? (
            <>
              <h2 className="title" style={{ fontSize: 19, lineHeight: 1.2 }}>{nextMeet.title}</h2>
              <h3 className="sub" style={{ marginTop: 6 }}><Icon name="clock" size={14} /> {fmtWhen(nextMeet.when, lang)}</h3>
              <span className="btn btn-teams" style={{ marginTop: 16 }} onClick={(e) => { e.stopPropagation(); nextMeet.link ? window.open(nextMeet.link, "_blank") : go("meetings"); }}>
                <TeamsMark size={16} /> {L(lang, "Start on Teams", "Iniciar en Teams")}
              </span>
            </>
          ) : (
            <div className="mini-empty"><Icon name="calendar" size={20} /><span>{L(lang, "No sessions scheduled", "Sin clases programadas")}</span></div>
          )}
        </div>

        {/* Class feed preview */}
        <div className="card click col-4" onClick={() => go("feed")}>
          <IArrow />
          <ILabel icon="feed" en="Class feed" es="Muro de clase" lang={lang} />
          {latestPost ? (
            <>
              <div className="post-head" style={{ marginBottom: 8 }}>
                <Avatar name={latestPost.who} color={latestPost.color || "var(--sage)"} size={34} />
                <div><b style={{ fontSize: 14 }}>{latestPost.who}</b></div>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5, margin: 0,
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {latestPost.body || L(lang, "(media post)", "(contenido multimedia)")}
              </p>
            </>
          ) : (
            <div className="mini-empty"><Icon name="feed" size={20} /><span>{L(lang, "Nothing posted yet", "Aún no hay nada")}</span></div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card col-4">
          <ILabel icon="spark" en="Quick actions" es="Acciones rápidas" lang={lang} />
          <div className="ov-actions">
            <button className="ov-action" onClick={() => go("feed")}>
              <span className="ic"><Icon name="feed" size={18} /></span>
              <span>{L(lang, "Post announcement", "Publicar anuncio")}<small>{L(lang, "Share with the class", "Comparte con la clase")}</small></span>
              <span className="chev"><Icon name="chevron-r" size={18} /></span>
            </button>
            <button className="ov-action" onClick={() => go("assignments")}>
              <span className="ic navy"><Icon name="task" size={18} /></span>
              <span>{L(lang, "New assignment", "Nueva tarea")}<small>{L(lang, "Create & set a due date", "Crea y define la entrega")}</small></span>
              <span className="chev"><Icon name="chevron-r" size={18} /></span>
            </button>
            <button className="ov-action" onClick={() => go("meetings")}>
              <span className="ic teams"><Icon name="video" size={18} /></span>
              <span>{L(lang, "Schedule session", "Programar clase")}<small>{L(lang, "Host a live class", "Imparte una clase en vivo")}</small></span>
              <span className="chev"><Icon name="chevron-r" size={18} /></span>
            </button>
          </div>
        </div>

        {/* Roster preview */}
        <div className={"card col-8" + (roster.length ? " click" : "")} onClick={roster.length ? () => go("students") : undefined}>
          {roster.length ? <IArrow /> : null}
          <ILabel icon="users" en="Your class" es="Tu clase" lang={lang} />
          {roster.length ? (
            <div className="roster-mini">
              {roster.slice(0, 4).map((s, i) => (
                <div className="rm-row" key={i}>
                  <Avatar name={s.name} color={s.color} size={36} />
                  <div className="rm-main">
                    <b>{s.name}</b>
                    <span>{L(lang, s.level, s.levelEs)}</span>
                  </div>
                  {s.pending ? <span className="tag soon">{s.pending} {L(lang, "to grade", "por calificar")}</span> :
                    s.submitted ? <span className="tag done">{L(lang, "Active", "Activo")}</span> :
                    <span className="tag todo">{L(lang, "Not started", "Sin empezar")}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="mini-empty" style={{ padding: "28px 0 12px" }}>
              <Icon name="users" size={22} />
              <span style={{ fontSize: 14, color: "var(--ink)" }}>{L(lang, "No students enrolled yet", "Aún no hay estudiantes inscritos")}</span>
              <span style={{ fontSize: 12.5 }}>{L(lang, "Your roster will fill in as students join the cohort.", "Tu lista se llenará cuando los estudiantes se unan al grupo.")}</span>
            </div>
          )}
        </div>
      </div>
    </div>);
}

/* ============================================================
   STUDENTS — roster + per-student detail
   ============================================================ */
function RosterPage({ lang, go, toast }) {
  const assignments = useAssignments();
  const stats = useStats();
  const roster = buildRoster(assignments);
  const [sel, setSel] = iuS(0);
  const stu = roster[Math.min(sel, roster.length - 1)];

  const statusOf = (a) => a.grade ? "graded" : a.submission ? "soon" : "todo";
  const statusTxt = (a) => a.grade ? L(lang, "Graded", "Calificada") : a.submission ? L(lang, "Needs grade", "Por calificar") : L(lang, "Not turned in", "Sin entregar");

  if (roster.length === 0) {
    return (
      <div className="view-enter">
        <PageHead t={{}} title={L(lang, "Students", "Estudiantes")} sub={L(lang, "Track each student's submissions and progress.", "Sigue las entregas y el progreso de cada estudiante.")} />
        <EmptyState icon="users"
          title={L(lang, "No students enrolled yet", "Aún no hay estudiantes inscritos")}
          sub={L(lang, "No one has enrolled in this course yet. As students join your cohort, they'll appear here with their submissions and progress.", "Nadie se ha inscrito en este curso todavía. Cuando los estudiantes se unan a tu grupo, aparecerán aquí con sus entregas y progreso.")} />
      </div>);
  }

  return (
    <div className="view-enter">
      <PageHead t={{}} title={L(lang, "Students", "Estudiantes")} sub={L(lang, "Track each student's submissions and progress.", "Sigue las entregas y el progreso de cada estudiante.")} />
      <div className="roster-layout">
        <aside className="roster-list">
          {roster.map((s, i) => (
            <div key={i} className={"student-row" + (i === sel ? " active" : "")} onClick={() => setSel(i)}>
              <Avatar name={s.name} color={s.color} size={42} />
              <div className="sr-main">
                <b>{s.name}</b>
                <span>{s.real ? `${s.submitted}/${s.total} ${L(lang, "submitted", "entregadas")}` : L(lang, "No submissions yet", "Sin entregas aún")}</span>
              </div>
              {s.pending ? <span className="tag soon">{s.pending}</span> :
                s.gradedN ? <span className="tag done">{fmtPct(s.avg)}</span> : null}
            </div>
          ))}
        </aside>

        <div className="roster-detail">
          <div className="card col-12">
            <div className="stu-head">
              <Avatar name={stu.name} color={stu.color} size={56} />
              <div className="stu-id">
                <b>{stu.name}</b>
                <span>{L(lang, stu.level, stu.levelEs)} · {STUDENT.name === stu.name ? L(lang, "Your student", "Tu estudiante") : L(lang, "Enrolled", "Inscrito")}</span>
              </div>
              {stu.real ? (
                <div className="stu-act" style={{ marginLeft: "auto", display: "flex", gap: 9 }}>
                  <span className="btn btn-ghost" onClick={() => go("deck")}>
                    <Icon name="deck" size={15} /> {L(lang, "Study deck", "Mazo")}
                  </span>
                  <span className="btn btn-navy" onClick={() => go("assignments")}>
                    <Icon name="clipboard" size={15} /> {L(lang, "Grade work", "Calificar")}
                  </span>
                </div>
              ) : null}
            </div>

            {stu.real ? (
              <>
                <div className="stu-stats">
                  <div className="stu-stat">
                    <div className="k"><span className="ci"><Icon name="task" size={13} /></span> {L(lang, "Submitted", "Entregadas")}</div>
                    <div className="v">{stu.submitted}<small> / {stu.total}</small></div>
                  </div>
                  <div className="stu-stat">
                    <div className="k"><span className="ci"><Icon name="star" size={13} /></span> {L(lang, "Graded", "Calificadas")}</div>
                    <div className="v">{stu.gradedN}</div>
                  </div>
                  <div className="stu-stat">
                    <div className="k"><span className="ci"><Icon name="trophy" size={13} /></span> {L(lang, "Avg score", "Promedio")}</div>
                    <div className="v">{fmtPct(stu.avg)}</div>
                  </div>
                  <div className="stu-stat">
                    <div className="k"><span className="ci"><Icon name="chart" size={13} /></span> {L(lang, "Fluency", "Fluidez")}</div>
                    <div className="v">{stats.fluency}</div>
                  </div>
                </div>

                {/* the student's REAL progress, straight from their dashboard */}
                <div className="stu-sec-h"><span className="ci"><Icon name="chart" size={14} /></span> {L(lang, "Progress", "Progreso")}</div>
                <ProgressChart active={["overall"]} timeframe="1Y" lang={lang} height={180} showAxis={true} history={stats.history} />

                {/* their work across assignments */}
                <div className="stu-sec-h" style={{ marginTop: 22 }}><span className="ci"><Icon name="task" size={14} /></span> {L(lang, "Submitted work", "Trabajo entregado")}</div>
                <div className="stu-work">
                  {assignments.length === 0 ? (
                    <div className="mini-empty row"><Icon name="task" size={18} /><span>{L(lang, "No assignments posted yet.", "Aún no hay tareas.")}</span></div>
                  ) : (
                    assignments.map((a) => (
                      <div className="lrow" key={a.id}>
                        <div className="lic task"><Icon name="task" size={19} /></div>
                        <div className="lmain">
                          <b>{a.title}</b>
                          <span>{a.submission ? `${L(lang, "Turned in", "Entregada")} ${a.submission.at ? relTime(a.submission.at, lang) : ""}` : L(lang, "Not turned in", "Sin entregar")}{a.grade ? ` · ${a.grade.score}/${a.points}` : ""}</span>
                        </div>
                        {a.submission && !a.grade ? (
                          <button className="grade-btn btn btn-navy" onClick={() => go("assignments")}>
                            <Icon name="check" size={14} /> {L(lang, "Grade", "Calificar")}
                          </button>
                        ) : (
                          <span className={"tag " + statusOf(a)}>{statusTxt(a)}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="empty" style={{ border: "none", padding: "30px 20px 6px" }}>
                <div className="empty-ic"><Icon name="users" size={28} /></div>
                <b>{L(lang, "No submissions yet", "Sin entregas aún")}</b>
                <p>{L(lang, "This student is enrolled but hasn't turned in any work. Their progress will appear here once they start.", "Este estudiante está inscrito pero aún no ha entregado trabajo. Su progreso aparecerá aquí cuando empiece.")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);
}

/* ============================================================
   ACCOUNT (instructor)
   ============================================================ */
function InstrAccountPage({ lang, go, toast }) {
  const [tab, setTab] = iuS("profile");
  const tabs = [
    { id: "profile", label: L(lang, "Profile", "Perfil") },
    { id: "notifs", label: L(lang, "Notifications", "Notificaciones") }
  ];
  return (
    <div className="view-enter">
      <PageHead t={{}} title={L(lang, "Account Settings", "Configuración de cuenta")} sub={L(lang, "Manage your instructor profile.", "Administra tu perfil de instructora.")} />
      <div className="acct-grid">
        <div className="acct-side">
          {tabs.map((x) => <button key={x.id} className={tab === x.id ? "on" : ""} onClick={() => setTab(x.id)}>{x.label}</button>)}
        </div>
        <div className="card col-12">
          {tab === "profile" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div className="av" style={{ width: 64, height: 64, fontSize: 24, background: "var(--navy)" }}>{INSTRUCTOR.initials}</div>
                <div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--navy)", fontWeight: 600 }}>{INSTRUCTOR.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: 14 }}>{L(lang, "Instructor · The Corporate English Project", "Instructora · The Corporate English Project")}</div>
                </div>
              </div>
              <div className="field row">
                <div><label>{L(lang, "Full name", "Nombre completo")}</label><input defaultValue={INSTRUCTOR.name} /></div>
                <div><label>{L(lang, "Email", "Correo")}</label><input defaultValue="abril.lazaro@cep.school" /></div>
              </div>
              <div className="field row">
                <div><label>{L(lang, "Role", "Rol")}</label>
                  <select defaultValue="lead"><option value="lead">{L(lang, "Lead instructor", "Instructora principal")}</option><option value="assist">{L(lang, "Teaching assistant", "Asistente")}</option></select>
                </div>
                <div><label>{L(lang, "Cohort", "Grupo")}</label>
                  <select defaultValue="b1"><option value="b1">{L(lang, "B1 · Spring 2026", "B1 · Primavera 2026")}</option><option value="a2">{L(lang, "A2 · Spring 2026", "A2 · Primavera 2026")}</option></select>
                </div>
              </div>
              <button className="btn btn-navy" onClick={() => toast(L(lang, "Changes saved", "Cambios guardados"))}>{L(lang, "Save changes", "Guardar cambios")}</button>
            </>
          ) : (
            <>
              {[
                L(lang, "Email me when a student turns in work", "Avísame cuando un estudiante entregue trabajo"),
                L(lang, "Daily grading-queue summary", "Resumen diario de la cola de calificación"),
                L(lang, "Reminders before scheduled sessions", "Recordatorios antes de las clases"),
                L(lang, "New comments on my announcements", "Comentarios nuevos en mis anuncios")
              ].map((lbl, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: i ? "1px solid var(--line)" : "none", fontSize: 15, color: "var(--ink)" }}>
                  {lbl}
                  <input type="checkbox" defaultChecked={i < 3} style={{ width: 18, height: 18, accentColor: "var(--sage)" }} />
                </label>
              ))}
              <button className="btn btn-navy" style={{ marginTop: 18 }} onClick={() => toast(L(lang, "Changes saved", "Cambios guardados"))}>{L(lang, "Save changes", "Guardar cambios")}</button>
            </>
          )}
        </div>
      </div>
    </div>);
}

/* ============================================================
   STUDY DECK — view the student's deck, suggest cards, flag usage
   ============================================================ */
function InstrDeckComposer({ lang, onDone, toast }) {
  const [term, setTerm] = iuS("");
  const [tr, setTr] = iuS("");
  const [clang, setClang] = iuS("en");
  const [pos, setPos] = iuS("");
  const [ex, setEx] = iuS("");

  const create = () => {
    if (!term.trim() || !tr.trim()) return;
    const ok = suggestCard({ term: term.trim(), lang: clang, tr: tr.trim(), pos: pos.trim(), phon: "", ex: ex.trim() });
    if (ok) {
      toast(L(lang, "Suggestion added to the student's deck", "Sugerencia añadida al mazo del estudiante"));
      setTerm(""); setTr(""); setPos(""); setEx("");
      onDone && onDone();
    } else {
      toast(L(lang, "That word is already in the deck", "Esa palabra ya está en el mazo"));
    }
  };

  return (
    <div className="form-card">
      <div className="form-row">
        <label>{L(lang, "Word is in", "La palabra está en")}</label>
        <div className="seg-lang">
          <button className={clang === "en" ? "on" : ""} onClick={() => setClang("en")}>{L(lang, "English", "Inglés")}</button>
          <button className={clang === "es" ? "on" : ""} onClick={() => setClang("es")}>{L(lang, "Spanish", "Español")}</button>
        </div>
      </div>
      <div className="form-grid2">
        <div className="form-row">
          <label>{L(lang, "Term", "Término")}</label>
          <input value={term} onChange={(e) => setTerm(e.target.value)} className={clang === "es" ? "es-text" : ""}
            placeholder={clang === "es" ? "p. ej. aprovechar" : "e.g. to chip in"} autoFocus />
        </div>
        <div className="form-row">
          <label>{L(lang, "Translation", "Traducción")}</label>
          <input value={tr} onChange={(e) => setTr(e.target.value)} className={clang === "en" ? "es-text" : ""}
            placeholder={clang === "es" ? "to make the most of" : "aportar / contribuir"} />
        </div>
      </div>
      <div className="form-grid2">
        <div className="form-row">
          <label>{L(lang, "Part of speech", "Categoría")} <span style={{ color: "var(--muted)", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>· {L(lang, "optional", "opcional")}</span></label>
          <input value={pos} onChange={(e) => setPos(e.target.value)} placeholder={L(lang, "verb · phrase · noun…", "verbo · frase · sustantivo…")} />
        </div>
        <div className="form-row">
          <label>{L(lang, "Example", "Ejemplo")} <span style={{ color: "var(--muted)", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>· {L(lang, "optional", "opcional")}</span></label>
          <input value={ex} onChange={(e) => setEx(e.target.value)} placeholder={L(lang, "A natural sentence using it", "Una frase natural con la palabra")} />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={() => { onDone && onDone(); }}>{L(lang, "Cancel", "Cancelar")}</button>
        <button className="btn btn-navy" onClick={create} disabled={!term.trim() || !tr.trim()}>
          <Icon name="shield" size={15} /> {L(lang, "Suggest card", "Sugerir tarjeta")}
        </button>
      </div>
    </div>);
}

function InstrDeckRow({ c, lang, toast }) {
  const [flagging, setFlagging] = iuS(false);
  const [reason, setReason] = iuS("");
  const en = c.lang === "en" ? c.term : c.tr;
  const es = c.lang === "es" ? c.term : c.tr;

  const doFlag = () => {
    updateCard(c.term, { flagged: true, flagReason: reason.trim(), flaggedBy: INSTRUCTOR.name });
    setFlagging(false); setReason("");
    toast(L(lang, "Card flagged — the student will see it", "Tarjeta marcada — el estudiante la verá"));
  };
  const unflag = () => { updateCard(c.term, { flagged: false, flagReason: "" }); toast(L(lang, "Flag removed", "Marca quitada")); };

  return (
    <div className={"idk-row" + (c.flagged ? " flagged" : "")}>
      <div className="idk-main">
        <div className="idk-term">{en}</div>
        <div className="idk-tr es-text">{es}{c.pos ? <span style={{ fontStyle: "italic", color: "var(--muted)" }}> · {c.pos}</span> : null}</div>
        {c.ex ? <div className="idk-ex">"{c.ex}"</div> : null}
        <div className="idk-tags">
          {c.suggested ?
            <span className="card-tag sug"><Icon name="shield" size={11} /> {L(lang, "Suggested by you", "Sugerida por ti")}</span> :
            <span className="card-tag saved"><Icon name="bookmark" size={11} /> {L(lang, `Saved by ${STUDENT.first}`, `Guardada por ${STUDENT.first}`)}</span>}
          {c.flagged ? <span className="card-tag flag"><Icon name="flag" size={11} /> {L(lang, "Flagged", "Marcada")}{c.flagReason ? ": " + c.flagReason : ""}</span> : null}
        </div>
        {flagging ?
          <div className="idk-flagform">
            <input value={reason} onChange={(e) => setReason(e.target.value)} autoFocus
              placeholder={L(lang, "Why is this inappropriate? (optional)", "¿Por qué es inapropiada? (opcional)")}
              onKeyDown={(e) => { if (e.key === "Enter") doFlag(); }} />
            <button className="btn btn-rose" onClick={doFlag}><Icon name="flag" size={14} /> {L(lang, "Flag", "Marcar")}</button>
          </div> : null}
      </div>
      <div className="idk-actions">
        {c.flagged ?
          <button className="btn btn-ghost sm" onClick={unflag}>{L(lang, "Remove flag", "Quitar marca")}</button> :
          <button className="idk-flagbtn" onClick={() => setFlagging((v) => !v)}>
            <Icon name="flag" size={14} /> {L(lang, "Flag", "Marcar")}
          </button>}
        {c.suggested ?
          <button className="post-del" title={L(lang, "Withdraw suggestion", "Retirar sugerencia")} onClick={() => removeCard(c.term)}>
            <Icon name="trash" size={16} />
          </button> : null}
      </div>
    </div>);
}

function InstrDeckPage({ lang, go, toast }) {
  const deck = useDeck();
  const [composing, setComposing] = iuS(false);
  const suggested = deck.filter((c) => c.suggested).length;
  const flagged = deck.filter((c) => c.flagged).length;
  const saved = deck.length - suggested;

  return (
    <div className="view-enter">
      <div className="page-head-row">
        <PageHead t={{}} title={L(lang, `${STUDENT.first}'s study deck`, `Mazo de ${STUDENT.first}`)}
          sub={L(lang, "See every word, suggest new cards, and flag inappropriate usage.", "Mira cada palabra, sugiere tarjetas y marca usos inapropiados.")} />
        <button className="btn btn-navy hd-btn" onClick={() => setComposing((v) => !v)}>
          <Icon name={composing ? "close" : "plus"} size={16} /> {composing ? L(lang, "Cancel", "Cancelar") : L(lang, "Suggest a card", "Sugerir tarjeta")}
        </button>
      </div>

      <div className="idk-banner">
        <Avatar name={STUDENT.name} color="var(--sage)" size={42} />
        <div>
          <b>{STUDENT.name}</b>
          <span>{deck.length} {L(lang, "cards", "tarjetas")} · {saved} {L(lang, "saved", "guardadas")} · {suggested} {L(lang, "suggested by you", "sugeridas por ti")}{flagged ? ` · ${flagged} ${L(lang, "flagged", "marcadas")}` : ""}</span>
        </div>
      </div>

      {composing ? <InstrDeckComposer lang={lang} toast={toast} onDone={() => setComposing(false)} /> : null}

      {deck.length === 0 ? (
        <EmptyState icon="deck" title={L(lang, "The deck is empty", "El mazo está vacío")}
          sub={L(lang, `${STUDENT.first} hasn't saved any words yet. Suggest a card to get them started.`, `${STUDENT.first} aún no ha guardado palabras. Sugiere una tarjeta para empezar.`)}
          action={!composing ? <button className="btn btn-navy" onClick={() => setComposing(true)}><Icon name="plus" size={15} /> {L(lang, "Suggest a card", "Sugerir tarjeta")}</button> : null} />
      ) : (
        <div className="idk-list">
          {deck.map((c, i) => <InstrDeckRow key={c.term + i} c={c} lang={lang} toast={toast} />)}
        </div>
      )}
    </div>);
}

Object.assign(window, {
  INSTR_NAV, InstrSidebar, InstrTopbar, InstrHome, RosterPage, InstrAccountPage, InstrDeckPage
});
