/* ============================================================
   dash-social.jsx — Class Feed, Tasks (assignments) and Live
   sessions. All content is user-generated:
     • anyone can post to the feed (text + image/video)
     • instructors create + grade assignments; students submit
     • instructors schedule live sessions; students join
   References window globals from dash-core / dash-pages.
   ============================================================ */
const { useState: uS, useRef: uR } = React;

/* read a File into a {type,url,name} media object (dataURL) */
function readFileToMedia(file) {
  return new Promise((resolve) => {
    const kind = file.type.startsWith("video") ? "video" : file.type.startsWith("image") ? "image" : "file";
    const r = new FileReader();
    r.onload = () => resolve({ type: kind, url: r.result, name: file.name, mime: file.type });
    r.onerror = () => resolve(null);
    r.readAsDataURL(file);
  });
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="empty">
      <div className="empty-ic"><Icon name={icon} size={30} /></div>
      <b>{title}</b>
      <p>{sub}</p>
      {action || null}
    </div>);
}

/* ============================================================
   CLASS FEED
   ============================================================ */
/* one post + its like / comment thread */
function PostCard({ post: p, me, instr, t, lang }) {
  const [open, setOpen] = uS(false);
  const [ctext, setCtext] = uS("");
  const inputRef = uR(null);

  const isInstr = p.role === "instructor";
  const canDeletePost = instr || p.who === me.name;
  const comments = p.comments || [];

  const toggleLike = () =>
  updatePost(p.id, { liked: !p.liked, likes: (p.likes || 0) + (p.liked ? -1 : 1) });

  const openThread = () => {
    setOpen((v) => {
      const nv = !v;
      if (nv) setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
      return nv;
    });
  };

  const sendComment = () => {
    const body = ctext.trim();
    if (!body) return;
    const c = {
      id: "c" + Date.now() + Math.random().toString(36).slice(2, 5),
      who: me.name, initials: me.initials, color: me.color,
      role: instr ? "instructor" : null, body, ts: Date.now()
    };
    updatePost(p.id, { comments: [...comments, c] });
    if (!instr) recordActivity({ points: 1 });
    setCtext("");
  };

  const delComment = (cid) => updatePost(p.id, { comments: comments.filter((c) => c.id !== cid) });

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {e.preventDefault();sendComment();}
  };

  return (
    <div className="post">
      <div className="post-head">
        <Avatar name={p.who} color={p.color || (isInstr ? "var(--navy)" : "var(--sage)")} />
        <div className="post-id">
          <b>{p.who}{isInstr ? <span className="role-badge"><Icon name="shield" size={11} /> {t.roleInstructor}</span> : null}</b>
          <small style={{ padding: "0px 0px 0px 10px" }}>{relTime(p.ts || Date.now(), lang)}</small>
        </div>
        {canDeletePost ?
        <button className="post-del" title={t.fdDelete} onClick={() => removePost(p.id)}>
            <Icon name="trash" size={16} />
          </button> :
        null}
      </div>
      {p.body ? <div className="post-body">{p.body}</div> : null}
      {p.media && p.media.length ?
      <div className={"post-media-grid n" + Math.min(p.media.length, 4)}>
          {p.media.map((m, i) =>
        m.type === "video" ?
        <video key={i} src={m.url} controls playsInline /> :
        <img key={i} src={m.url} alt="" />
        )}
        </div> :
      null}
      <div className="post-actions">
        <button className={p.liked ? "liked" : ""} onClick={toggleLike}>
          <Icon name="heart" size={17} /> {p.likes || 0}
        </button>
        <button className={open ? "on" : ""} onClick={openThread}>
          <Icon name="comment" size={17} /> {comments.length ? comments.length + " " + (comments.length === 1 ? t.commentN : t.commentsN) : t.fdComment}
        </button>
      </div>

      {open ?
      <div className="comments">
          {comments.length === 0 ?
        <div className="cm-empty">{t.noComments}</div> :
        comments.map((c) => {
          const cInstr = c.role === "instructor";
          const canDelC = instr || c.who === me.name;
          return (
            <div className="cm-row" key={c.id}>
                  <Avatar name={c.who} color={c.color || (cInstr ? "var(--navy)" : "var(--sage)")} size={30} />
                  <div className="cm-bubble">
                    <div className="cm-meta">
                      <b>{c.who}</b>
                      {cInstr ? <span className="cm-badge">{t.roleInstructor}</span> : null}
                      <small>{relTime(c.ts || Date.now(), lang)}</small>
                      {canDelC ?
                  <button className="cm-del" title={t.fdDelComment} onClick={() => delComment(c.id)}><Icon name="close" size={12} /></button> :
                  null}
                    </div>
                    <p>{c.body}</p>
                  </div>
                </div>);
        })}

          <div className="cm-compose">
            <Avatar name={me.name} color={me.color} size={30} />
            <input ref={inputRef} className="cm-input" value={ctext} placeholder={t.commentPh}
          onChange={(e) => setCtext(e.target.value)} onKeyDown={onKey} />
            <button className="cm-send" onClick={sendComment} disabled={!ctext.trim()} aria-label={t.fdReply}>
              <Icon name="send" size={16} />
            </button>
          </div>
        </div> :
      null}
    </div>);
}

