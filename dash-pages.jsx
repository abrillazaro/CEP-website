/* ============================================================
   dash-pages.jsx — all page views (references window globals)
   ============================================================ */
const { useState: useS, useRef: useR, useEffect: useE, useMemo } = React;

/* ---------- small helpers ---------- */
function Gloss({ children }) {
  return children ? <span className="cl-gloss" style={{ fontSize: "10px" }}>{children}</span> : null;
}
function CardLabel({ icon, k, lang, en, es, children }) {
  const pl = lang || "en";
  const other = pl === "en" ? "es" : "en";
  let primary = children,gloss = null;
  if (k && typeof STR !== "undefined" && STR[pl] && STR[pl][k] != null) {
    primary = STR[pl][k];
    gloss = STR[other][k];
  } else if (en != null || es != null) {
    primary = pl === "en" ? en : es;
    gloss = pl === "en" ? es : en;
  }
  return (
    <div className="card-label">
      <span className="ci"><Icon name={icon} size={15} /></span>
      <span className="cl-primary">{primary}</span>
      <Gloss>{gloss}</Gloss>
    </div>);

}
function GoArrow() {return <span className="go-arrow"><Icon name="arrow-ur" size={20} /></span>;}

/* ============================================================
   DASHBOARD TRANSLATE CARD — translate + save straight to deck
   ============================================================ */
const TR_QUICK = ["aprovechar", "to look forward to", "echar de menos", "soler"];