function FeedPage({ t, lang, go, toast }) {
  const posts = useFeed();
  const role = useRole();
  const me = currentUser();
  const instr = role === "instructor";
  const [text, setText] = uS("");
  const [media, setMedia] = uS([]);
  const [busy, setBusy] = uS(false);
  const fileRef = uR(null);

  const pickFiles = async (e) => {
    const files = [...e.target.files].slice(0, 4);
    setBusy(true);
    const out = [];
    for (const f of files) {const m = await readFileToMedia(f);if (m) out.push(m);}
    setMedia((prev) => [...prev, ...out].slice(0, 4));
    setBusy(false);
    e.target.value = "";
  };

  const submit = () => {
    if (!text.trim() && media.length === 0) return;
    addPost({
      who: me.name, initials: me.initials, color: me.color,
      role: instr ? "instructor" : null,
      body: text.trim(), media, likes: 0, liked: false, ts: Date.now()
    });
    if (!instr) recordActivity({ points: 2 });
    setText("");setMedia([]);
    toast(lang === "es" ? "Publicado" : "Posted");
  };

  const ordered = posts;

  return (
    <div className="view-enter">
      <PageHead t={t} title={t.pFeed} sub={t.pFeedSub} />
      <div className="feed">
        {/* Composer */}
        <div className="composer-card">
          <div className="composer-top">
            <Avatar name={me.name} color={me.color} size={42} />
            <textarea className="composer-area" rows={2} value={text}
            onChange={(e) => setText(e.target.value)} placeholder={t.shareSomething} />
          </div>

          {media.length ?
          <div className="composer-media">
              {media.map((m, i) =>
            <div className="cm-thumb" key={i}>
                  {m.type === "video" ?
              <video src={m.url} muted /> :
              <img src={m.url} alt="" />}
                  <button className="cm-x" onClick={() => setMedia((p) => p.filter((_, j) => j !== i))}>
                    <Icon name="close" size={13} />
                  </button>
                </div>
            )}
            </div> :
          null}

          <div className="composer-foot">
            <div className="composer-tools">
              <button className="tool" onClick={() => fileRef.current && fileRef.current.click()}>
                <Icon name="image" size={18} /> {t.fdPhoto}
              </button>
              <button className="tool" onClick={() => fileRef.current && fileRef.current.click()}>
                <Icon name="video" size={18} /> {t.fdVideo}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={pickFiles} />
            </div>
            <button className="btn btn-navy" onClick={submit} disabled={busy || !text.trim() && !media.length}>
              {busy ? <span className="spinner sm" /> : <Icon name="send" size={15} />} {t.fdPost}
            </button>
          </div>
        </div>

        {/* Posts */}
        {ordered.length === 0 ?
        <EmptyState icon="feed" title={t.fdEmpty} sub={t.fdEmptySub} /> :

        ordered.map((p) =>
        <PostCard key={p.id} post={p} me={me} instr={instr} t={t} lang={lang} />
        )
        }
      </div>
    </div>);
}

/* ============================================================
   ANNOUNCEMENTS — separate from the social feed.
   Instructors post; students read. Each announcement lives for one
   week, then drops off automatically (handled by the store).
   ============================================================ */
function annDaysLeft(ts) {
  return Math.max(0, Math.ceil((ANNOUNCE_TTL - (Date.now() - (ts || 0))) / 864e5));
}

function AnnouncementCard({ a, t, lang, instr }) {
  const left = annDaysLeft(a.ts);
  return (
    <div className="announce-card">
      <span className="ann-accent" />
      <div className="ann-body">
        <div className="ann-head">
          <Avatar name={a.who} color={a.color || "var(--navy)"} size={40} />
          <div className="ann-id">
            <b>{a.who}<span className="role-badge"><Icon name="shield" size={11} /> {t.roleInstructor}</span></b>
            <small>{relTime(a.ts || Date.now(), lang)}</small>
          </div>
          {instr ?
          <button className="post-del" title={t.annDelete} onClick={() => removeAnnouncement(a.id)}>
              <Icon name="trash" size={16} />
            </button> :
          null}
        </div>
        {a.title ? <div className="ann-title">{a.title}</div> : null}
        {a.body ? <div className="ann-text">{a.body}</div> : null}
        <div className="ann-foot">
          <span className="ann-expiry">
            <Icon name="clock" size={13} /> {left <= 0 ? t.annExpiresToday : `${t.annExpires} ${left}${t.annDay}`}
          </span>
        </div>
      </div>
    </div>);
}

function AnnouncementComposer({ t, lang, toast }) {
  const [title, setTitle] = uS("");
  const [body, setBody] = uS("");
  const me = currentUser();
  const post = () => {
    if (!body.trim()) return;
    addAnnouncement({ who: me.name, initials: me.initials, color: me.color, title: title.trim(), body: body.trim() });
    setTitle(""); setBody("");
    toast && toast(lang === "es" ? "Anuncio publicado" : "Announcement posted");
  };
  return (
    <div className="ann-composer">
      <input className="ann-title-input" value={title} maxLength={90}
        onChange={(e) => setTitle(e.target.value)} placeholder={t.annTitlePh} />
      <textarea className="ann-body-input" rows={3} value={body}
        onChange={(e) => setBody(e.target.value)} placeholder={t.annComposePh} />
      <div className="ann-composer-foot">
        <span className="ann-ttl-note"><Icon name="clock" size={13} /> {t.annTtlNote}</span>
        <button className="btn btn-navy" onClick={post} disabled={!body.trim()}>
          <Icon name="megaphone" size={15} /> {t.annPost}
        </button>
      </div>
    </div>);
}

function AnnouncementsPage({ t, lang, go, toast }) {
  const list = useAnnouncements();
  const role = useRole();
  const instr = role === "instructor";
  const sorted = [...list].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return (
    <div className="view-enter">
      <PageHead t={t} title={t.pAnnounce} sub={instr ? t.pAnnounceSubInstr : t.pAnnounceSubStu} />
      {instr ? <AnnouncementComposer t={t} lang={lang} toast={toast} /> : null}
      {sorted.length === 0 ?
      <EmptyState icon="megaphone" title={instr ? t.annEmptyInstr : t.annEmptyStu}
        sub={instr ? t.annEmptyInstrSub : t.annEmptyStuSub} /> :

      <div className="ann-list">
          {sorted.map((a) => <AnnouncementCard key={a.id} a={a} t={t} lang={lang} instr={instr} />)}
        </div>
      }
    </div>);
}

/* ============================================================
   TASKS / ASSIGNMENTS
   ============================================================ */
function TaskComposer({ t, lang, onClose }) {
  const [title, setTitle] = uS("");
  const [desc, setDesc] = uS("");
  const [due, setDue] = uS("");
  const [points, setPoints] = uS(100);
  const create = () => {
    if (!title.trim()) return;
    addAssignment({ title: title.trim(), desc: desc.trim(), due: due ? new Date(due).getTime() : 0, points: +points || 100 });
    onClose();
  };
  return (
    <div className="form-card">
      <div className="form-row">
        <label>{t.taskTitleL}</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={lang === "es" ? "p. ej. Escribe un diálogo: pedir café" : "e.g. Write a dialogue: ordering coffee"} autoFocus />
      </div>
      <div className="form-row">
        <label>{t.taskDescL}</label>
        <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={lang === "es" ? "Instrucciones para los estudiantes…" : "Instructions for students…"} />
      </div>
      <div className="form-grid2">
        <div className="form-row">
          <label>{t.taskDueL}</label>
          <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div className="form-row">
          <label>{t.taskPointsL}</label>
          <input type="number" min="0" value={points} onChange={(e) => setPoints(e.target.value)} />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onClose}>{t.cancel}</button>
        <button className="btn btn-navy" onClick={create} disabled={!title.trim()}><Icon name="plus" size={15} /> {t.createTask}</button>
      </div>
    </div>);
}