function TranslateCard({ t, lang, go, toast }) {
  const [q, setQ] = useS("");
  const [dir, setDir] = useS("auto");
  const [busy, setBusy] = useS(false);
  const [res, setRes] = useS(null);
  const [err, setErr] = useS("");
  const [saved, setSaved] = useS(false);
  const [listening, setListening] = useS(false);
  const [playing, setPlaying] = useS(false);
  const inputRef = useR(null);

  const cycleDir = () => setDir((d) => d === "auto" ? "es2en" : d === "es2en" ? "en2es" : "auto");
  const dirText = dir === "en2es" ? "EN → ES" : dir === "es2en" ? "ES → EN" : t.trAuto;

  const run = async (text) => {
    const val = (text != null ? text : q).trim();
    if (!val) return;
    setBusy(true); setErr(""); setSaved(false); setRes(null);
    try {
      if (!window.claude || !window.claude.complete) throw new Error("offline");
      const data = await translatePhrase(val, dir);
      setRes(data);
    } catch (e) {
      setErr(t.trErr);
    } finally {
      setBusy(false);
    }
  };

  const onQuick = (w) => { setQ(w); run(w); };

  const onSave = () => {
    if (!res || saved) return;
    const ex = Array.isArray(res.examples) && res.examples[0] ? res.examples[0] : null;
    const ok = addCard({
      term: res.input,
      lang: res.sourceLang || "es",
      tr: res.translation,
      pos: res.partOfSpeech || (res.register || "phrase"),
      phon: res.pronunciation || "",
      ex: ex ? ex.source : ""
    });
    if (ok) {
      recordActivity({ vocab: 2, points: 5, goal: 1 });
      setSaved(true);
      toast && toast(t.trSaved);
    } else {
      toast && toast(t.trInDeck);
      setSaved(true);
    }
  };

  const onListen = () => {
    if (!res) return;
    const u = speak(res.translation, res.targetLang || "en");
    if (!u) return;
    setPlaying(true);
    u.onend = () => setPlaying(false);
    setTimeout(() => setPlaying(false), 4000);
  };

  const onNew = () => { setRes(null); setErr(""); setSaved(false); setQ(""); if (inputRef.current) inputRef.current.focus(); };

  const onMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast && toast(lang === "es" ? "Micrófono no disponible" : "Mic not available"); return; }
    const rec = new SR();
    rec.lang = dir === "en2es" ? "en-US" : dir === "es2en" ? "es-ES" : lang === "es" ? "es-ES" : "en-US";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (ev) => { const txt = ev.results[0][0].transcript; setQ(txt); run(txt); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  };

  const langWord = (l) => l === "es" ? (lang === "es" ? "Español" : "Spanish") : (lang === "es" ? "Inglés" : "English");

  return (
    <div className="card tr-card col-12">
      <div className="tr-head">
        <CardLabel icon="search" en={STR.en.trHeading} es={STR.es.trHeading} lang={lang} />
        <p className="tr-sub">{t.trSub}</p>
      </div>

      <form className="tr-bar" onSubmit={(e) => { e.preventDefault(); run(); }}>
        <span className="tr-ico"><Icon name="search" size={20} /></span>
        <input
          ref={inputRef} className="tr-input" value={q} spellCheck="false"
          onChange={(e) => setQ(e.target.value)} placeholder={t.trPlaceholder} aria-label={t.trPlaceholder} />
        <button type="button" className={"tr-mic" + (listening ? " live" : "")} onClick={onMic} aria-label="Voice input" title="Voice input">
          <Icon name="mic" size={18} />
        </button>
        <button type="submit" className="btn btn-navy tr-go" disabled={busy || !q.trim()}>
          {busy ? <span className="spinner sm" /> : <Icon name="search" size={16} stroke={2.4} />}
          {t.trGo}
        </button>
      </form>

      <div className="tr-meta">
        <button type="button" className="tr-dir" onClick={cycleDir} title="Translation direction">
          <Icon name="swap" size={15} /> {dirText}
        </button>
        <div className="tr-quick">
          <span>{t.trTry}</span>
          {TR_QUICK.map((w) => (
            <button type="button" key={w} className="tr-chip" onClick={() => onQuick(w)}>{w}</button>
          ))}
        </div>
      </div>

      {err ? <div className="tr-err"><Icon name="close" size={16} /> {err}</div> : null}

      {res ? (
        <div className="tr-result">
          <div className="tr-result-top">
            <div className="tr-echo">{t.trSource}: <b>{res.input}</b> · {langWord(res.sourceLang)} <Icon name="swap" size={12} /> {langWord(res.targetLang)}</div>
            {res.register ? <span className="tr-pill">{res.register}</span> : null}
          </div>
          <div className="tr-trans">{res.translation}</div>
          <div className="tr-subline">
            {res.partOfSpeech ? <span className="tr-pos">{res.partOfSpeech}</span> : null}
            {res.pronunciation ? <span className="tr-phon">/{res.pronunciation}/</span> : null}
            <button className={"tr-listen" + (playing ? " on" : "")} onClick={onListen}>
              {playing ? <span className="eqbars"><span></span><span></span><span></span></span> : <Icon name="speaker" size={15} />}
              {t.trListen}
            </button>
          </div>

          {Array.isArray(res.examples) && res.examples.length ? (
            <div className="tr-ex-wrap">
              {res.examples.slice(0, 2).map((ex, i) => (
                <div className="tr-ex" key={i}>
                  <div className="es">{ex.source}</div>
                  <div className="en">{ex.target}</div>
                </div>
              ))}
            </div>
          ) : null}

          {res.note ? <div className="tr-note"><Icon name="spark" size={14} /> {res.note}</div> : null}

          <div className="tr-actions">
            <button className={"btn tr-save" + (saved ? " done" : "")} onClick={onSave} disabled={saved}>
              <Icon name={saved ? "check" : "bookmark"} size={17} /> {saved ? t.trSaved : t.trSaveDeck}
            </button>
            {saved ? <button className="btn btn-ghost tr-open" onClick={() => go("deck")}>{t.deckLabel} <Icon name="arrow-ur" size={15} /></button> : null}
            <button className="tr-newlink" onClick={onNew}>{t.trNew}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PageHead({ t, title, sub }) {
  return <div className="page-h"><h1>{title}</h1><p>{sub}</p></div>;
}
function Avatar({ name, color, size = 42 }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return <div className="av" style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}>{initials}</div>;
}

/* ============================================================
   DASHBOARD HOME
   ============================================================ */
function Dashboard({ t, lang, go, toast }) {
  const stats = useStats();
  const deck = useDeck();
  const fc = fluencyChange(stats.history, "overall");
  const cur = lang === "es" ?
  { track: CURRENT.trackEs, title: CURRENT.titleEs, unit: CURRENT.unitEs, left: CURRENT.leftEs } :
  { track: CURRENT.track, title: CURRENT.title, unit: CURRENT.unit, left: CURRENT.leftEn };
  const dueCount = deck.filter((d) => d.due).length;
  const feed = useFeed();
  const meetings = useMeetings();
  const assignments = useAssignments();
  const now = Date.now();
  const nextMeet = meetings
    .filter((m) => (m.when || 0) + (m.durationMin || 0) * 60000 >= now)
    .sort((a, b) => a.when - b.when)[0];
  const latestPost = feed[0];

  return (
    <div className="view-enter">
      <div className="grid dash-grid">
        {/* Translate utility — translate & save straight to deck */}
        <TranslateCard t={t} lang={lang} go={go} toast={toast} />

        {/* Continue learning */}
        <div className="card continue click col-8" onClick={() => go("lessons")}>
          <GoArrow />
          <CardLabel icon="book" k="continueLabel" lang={lang} />
          <div className="ctrack">{cur.track} · {cur.unit}</div>
          <h2>{cur.title}</h2>
          <div className="pbar"><i style={{ width: `${CURRENT.progress * 100}%` }} /></div>
          <div className="meta">
            <span>{Math.round(CURRENT.progress * 100)}% · {cur.left}</span>
            <span className="btn btn-light" onClick={(e) => {e.stopPropagation();go("lessons");}}>
              <Icon name="play" size={15} /> {t.resume}
            </span>
          </div>
        </div>

        {/* Daily goal + stats */}
        <div className="card col-4">
          <CardLabel icon="target" k="dailyGoal" lang={lang} />
          <div className="goal">
            <Ring value={stats.goalDone} total={stats.goalTarget} />
            <div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--navy)", fontWeight: 600 }}>
                {stats.goalDone} {t.goalDone} {stats.goalTarget}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 2 }}>
                🔥 {stats.streak} {t.streak}
              </div>
            </div>
          </div>
          <div className="statrow" style={{ marginTop: 18 }}>
            <div className="stat" style={{ padding: "13px 15px" }}>
              <div className="k"><Icon name="star" size={13} /> {t.points} <Gloss>{STR[lang === "en" ? "es" : "en"].points}</Gloss></div>
              <div className="v" style={{ fontSize: 24 }}>{stats.points.toLocaleString()}</div>
            </div>
            <div className="stat" style={{ padding: "13px 15px" }}>
              <div className="k"><Icon name="trophy" size={13} /> {t.rankLabel} <Gloss>{STR[lang === "en" ? "es" : "en"].rankLabel}</Gloss></div>
              <div className="v" style={{ fontSize: 16, marginTop: 7, fontFamily: "var(--sans)", fontWeight: 700 }}>
                {lang === "es" ? "Sin clasificar" : "Unranked"}
              </div>
            </div>
          </div>
        </div>

        {/* Progress chart */}
        <div className="card click col-7" onClick={() => go("progress")}>
          <GoArrow />
          <CardLabel icon="chart" k="progressLabel" lang={lang} />
          <div className="chart-head">
            <div>
              <span className="chart-index">{stats.fluency}<small>{lang === "es" ? "Índice" : "Index"}</small></span>
            </div>
            <span className={"trend " + (fc >= 0 ? "up" : "down")}><Icon name="arrow-ur" size={15} /> {fc >= 0 ? "+" : ""}{fc}% {t.thisMonth}</span>
          </div>
          <ProgressChart active={["overall"]} timeframe="1Y" lang={lang} height={170} showAxis={false} history={stats.history} />
        </div>

        {/* Study deck */}
        <div className="card click col-5" onClick={() => go("deck")}>
          <GoArrow />
          <CardLabel icon="deck" k="deckLabel" lang={lang} />
          <div className="deckmini">
            <div className={"dc b" + (deck[0] && deck[0].lang === "es" ? " es-text" : "")}>{deck[0] ? deck[0].term : DECK[2].term}</div>
            <div className="dc c">{deck[1] ? deck[1].term : DECK[1].term}</div>
            <div className={"dc a" + (deck[2] && deck[2].lang === "es" ? " es-text" : "")}>{deck[2] ? deck[2].term : DECK[0].term}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>
              <b style={{ color: "var(--sage-deep)", fontWeight: 700 }}>{dueCount}</b> {t.deckDue}
            </span>
            <span className="btn btn-sage" onClick={(e) => {e.stopPropagation();go("deck");}}>{t.reviewNow}</span>
          </div>
        </div>

        {/* Today's drill */}
        <div className="card click col-4" onClick={() => go("drills")}>
          <GoArrow />
          <CardLabel icon="drill" k="todayDrill" lang={lang} />
          <h2 className="title">{lang === "es" ? "4 preguntas" : "4 questions"}</h2>
          <h3 className="sub">{t.drillBlurb}</h3>
          <span className="btn btn-navy" style={{ marginTop: 16 }} onClick={(e) => {e.stopPropagation();go("drills");}}>
            <Icon name="drill" size={15} /> {t.startDrill}
          </span>
        </div>

        {/* Next meeting */}
        <div className="card click col-4" onClick={() => go("meetings")}>
          <GoArrow />
          <CardLabel icon="video" k="meetLabel" lang={lang} />
          {nextMeet ? (
            <>
              <h2 className="title" style={{ fontSize: 19, lineHeight: 1.2 }}>{nextMeet.title}</h2>
              <h3 className="sub" style={{ marginTop: 6 }}><Icon name="clock" size={14} /> {fmtWhen(nextMeet.when, lang)}</h3>
              <span className="btn btn-teams" style={{ marginTop: 16 }} onClick={(e) => {e.stopPropagation();go("meetings");}}>
                <TeamsMark size={16} /> {t.joinTeams}
              </span>
            </>
          ) : (
            <div className="mini-empty"><Icon name="calendar" size={20} /><span>{t.noSessions}</span></div>
          )}
        </div>

        {/* Feed preview */}
        <div className="card click col-4" onClick={() => go("feed")}>
          <GoArrow />
          <CardLabel icon="feed" k="feedLabel" lang={lang} />
          {latestPost ? (
            <>
              <div className="post-head" style={{ marginBottom: 8 }}>
                <Avatar name={latestPost.who} color={latestPost.color || "var(--sage)"} size={34} />
                <div><b style={{ fontSize: 14 }}>{latestPost.who}</b></div>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5, margin: 0,
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {latestPost.body || (lang === "es" ? "(contenido multimedia)" : "(media post)")}
              </p>
            </>
          ) : (
            <div className="mini-empty"><Icon name="feed" size={20} /><span>{t.fdEmpty}</span></div>
          )}
        </div>

        {/* Assignments */}
        <div className="card click col-12" onClick={() => go("assignments")}>
          <GoArrow />
          <div className="sec-h" style={{ margin: "0 0 6px" }}>
            <CardLabel icon="task" lang={lang} en={STR.en.assignLabel + " · " + STR.en.upcoming} es={STR.es.assignLabel + " · " + STR.es.upcoming} />
          </div>
          {assignments.length === 0 ? (
            <div className="mini-empty row"><Icon name="task" size={18} /><span>{t.noTasks}</span></div>
          ) : (
            assignments.slice(0, 3).map((a) =>
            <div className="lrow" key={a.id}>
              <div className="lic task"><Icon name="task" size={19} /></div>
              <div className="lmain">
                <b>{a.title}</b>
                <span>{t.dueLabel}: {a.due ? fmtWhen(a.due, lang) : t.noDue}</span>
              </div>
              <span className={"tag " + (a.grade ? "graded" : a.submission ? "soon" : "todo")}>
                {a.grade ? t.gradedBy : a.submission ? t.submitted : t.notTurnedIn}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>);

}

/* ============================================================
   LESSONS
   ============================================================ */
function LessonsPage({ t, lang, go }) {
  return (
    <div className="view-enter">
      <PageHead t={t} title={t.pLessons} sub={t.pLessonsSub} />
      <div className="grid" style={{ gap: 18 }}>
        {TRACKS.map((tr, i) =>
        <div className="track" key={i}>
            <div className="track-head">
              <div className="tnum">{tr.n}</div>
              <div style={{ flex: 1 }}>
                <b>{lang === "es" ? tr.es : tr.en}</b>
                <div><span>{lang === "es" ? tr.metaEs : tr.metaEn}</span></div>
              </div>
              <Icon name="chevron-r" size={20} />
            </div>
            {tr.lessons.map((ls, j) =>
          <div key={j} className={"lesson-li" + (ls.s === "lock" ? " locked" : "")}
          onClick={() => ls.s !== "lock" && go("drills")}>
                <div className={"lnode " + ls.s}>
                  {ls.s === "done" ? <Icon name="check" size={15} /> : ls.s === "lock" ? <Icon name="lock" size={13} /> : j + 1}
                </div>
                <b>{lang === "es" ? ls.te : ls.t}</b>
                {ls.s === "now" ? <span className="tag soon">{lang === "es" ? "Continuar" : "Continue"}</span> : null}
                {ls.s !== "lock" ? <Icon name="chevron-r" size={18} /> : null}
              </div>
          )}
          </div>
        )}
      </div>
    </div>);

}

/* ============================================================
   STUDY DECK — flashcards
   ============================================================ */
const enOf = (c) => (c.lang === "en" ? c.term : c.tr);
const esOf = (c) => (c.lang === "es" ? c.term : c.tr);

function DeckPage({ t, lang, go, toast }) {
  const deck = useDeck();
  const [sort, setSort] = useS("recent");
  const [sel, setSel] = useS(0);
  const [flipped, setFlipped] = useS(false);

  const cards = useMemo(() => {
    if (sort === "alpha") return [...deck].sort((a, b) => enOf(a).toLowerCase().localeCompare(enOf(b).toLowerCase()));
    return deck; // store order = most recently saved first
  }, [deck, sort]);

  // keep selection in range as the deck changes
  useE(() => { if (sel > cards.length - 1) setSel(Math.max(0, cards.length - 1)); }, [cards.length]);

  const goCard = (i) => { setFlipped(false); setSel(Math.max(0, Math.min(cards.length - 1, i))); };
  const del = (term) => {
    const wasLast = sel >= cards.length - 1;
    removeCard(term);
    setFlipped(false);
    if (wasLast) setSel((s) => Math.max(0, s - 1));
    toast && toast(lang === "es" ? "Tarjeta eliminada" : "Card deleted");
  };

  if (!cards.length) {
    return (
      <div className="view-enter">
        <PageHead t={t} title={t.pDeck} sub={t.pDeckSub} />
        <div className="card" style={{ maxWidth: 460, margin: "40px auto", textAlign: "center", padding: "44px 32px" }}>
          <div className="celebrate"><Icon name="deck" size={34} /></div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 25, color: "var(--navy)", fontWeight: 600, margin: "16px 0 6px" }}>{t.dkEmpty}</div>
          <p style={{ color: "var(--muted)", margin: "0 0 22px" }}>{t.dkEmptySub}</p>
          <button className="btn btn-navy" onClick={() => go("home")}><Icon name="search" size={16} /> {t.dkGoTranslate}</button>
        </div>
      </div>);
  }

  const card = cards[sel];
  const enText = enOf(card), esText = esOf(card);
  const esDetail = card.lang === "es"; // phon + example are in Spanish

  return (
    <div className="view-enter">
      <PageHead t={t} title={t.pDeck} sub={t.pDeckSub} />
      <div className="deck-layout">
        {/* Sidebar — scroll, sort, delete */}
        <aside className="deck-side">
          <div className="deck-side-head">
            <span className="deck-side-title">{t.dkAllCards} <b>{cards.length}</b></span>
            <div className="deck-sort">
              <button className={sort === "recent" ? "on" : ""} onClick={() => setSort("recent")}>{t.dkSortRecent}</button>
              <button className={sort === "alpha" ? "on" : ""} onClick={() => setSort("alpha")}>{t.dkSortAlpha}</button>
            </div>
          </div>
          <div className="deck-list">
            {cards.map((c, i) => (
              <div key={c.term + i} className={"deck-row" + (i === sel ? " active" : "") + (c.flagged ? " flagged" : "")} onClick={() => goCard(i)}>
                <div className="deck-row-main">
                  <div className="dr-en">{enOf(c)}</div>
                  <div className="dr-es es-text">{esOf(c)}</div>
                  {(c.suggested || c.flagged) ?
                    <div className="dr-tags">
                      {c.suggested ? <span className="card-tag sug"><Icon name="shield" size={11} /> {lang === "es" ? "Sugerida" : "Suggested"}</span> : null}
                      {c.flagged ? <span className="card-tag flag"><Icon name="flag" size={11} /> {lang === "es" ? "Marcada" : "Flagged"}</span> : null}
                    </div> : null}
                </div>
                <button className="dr-del" title={t.dkDelete} aria-label={t.dkDelete}
                  onClick={(e) => { e.stopPropagation(); del(c.term); }}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Main — flashcard + centered nav */}
        <div className="deck-main">
          <div className={"flashcard" + (flipped ? " flipped" : "")} onClick={() => setFlipped((f) => !f)}>
            <div className="fc-inner">
              <div className="fc-face">
                <span className="lang-pill">English</span>
                {card.suggested ? <span className="fc-badge"><Icon name="shield" size={12} /> {lang === "es" ? `Sugerida por ${card.by || "tu instructora"}` : `Suggested by ${card.by || "your instructor"}`}</span> : null}
                {card.flagged ? <div className="fc-flag"><Icon name="flag" size={14} /> {(lang === "es" ? "Marcada por tu instructora" : "Flagged by your instructor") + (card.flagReason ? ": " + card.flagReason : "")}</div> : null}
                <div className="fc-term">{enText}</div>
                <div className="fc-pos">{card.pos}</div>
                <button className="btn btn-ghost" style={{ marginTop: 16, padding: "8px 14px" }}
                  onClick={(e) => { e.stopPropagation(); speak(enText, "en"); }}>
                  <Icon name="speaker" size={16} /> {lang === "es" ? "Escuchar" : "Listen"}
                </button>
                <div className="fc-hint"><Icon name="chevron-r" size={14} /> {t.tapFlip}</div>
              </div>
              <div className="fc-face back">
                <span className="lang-pill es-text" style={{ background: "#e7ecf4", color: "var(--navy)" }}>Español</span>
                <div className="fc-term es-text" style={{ fontSize: 38 }}>{esText}</div>
                {esDetail && card.phon ? <div className="fc-phon">/{card.phon}/</div> : null}
                {esDetail && card.ex ? <div className="fc-ex es-text">“{card.ex}”</div> : null}
                <button className="btn btn-ghost" style={{ marginTop: 16, padding: "8px 14px" }}
                  onClick={(e) => { e.stopPropagation(); speak(esText, "es"); }}>
                  <Icon name="speaker" size={16} /> {lang === "es" ? "Escuchar" : "Listen"}
                </button>
              </div>
            </div>
          </div>

          <div className="deck-nav">
            <button className="deck-navbtn prev" onClick={() => goCard(sel - 1)} disabled={sel === 0}>
              <Icon name="chevron-l" size={18} /> {t.dkPrev}
            </button>
            <div className="deck-count">{t.cardOf} {sel + 1}/{cards.length}</div>
            <button className="deck-navbtn next" onClick={() => goCard(sel + 1)} disabled={sel === cards.length - 1}>
              {t.dkNext} <Icon name="chevron-r" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>);

}

/* ============================================================
   DRILLS — Duolingo-style
   ============================================================ */
function DrillsPage({ t, lang, go, toast }) {
  const qs = DRILLS;
  const [i, setI] = useS(0);
  const [sel, setSel] = useS(null);
  const [checked, setChecked] = useS(false);
  const [hearts, setHearts] = useS(3);
  const [done, setDone] = useS(false);
  const [earned, setEarned] = useS(0);
  const q = qs[i];
  const isCorrect = sel === q.correct;

  const onCheck = () => {
    if (sel == null) return;
    setChecked(true);
    if (sel === q.correct) {
      setEarned((e) => e + 10);
      recordActivity({ points: 10, vocab: 3, grammar: 3, goal: 1 });
    } else {
      setHearts((h) => Math.max(0, h - 1));
    }
  };
  const onNext = () => {
    if (i + 1 >= qs.length) {recordActivity({ drill: 1 });setDone(true);return;}
    setI(i + 1);setSel(null);setChecked(false);
  };

  if (done) {
    return (
      <div className="view-enter">
        <div className="drill-shell">
          <div className="card" style={{ textAlign: "center", padding: "44px 32px", marginTop: 30 }}>
            <div className="celebrate"><Icon name="spark" size={36} /></div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 28, color: "var(--navy)", fontWeight: 600, margin: "16px 0 6px" }}>{t.drillDone}</div>
            <p style={{ color: "var(--muted)", margin: "0 0 22px" }}>{lang === "es" ? `Ganaste ${earned} puntos y sumaste a tu meta diaria.` : `You earned ${earned} points toward your daily goal.`}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn btn-ghost" onClick={() => {setI(0);setSel(null);setChecked(false);setDone(false);setHearts(3);setEarned(0);}}>
                {lang === "es" ? "Otra ronda" : "Another round"}
              </button>
              <button className="btn btn-navy" onClick={() => go("home")}>{t.backToDash}</button>
            </div>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="view-enter">
      <div className="drill-shell">
        <div className="drill-top">
          <button className="x" onClick={() => go("home")}><Icon name="close" size={18} /></button>
          <div className="drill-bar"><i style={{ width: `${(i + (checked ? 1 : 0)) / qs.length * 100}%` }} /></div>
          <div className="drill-hearts"><Icon name="heart" size={18} /> {hearts}</div>
        </div>

        <div className="drill-q">{lang === "es" ? q.qEs : q.qEn}</div>
        <div className={"drill-prompt" + (q.pLang === "es" ? " es-text" : "")}>{q.prompt}</div>
        <div className="drill-sub">{q.sub}</div>

        <div className="opts en-text">
          {q.opts.map((o, oi) => {
            let cls = "opt";
            if (checked) {
              if (oi === q.correct) cls += " correct";else
              if (oi === sel) cls += " wrong";
            } else if (oi === sel) cls += " sel";
            return (
              <button key={oi} className={cls} disabled={checked} onClick={() => setSel(oi)}>
                <span className="num">{oi + 1}</span>{o}
              </button>);

          })}
        </div>

        <div className="drill-foot">
          {checked ?
          <div className={"feedback " + (isCorrect ? "ok" : "no")}>
              <Icon name={isCorrect ? "check" : "close"} size={22} />
              <div>{isCorrect ? t.correct : t.incorrect}<small>{q.why}</small></div>
            </div> :
          <div style={{ flex: 1 }} />}
          {checked ?
          <button className="btn btn-sage" onClick={onNext}>{t.next} <Icon name="chevron-r" size={16} /></button> :
          <button className="btn btn-navy" onClick={onCheck} disabled={sel == null} style={{ opacity: sel == null ? .5 : 1 }}>{t.check}</button>}
        </div>
      </div>
    </div>);

}

/* ============================================================
   PROGRESS
   ============================================================ */
function ProgressPage({ t, lang, go }) {
  const stats = useStats();
  const fc = fluencyChange(stats.history, "overall");
  const [tf, setTf] = useS("1Y");
  const [active, setActive] = useS(["overall"]);
  const toggle = (id) => {
    if (id === "overall") return;
    setActive((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);
  };
  const tfs = ["1M", "3M", "6M", "1Y"];
  return (
    <div className="view-enter">
      <PageHead t={t} title={t.pProgress} sub={t.pProgressSub} />
      <div className="card col-12" style={{ marginBottom: 18 }}>
        <div className="chart-head">
          <div>
            <CardLabel icon="chart">{lang === "es" ? "Índice de fluidez" : "Fluency Index"}</CardLabel>
            <span className="chart-index">{stats.fluency}
              <span className={"trend " + (fc >= 0 ? "up" : "down")} style={{ marginLeft: 12, fontSize: 15 }}><Icon name="arrow-ur" size={15} /> {fc >= 0 ? "+" : ""}{fc}% {t.thisMonth}</span>
            </span>
          </div>
          <div className="tf-tabs">
            {tfs.map((x) => <button key={x} className={tf === x ? "on" : ""} onClick={() => setTf(x)}>{x}</button>)}
          </div>
        </div>
        <ProgressChart active={active} timeframe={tf} lang={lang} height={300} showAxis={true} history={stats.history} />
        <div className="legend">
          {SERIES_META.map((s) =>
          <button key={s.id} className={active.includes(s.id) ? "on" : ""} onClick={() => toggle(s.id)}>
              <span className="sw" style={{ background: s.color }} />{lang === "es" ? s.es : s.en}
            </button>
          )}
        </div>
      </div>
      <div className="grid dash-grid">
        {SERIES_META.filter((s) => s.id !== "overall").map((s) => {
          const now = seriesValue(stats.history, s.id);
          const chg = fluencyChange(stats.history, s.id);
          return (
            <div className="card col-3" key={s.id}>
              <div className="k" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                <span className="sw" style={{ width: 11, height: 11, borderRadius: 3, background: s.color, display: "inline-block" }} />
                {lang === "es" ? s.es : s.en}
              </div>
              <div className="v" style={{ fontFamily: "var(--serif)", fontSize: 32, color: "var(--navy)", fontWeight: 600, marginTop: 8 }}>{now}</div>
              <span className={"trend " + (chg >= 0 ? "up" : "down")}><Icon name="arrow-ur" size={13} /> {chg >= 0 ? "+" : ""}{chg}%</span>
            </div>);

        })}
      </div>
    </div>);

}

/* ============================================================
   ACCOUNT
   ============================================================ */
function AccountPage({ t, lang, go, toast }) {
  const [tab, setTab] = useS("profile");
  const tabs = [
  { id: "profile", label: t.aProfile }, { id: "learning", label: t.aLearning },
  { id: "notifs", label: t.aNotifs }, { id: "billing", label: t.aBilling }];

  return (
    <div className="view-enter">
      <PageHead t={t} title={t.pAccount} sub={t.pAccountSub} />
      <div className="acct-grid">
        <div className="acct-side">
          {tabs.map((x) => <button key={x.id} className={tab === x.id ? "on" : ""} onClick={() => setTab(x.id)}>{x.label}</button>)}
        </div>
        <div className="card col-12">
          {tab === "profile" ?
          <>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div className="av" style={{ width: 64, height: 64, fontSize: 24, background: "var(--sage)" }}>{STUDENT.initials}</div>
                <div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--navy)", fontWeight: 600 }}>{STUDENT.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: 14 }}>{lang === "es" ? STUDENT.levelEs : STUDENT.level}</div>
                </div>
              </div>
              <div className="field row">
                <div><label>{t.fullName}</label><input defaultValue={STUDENT.name} /></div>
                <div><label>{t.email}</label><input defaultValue="abril.ramirez@email.com" /></div>
              </div>
              <div className="field row">
                <div><label>{t.nativeLang}</label>
                  <select defaultValue="es"><option value="es">Español</option><option value="en">English</option><option value="pt">Português</option></select>
                </div>
                <div><label>{t.goalLvl}</label>
                  <select defaultValue="b2"><option value="b1">B1 · Intermediate</option><option value="b2">B2 · Upper-Intermediate</option><option value="c1">C1 · Advanced</option></select>
                </div>
              </div>
              <button className="btn btn-navy" onClick={() => toast(t.saved)}>{t.save}</button>
            </> :
          tab === "learning" ?
          <>
              <div className="field"><label>{t.dailyGoalSet}</label>
                <select defaultValue="5"><option value="3">{lang === "es" ? "Ligero · 3 al día" : "Light · 3 a day"}</option><option value="5">{lang === "es" ? "Regular · 5 al día" : "Regular · 5 a day"}</option><option value="8">{lang === "es" ? "Intenso · 8 al día" : "Intense · 8 a day"}</option></select>
              </div>
              <div className="field"><label>{t.nativeLang}</label>
                <select defaultValue="es"><option value="es">Español</option><option value="en">English</option></select>
              </div>
              <button className="btn btn-navy" onClick={() => toast(t.saved)}>{t.save}</button>
            </> :
          tab === "notifs" ?
          <>
              {[
            lang === "es" ? "Recordatorios de práctica diaria" : "Daily practice reminders",
            lang === "es" ? "Anuncios de la instructora" : "Instructor announcements",
            lang === "es" ? "Recordatorios de clases en Teams" : "Teams class reminders",
            lang === "es" ? "Resumen semanal de progreso" : "Weekly progress summary"].
            map((lbl, i) =>
            <label key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: i ? "1px solid var(--line)" : "none", fontSize: 15, color: "var(--ink)" }}>
                  {lbl}
                  <input type="checkbox" defaultChecked={i < 3} style={{ width: 18, height: 18, accentColor: "var(--sage)" }} />
                </label>
            )}
              <button className="btn btn-navy" style={{ marginTop: 18 }} onClick={() => toast(t.saved)}>{t.save}</button>
            </> :

          <>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", background: "var(--surface-soft)", borderRadius: 16, border: "1px solid var(--line)", marginBottom: 18 }}>
                <div className="lic" style={{ background: "var(--navy)", color: "#fff", width: 46, height: 46 }}><Icon name="star" size={20} /></div>
                <div style={{ flex: 1 }}>
                  <b style={{ color: "var(--navy)", fontSize: 16 }}>{t.plan}</b>
                  <div style={{ color: "var(--muted)", fontSize: 13.5 }}>{t.planRenew}</div>
                </div>
                <span className="tag done">{lang === "es" ? "Activo" : "Active"}</span>
              </div>
              <button className="btn btn-ghost" onClick={() => toast(lang === "es" ? "Próximamente" : "Coming soon")}>{t.manage}</button>
            </>
          }
        </div>
      </div>
    </div>);

}

Object.assign(window, {
  Dashboard, LessonsPage, DeckPage, DrillsPage, ProgressPage,
  AccountPage, Avatar, PageHead
});