/* student-facing submit box */
function SubmitBox({ t, lang, a }) {
  const [text, setText] = uS(a.submission ? a.submission.text : "");
  const [files, setFiles] = uS(a.submission ? a.submission.files || [] : []);
  const [editing, setEditing] = uS(!a.submission);
  const [busy, setBusy] = uS(false);
  const fileRef = uR(null);

  const pick = async (e) => {
    const list = [...e.target.files].slice(0, 5);
    setBusy(true);
    const out = [];
    for (const f of list) {const m = await readFileToMedia(f);if (m) out.push(m);}
    setFiles((p) => [...p, ...out].slice(0, 5));
    setBusy(false);e.target.value = "";
  };
  const turnIn = () => {
    if (!text.trim() && files.length === 0) return;
    updateAssignment(a.id, { submission: { text: text.trim(), files, at: Date.now() } });
    recordActivity({ points: 8, goal: 1 });
    setEditing(false);
  };

  if (a.grade) {
    return (
      <div className="sub-graded">
        <div className="grade-pill"><Icon name="star" size={15} /> {a.grade.score}/{a.points}</div>
        {a.submission ? <div className="sub-text">{a.submission.text}</div> : null}
        {a.submission && a.submission.files && a.submission.files.length ? <FileChips files={a.submission.files} /> : null}
        {a.grade.feedback ?
        <div className="fb-block">
            <span className="fb-label"><Icon name="shield" size={13} /> {t.instrFeedback}</span>
            <p>{a.grade.feedback}</p>
          </div> :
        null}
      </div>);
  }

  if (a.submission && !editing) {
    return (
      <div className="sub-done">
        <div className="sub-status"><Icon name="check" size={15} /> {t.submitted} · <span className="muted">{t.awaiting}</span></div>
        {a.submission.text ? <div className="sub-text">{a.submission.text}</div> : null}
        {a.submission.files && a.submission.files.length ? <FileChips files={a.submission.files} /> : null}
        <button className="link-btn" onClick={() => setEditing(true)}>{t.resubmit}</button>
      </div>);
  }

  return (
    <div className="submit-box">
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.yourResponse} />
      {files.length ? <FileChips files={files} onRemove={(i) => setFiles((p) => p.filter((_, j) => j !== i))} /> : null}
      <div className="submit-foot">
        <button className="tool" onClick={() => fileRef.current && fileRef.current.click()}>
          {busy ? <span className="spinner sm" /> : <Icon name="paperclip" size={16} />} {t.attach}
        </button>
        <input ref={fileRef} type="file" multiple hidden onChange={pick} />
        <button className="btn btn-navy" onClick={turnIn} disabled={!text.trim() && !files.length}>
          <Icon name="check" size={15} /> {t.submitBtn}
        </button>
      </div>
    </div>);
}

function FileChips({ files, onRemove }) {
  return (
    <div className="file-chips">
      {files.map((f, i) =>
      <a className="file-chip" key={i} href={f.url} download={f.name} title={f.name} onClick={(e) => {if (!f.url) e.preventDefault();}}>
          <Icon name={f.type === "image" ? "image" : f.type === "video" ? "video" : "paperclip"} size={14} />
          <span>{f.name || "file"}</span>
          {onRemove ? <button className="chip-x" onClick={(e) => {e.preventDefault();onRemove(i);}}><Icon name="close" size={11} /></button> : null}
        </a>
      )}
    </div>);
}

/* instructor-facing grading box */
function GradeBox({ t, lang, a }) {
  const [open, setOpen] = uS(false);
  const [score, setScore] = uS(a.grade ? a.grade.score : "");
  const [fb, setFb] = uS(a.grade ? a.grade.feedback : "");
  const save = () => {
    updateAssignment(a.id, { grade: { score: +score || 0, feedback: fb.trim(), at: Date.now() } });
    setOpen(false);
  };

  return (
    <div className="grade-area">
      {a.submission ?
      <div className="review">
          <div className="review-head"><Icon name="check" size={14} /> {t.reviewWork}</div>
          {a.submission.text ? <div className="sub-text">{a.submission.text}</div> : null}
          {a.submission.files && a.submission.files.length ? <FileChips files={a.submission.files} /> : null}
        </div> :

      <div className="no-sub"><Icon name="clock" size={14} /> {t.noSubmission}</div>
      }

      {a.grade && !open ?
      <div className="graded-row">
          <div className="grade-pill"><Icon name="star" size={15} /> {a.grade.score}/{a.points}</div>
          {a.grade.feedback ? <p className="fb-inline">{a.grade.feedback}</p> : null}
          <button className="link-btn" onClick={() => setOpen(true)}>{lang === "es" ? "Editar" : "Edit"}</button>
        </div> :

      (open || !a.grade) && a.submission ?
      <div className="grade-form">
            <div className="grade-score">
              <label>{t.scoreL}</label>
              <input type="number" min="0" max={a.points} value={score} onChange={(e) => setScore(e.target.value)} />
              <span className="of">/ {a.points}</span>
            </div>
            <textarea rows={2} value={fb} onChange={(e) => setFb(e.target.value)} placeholder={t.feedbackPh} />
            <button className="btn btn-navy" onClick={save} disabled={score === ""}><Icon name="check" size={15} /> {t.saveGrade}</button>
          </div> :
      null
      }
    </div>);
}

function AssignmentsPage({ t, lang, go, toast }) {
  const list = useAssignments();
  const role = useRole();
  const me = currentUser();
  const instr = role === "instructor";
  const [composing, setComposing] = uS(false);

  const fmtDue = (a) => a.due ? fmtWhen(a.due, lang) : t.noDue;

  return (
    <div className="view-enter">
      <div className="page-head-row">
        <PageHead t={t} title={t.pAssign} sub={instr ? lang === "es" ? "Crea y califica las tareas de tu clase." : "Create and grade your class's work." : t.pAssignSub} />
        {instr ?
        <button className="btn btn-navy hd-btn" onClick={() => setComposing((v) => !v)}>
            <Icon name={composing ? "close" : "plus"} size={16} /> {composing ? t.cancel : t.newTask}
          </button> :
        null}
      </div>

      {instr && composing ? <TaskComposer t={t} lang={lang} onClose={() => setComposing(false)} /> : null}

      {list.length === 0 ?
      <EmptyState icon="task" title={t.noTasks} sub={instr ? t.noTasksInstr : t.noTasksStu}
      action={instr && !composing ? <button className="btn btn-navy" onClick={() => setComposing(true)}><Icon name="plus" size={15} /> {t.newTask}</button> : null} /> :

      <div className="task-list">
          {list.map((a) =>
        <div className="task-card" key={a.id}>
              <div className="task-top">
                <div className="task-ic"><Icon name="task" size={20} /></div>
                <div className="task-meta">
                  <b>{a.title}</b>
                  <span className="task-due">
                    <Icon name="clock" size={13} /> {t.dueLabel}: {fmtDue(a)} · {a.points} {t.taskPointsL.toLowerCase()}
                  </span>
                </div>
                {instr ?
            <button className="post-del" title={t.deleteTask} onClick={() => removeAssignment(a.id)}><Icon name="trash" size={16} /></button> :

            a.grade ? <span className="tag graded">{t.gradedBy}</span> :
            a.submission ? <span className="tag soon">{t.submitted}</span> :
            <span className="tag todo">{t.notTurnedIn}</span>
            }
              </div>
              {a.desc ? <p className="task-desc">{a.desc}</p> : null}
              {instr ? <GradeBox t={t} lang={lang} a={a} /> : <SubmitBox t={t} lang={lang} a={a} />}
            </div>
        )}
        </div>
      }
    </div>);
}

/* ============================================================
   LIVE SESSIONS
   ============================================================ */
function SessionComposer({ t, lang, onClose }) {
  const [title, setTitle] = uS("");
  const [when, setWhen] = uS("");
  const [dur, setDur] = uS(50);
  const [link, setLink] = uS("");
  const create = () => {
    if (!title.trim() || !when) return;
    addMeeting({ title: title.trim(), when: new Date(when).getTime(), durationMin: +dur || 30, link: link.trim(), recordingUrl: "" });
    onClose();
  };
  return (
    <div className="form-card">
      <div className="form-row">
        <label>{t.sessTitleL}</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={lang === "es" ? "p. ej. Círculo de conversación · Hacer planes" : "e.g. Conversation Circle · Making Plans"} autoFocus />
      </div>
      <div className="form-grid2">
        <div className="form-row">
          <label>{t.sessWhenL}</label>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </div>
        <div className="form-row">
          <label>{t.sessDurL}</label>
          <input type="number" min="5" step="5" value={dur} onChange={(e) => setDur(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <label>{t.sessLinkL}</label>
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://teams.microsoft.com/…" />
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onClose}>{t.cancel}</button>
        <button className="btn btn-navy" onClick={create} disabled={!title.trim() || !when}><Icon name="calendar" size={15} /> {t.createSession}</button>
      </div>
    </div>);
}

function RecordingAdder({ t, m }) {
  const [open, setOpen] = uS(false);
  const [url, setUrl] = uS(m.recordingUrl || "");
  if (!open) return <button className="link-btn" onClick={() => setOpen(true)}><Icon name="link" size={13} /> {m.recordingUrl ? t.recordingL : t.addRecording}</button>;
  return (
    <div className="rec-add">
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      <button className="btn btn-navy sm" onClick={() => {updateMeeting(m.id, { recordingUrl: url.trim() });setOpen(false);}}><Icon name="check" size={14} /></button>
    </div>);
}

function MeetingsPage({ t, lang, go, toast }) {
  const list = useMeetings();
  const role = useRole();
  const me = currentUser();
  const instr = role === "instructor";
  const [composing, setComposing] = uS(false);
  const now = Date.now();

  const upcoming = list.filter((m) => (m.when || 0) + (m.durationMin || 0) * 60000 >= now).sort((a, b) => a.when - b.when);
  const past = list.filter((m) => (m.when || 0) + (m.durationMin || 0) * 60000 < now).sort((a, b) => b.when - a.when);

  const join = (m) => {
    if (m.link) window.open(m.link, "_blank");else
    toast(lang === "es" ? "Sin enlace aún" : "No link yet");
  };

  return (
    <div className="view-enter">
      <div className="page-head-row">
        <PageHead t={t} title={t.pMeet} sub={instr ? lang === "es" ? "Programa clases en vivo para tu cohorte." : "Schedule live classes for your cohort." : t.pMeetSub} />
        {instr ?
        <button className="btn btn-navy hd-btn" onClick={() => setComposing((v) => !v)}>
            <Icon name={composing ? "close" : "plus"} size={16} /> {composing ? t.cancel : t.newSession}
          </button> :
        null}
      </div>

      {instr && composing ? <SessionComposer t={t} lang={lang} onClose={() => setComposing(false)} /> : null}

      {list.length === 0 ?
      <EmptyState icon="video" title={t.noSessions} sub={instr ? t.noSessInstr : t.noSessStu}
      action={instr && !composing ? <button className="btn btn-navy" onClick={() => setComposing(true)}><Icon name="plus" size={15} /> {t.newSession}</button> : null} /> :

      <>
          {upcoming.length ? <div className="sec-h"><h2>{t.upcomingClasses}</h2></div> : null}
          <div className="grid" style={{ gap: 14, marginBottom: past.length ? 30 : 0 }}>
            {upcoming.map((m) => {
            const soon = m.when - now < 36e5 && m.when - now > -((m.durationMin || 0) * 60000);
            return (
              <div className="card sess-card" key={m.id}>
                  <div className="lic live" style={{ width: 48, height: 48 }}><TeamsMark size={24} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 16, color: "var(--navy)", display: "block" }}>{m.title}</b>
                    <span style={{ color: "var(--muted)", fontSize: 13.5 }}>
                      <Icon name="clock" size={13} /> {fmtWhen(m.when, lang)} · {m.durationMin} {t.minShort} · {t.hostedBy} {m.host}
                    </span>
                  </div>
                  {soon ? <span className="tag soon">{lang === "es" ? "Próxima" : "Up next"}</span> : null}
                  <button className="btn btn-teams" onClick={() => join(m)}><TeamsMark size={16} /> {t.joinTeams}</button>
                  {instr ? <button className="post-del" title={t.deleteSession} onClick={() => removeMeeting(m.id)}><Icon name="trash" size={16} /></button> : null}
                </div>);
          })}
          </div>

          {past.length ? <div className="sec-h"><h2>{t.pastClasses}</h2></div> : null}
          {past.length ?
        <div className="card col-12">
              {past.map((m) =>
          <div className="lrow" key={m.id}>
                  <div className="lic live"><Icon name="video" size={19} /></div>
                  <div className="lmain"><b>{m.title}</b><span>{fmtWhen(m.when, lang)} · {m.durationMin} {t.minShort}</span></div>
                  {m.recordingUrl ?
            <button className="btn btn-ghost" onClick={() => window.open(m.recordingUrl, "_blank")}><Icon name="play" size={15} /> {t.watch}</button> :
            instr ? <RecordingAdder t={t} m={m} /> : <span className="muted" style={{ fontSize: 13 }}>{lang === "es" ? "Sin grabación" : "No recording"}</span>}
                  {instr ? <button className="post-del" title={t.deleteSession} onClick={() => removeMeeting(m.id)}><Icon name="trash" size={16} /></button> : null}
                </div>
          )}
            </div> :
        null}
        </>
      }
    </div>);
}

Object.assign(window, { FeedPage, AnnouncementsPage, AssignmentsPage, MeetingsPage });