const { useState, useRef, useEffect, useCallback } = React;

/* ---------------- Icons ---------------- */
function Icon({ name, size = 22, stroke = 2 }) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round"
  };
  switch (name) {
    case "search":return <svg {...p}><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>;
    case "mic":return <svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><line x1="12" y1="18" x2="12" y2="21" /></svg>;
    case "swap":return <svg {...p}><path d="M7 4 3 8l4 4" /><path d="M3 8h14" /><path d="m17 20 4-4-4-4" /><path d="M21 16H7" /></svg>;
    case "globe":return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" /></svg>;
    case "speaker":return <svg {...p}><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 6a9 9 0 0 1 0 12" /></svg>;
    case "lock":return <svg {...p}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case "bookmark":return <svg {...p}><path d="M6 4h12v16l-6-4-6 4V4Z" /></svg>;
    case "spark":return <svg {...p}><path d="M12 2.5 14 9.6 21 12 14 14.4 12 21.5 10 14.4 3 12 10 9.6Z" /></svg>;
    case "chat":return <svg {...p}><path d="M4 5h16v11H8l-4 4V5Z" /></svg>;
    case "check":return <svg {...p}><path d="m5 12 4.5 4.5L19 7" /></svg>;
    case "close":return <svg {...p}><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>;
    case "shield":return <svg {...p}><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /></svg>;
    case "play":return <svg {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5z" /></svg>;
    case "phone":return <svg {...p}><path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L15.5 12l4 1.5v3a2 2 0 0 1-2.2 2A15 15 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" /></svg>;
    default:return null;
  }
}

/* ---------------- Copy (EN / ES) ---------------- */
const STR = {
  en: {
    conjugate: "Conjugate", login: "Log in", langName: "ES",
    eyebrow: "The Corporate English Project",
    h1a: "Translate now.", h1pre: "At last, ", h1b: "embody", h1c: " English.",
    sub: "Instant Spanish \u21C4 English, built for learners.",
    placeholder: "Found a new word? Translate it into English or Spanish",
    go: "Translate", auto: "Detect language", dirTo: "to",
    quick: ["aprovechar", "to look forward to", "echar de menos", "hindsight"],
    quickLabel: "Try:",
    free: "Free", pro: "Pro",
    examples: "In a sentence", source: "You searched",
    listen: "Listen", listening: "Playing",
    gateTitle: "Go further with this word",
    gateSub: "Translation, definitions and audio are always free. Unlock natural usage and live practice with Pro.",
    idiomsTitle: "Idioms & natural usage",
    practiceTitle: "Practice this in conversation",
    practiceBlur: "Start a guided role-play that uses this word the way a native speaker would \u2014 with instant feedback on tone, register and grammar.",
    unlock: "Unlock with Pro",
    save: "Save to my study deck",
    tryPro: "Start free trial",
    newSearch: "New search",
    err: "Couldn't reach the translator just now. Please try again.",
    // value strip
    vsFreeTitle: "Free", vsFreePrice: "No account \u00b7 forever",
    vsFree: ["Spanish \u21C4 English translation", "Dictionary definitions & part of speech", "Single-word audio pronunciation"],
    vsProTitle: "Pro", vsProPrice: "$9 USD / month",
    vsPro: ["Everything in Free", "Idioms & natural-usage notes", "Conversational practice with feedback", "Personalized, adaptive study decks", "Immersion tracks & kids modules"],
    vsFreeCta: "Keep using free", vsProCta: "Start 7-day free trial",
    // modal
    mSaveTitle: "Save to your study deck",
    mSaveLead: "Create a free account to build your personal vocabulary and pick up where you left off.",
    mProTitle: "Unlock Pro",
    mProLead: "Create your account to start a 7-day free trial \u2014 idioms, conversation practice and adaptive decks.",
    email: "Email", password: "Password", create: "Create account",
    orcont: "or", google: "Continue with Google",
    haveAcct: "New to the CEP?", loginLink: "Go pro",
    reassure: "No credit card needed",
    savedToast: "Saved \u2014 create an account to keep it",
    acctToast: "Account created (demo)",
    // story sections
    ethosTitle: "Ethos",
    ethos1: "The Corporate English Project is a holistic English-language learning initiative rooted in the Latin concept of corpus, or body \u2014 the idea that language is a whole body of communication, not a collection of isolated skills. The goal is to develop complete communicators \u2014 not just grammar students or conversation practitioners, but individuals who can read, write, speak, listen, and think in English with confidence.",
    ethos2: "Language is inherently communal. True fluency requires not just technical knowledge but the ability to communicate with others in real time, across topics, levels, and contexts. The CEP is built on the belief that the best learning happens when students are immersed in the full experience of the language \u2014 together.",
    founderTitle: "Our Founder",
    founderKicker: "Meet Abril",
    founderBio: "Abril is a Texas native and native English speaker with a Bachelor of Arts in Philosophy from the University of Texas at Austin. She has over 15 years of experience helping Spanish-speaking family members develop their English communication skills, has volunteered as a Spanish interpreter for pro bono legal services, and studied paralegal studies and American law at her local community college. She is currently based in EdoM\u00e9x, Mexico, where she is pursuing law school while building The Corporate English Project from the ground up.",
    founderVideoCap: "Founder intro \u00b7 video coming soon",
    contactTitle: "Contact",
    scanMe: "scan me",
    formHead: "Leave your contact information",
    formSub: "and I\u2019ll reach out soon",
    fFullName: "Full name", fCell: "Cell", fEmail: "Email", fOr: "or", fSubmit: "Submit",
    contactToast: "Thanks \u2014 I\u2019ll reach out soon",
    footer: "\u00a9 The Corporate English Project \u00b7 CEP \u00b7 M\u00e9xico, M\u00e9xico"
  },
  es: {
    conjugate: "Conjugar", login: "Entrar", langName: "EN",
    eyebrow: "The Corporate English Project",
    h1a: "Tradúcelo ya.", h1pre: "Por fin, ", h1b: "encarna", h1c: " el inglés.",
    sub: "Español \u21C4 inglés al instante, para quienes aprenden.",
    placeholder: "¿Una palabra nueva? Tradúcela al inglés o al español",
    go: "Traducir", auto: "Detectar idioma", dirTo: "a",
    quick: ["aprovechar", "to look forward to", "echar de menos", "hindsight"],
    quickLabel: "Prueba:",
    free: "Gratis", pro: "Pro",
    examples: "En una frase", source: "Buscaste",
    listen: "Escuchar", listening: "Reproduciendo",
    gateTitle: "Profundiza en esta palabra",
    gateSub: "La traducción, las definiciones y el audio siempre son gratis. Desbloquea el uso natural y la práctica en vivo con Pro.",
    idiomsTitle: "Modismos y uso natural",
    practiceTitle: "Practica esto en una conversación",
    practiceBlur: "Inicia un juego de roles guiado que usa esta palabra como lo haría un nativo \u2014 con correcciones al instante de tono, registro y gramática.",
    unlock: "Desbloquear con Pro",
    save: "Guardar en mi mazo de estudio",
    tryPro: "Prueba gratis",
    newSearch: "Nueva búsqueda",
    err: "No pudimos conectar con el traductor. Inténtalo de nuevo.",
    vsFreeTitle: "Gratis", vsFreePrice: "Sin cuenta \u00b7 para siempre",
    vsFree: ["Traducción español \u21C4 inglés", "Definiciones y categoría gramatical", "Pronunciación en audio de palabras"],
    vsProTitle: "Pro", vsProPrice: "$9 USD / mes",
    vsPro: ["Todo lo de Gratis", "Modismos y notas de uso natural", "Práctica conversacional con correcciones", "Mazos de estudio personalizados", "Rutas de inmersión y módulos para niños"],
    vsFreeCta: "Seguir gratis", vsProCta: "Prueba de 7 días gratis",
    mSaveTitle: "Guarda en tu mazo de estudio",
    mSaveLead: "Crea una cuenta gratis para armar tu vocabulario personal y continuar donde lo dejaste.",
    mProTitle: "Desbloquea Pro",
    mProLead: "Crea tu cuenta para empezar una prueba de 7 días \u2014 modismos, práctica conversacional y mazos adaptativos.",
    email: "Correo", password: "Contraseña", create: "Crear cuenta",
    orcont: "o", google: "Continuar con Google",
    haveAcct: "¿Nuevo en el CEP?", loginLink: "Hazte Pro",
    reassure: "Sin tarjeta de crédito",
    savedToast: "Guardado \u2014 crea una cuenta para conservarlo",
    acctToast: "Cuenta creada (demo)",
    // story sections
    ethosTitle: "Ethos",
    ethos1: "The Corporate English Project es una iniciativa integral de aprendizaje del ingl\u00e9s con ra\u00edz en el concepto latino de corpus, o cuerpo: la idea de que el idioma es un cuerpo completo de comunicaci\u00f3n, no una colecci\u00f3n de habilidades aisladas. La meta es formar comunicadores completos \u2014 no solo estudiantes de gram\u00e1tica o practicantes de conversaci\u00f3n, sino personas capaces de leer, escribir, hablar, escuchar y pensar en ingl\u00e9s con confianza.",
    ethos2: "El lenguaje es comunal por naturaleza. La verdadera fluidez no requiere solo conocimiento t\u00e9cnico, sino la capacidad de comunicarse con otros en tiempo real, a trav\u00e9s de temas, niveles y contextos. El CEP se basa en la creencia de que el mejor aprendizaje ocurre cuando los estudiantes se sumergen en la experiencia completa del idioma \u2014 juntos.",
    founderTitle: "Nuestra Fundadora",
    founderKicker: "Conoce a Abril",
    founderBio: "Abril es originaria de Texas y hablante nativa de ingl\u00e9s, con una Licenciatura en Filosof\u00eda por la Universidad de Texas en Austin. Tiene m\u00e1s de 15 a\u00f1os de experiencia ayudando a familiares hispanohablantes a desarrollar sus habilidades de comunicaci\u00f3n en ingl\u00e9s, ha sido voluntaria como int\u00e9rprete de espa\u00f1ol para servicios legales pro bono y estudi\u00f3 asistencia legal y derecho estadounidense en su colegio comunitario. Actualmente vive en EdoM\u00e9x, M\u00e9xico, donde cursa la carrera de derecho mientras construye The Corporate English Project desde cero.",
    founderVideoCap: "Presentaci\u00f3n \u00b7 video pr\u00f3ximamente",
    contactTitle: "Contacto",
    scanMe: "escan\u00e9ame",
    formHead: "D\u00e9jame tus datos de contacto",
    formSub: "y te escribo pronto",
    fFullName: "Nombre completo", fCell: "Celular", fEmail: "Correo", fOr: "o", fSubmit: "Enviar",
    contactToast: "\u00a1Gracias \u2014 te escribo pronto!",
    footer: "\u00a9 The Corporate English Project \u00b7 CEP \u00b7 M\u00e9xico, M\u00e9xico"
  }
};

/* ---------------- Translation engine ---------------- */
async function translatePhrase(input, forced) {
  const dirNote = forced === "en2es" ?
  "The input is English; translate INTO Spanish." :
  forced === "es2en" ?
  "The input is Spanish; translate INTO English." :
  "Detect whether the input is Spanish or English. If Spanish, translate into English; if English, translate into Spanish.";
  const prompt =
  `You are a careful bilingual Spanish<->English dictionary for language learners.
${dirNote}
Input: """${input}"""

Reply with STRICT JSON only, no markdown, no commentary. Shape:
{
 "sourceLang": "en" | "es",
 "targetLang": "en" | "es",
 "translation": "the best translation of the input in the target language",
 "partOfSpeech": "short part of speech or grammatical note, or empty string for phrases",
 "register": "neutral" | "formal" | "informal" | "colloquial",
 "pronunciation": "simple phonetic respelling of the TRANSLATION (not IPA)",
 "examples": [ {"source":"natural sentence in the SOURCE language using the input","target":"its translation in the TARGET language"} ],
 "idioms": [ {"phrase":"a related idiom or natural collocation in the target language","meaning":"plain-language meaning","example":"short example sentence"} ],
 "note": "one short tip on natural usage (max 18 words)"
}
Give exactly 2 examples and exactly 2 idioms. Keep everything concise and accurate.`;

  const raw = await window.claude.complete(prompt);
  let txt = (raw || "").trim();
  const fence = txt.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) txt = fence[1].trim();
  const s = txt.indexOf("{"),e = txt.lastIndexOf("}");
  if (s !== -1 && e !== -1) txt = txt.slice(s, e + 1);
  const data = JSON.parse(txt);
  data.input = input;
  return data;
}

function speak(text, lang) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-ES" : "en-US";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
    return u;
  } catch (e) {/* ignore */}
}

/* ---------------- Components ---------------- */
function Nav({ t, lang, setLang, onLogin, onHome, glowColor }) {
  return (
    <nav className="nav">
      <a className="nav-logo" href="#" onClick={onHome} aria-label="Back to start">
        <img src="assets/logo-navy.png" alt="The Corporate English Project" />
      </a>
      <div className="nav-right">
        <div className="lang-toggle" role="group" aria-label="Language">
          <Icon name="globe" size={17} stroke={2} />
          <button className="seg" onClick={() => setLang("en")}
          style={segStyle(lang === "en")}>EN</button>
          <button className="seg" onClick={() => setLang("es")}
          style={segStyle(lang === "es")}>ES</button>
        </div>
        <button className="nav-link hide-sm" onClick={(e) => e.preventDefault()}>{t.conjugate}</button>
        <button className="btn-login" onClick={onLogin}>{t.login}</button>
      </div>
    </nav>);

}
function segStyle(active) {
  return {
    border: "none", background: active ? "var(--navy)" : "transparent",
    color: active ? "#fff" : "var(--navy-soft)", borderRadius: 999,
    padding: "4px 11px", fontWeight: 700, fontSize: 13, transition: "all .15s"
  };
}

function SearchBar({ t, value, setValue, onGo, busy, dir, cycleDir, listening, onMic }) {
  const dirText = dir === "en2es" ? "EN \u2192 ES" : dir === "es2en" ? "ES \u2192 EN" : t.auto;
  return (
    <div className="searchwrap">
      <form className="searchbar" onSubmit={(e) => {e.preventDefault();onGo();}}>
        <span className="ico"><Icon name="search" size={24} /></span>
        <input
          autoFocus value={value} onChange={(e) => setValue(e.target.value)}
          placeholder={t.placeholder} aria-label={t.placeholder} spellCheck="false" style={{ height: "5px", width: "46px" }} />
        
        <button type="button" className={"icon-btn mic" + (listening ? " live" : "")} onClick={onMic} aria-label="Voice input">
          <Icon name="mic" size={22} />
        </button>
        <button type="submit" className="btn-go" disabled={busy || !value.trim()}>
          {busy ? <span className="spinner" style={{ width: 18, height: 18, borderColor: "rgba(255,255,255,.4)", borderTopColor: "#fff" }} /> : <Icon name="search" size={18} stroke={2.4} />}
          <span className="lbl">{t.go}</span>
        </button>
      </form>
      <div className="dir-row">
        <button className="dir-chip" onClick={cycleDir} title="Change translation direction">
          <span className="swap"><Icon name="swap" size={16} /></span>{dirText}
        </button>
      </div>
    </div>);

}

function LockedCard({ t, icon, title, children, onUnlock }) {
  return (
    <div className="locked" onClick={onUnlock}>
      <h4><Icon name={icon} size={17} /> {title} <span className="pill pro" style={{ marginLeft: "auto" }}>Pro</span></h4>
      <div className="blurpv">{children}</div>
      <div className="lockcta"><Icon name="lock" size={15} /> {t.unlock}</div>
    </div>);

}

function Result({ t, data, onSave, onPro, onNew }) {
  const [playing, setPlaying] = useState(false);
  const tgt = data.targetLang || "en";
  const src = data.sourceLang || "es";
  const langWord = (l) => l === "es" ? t === STR.es ? "Español" : "Spanish" : t === STR.es ? "Inglés" : "English";
  const onListen = () => {
    const u = speak(data.translation, tgt);
    if (!u) return;
    setPlaying(true);
    u.onend = () => setPlaying(false);
    setTimeout(() => setPlaying(false), 4000);
  };
  return (
    <div className="result">
      <div className="card">
        <div className="card-head">
          <div className="src-echo">{t.source}: <b>{data.input}</b> &nbsp;·&nbsp; {langWord(src)} <Icon name="swap" size={13} /> {langWord(tgt)}</div>
          {data.register ? <span className="pill">{data.register}</span> : <span className="pill free">{t.free}</span>}
        </div>
        <div className="card-body">
          <div className="trans-row">
            <div style={{ flex: 1 }}>
              <div className="trans">{data.translation}</div>
              {data.partOfSpeech ? <div className="pos">{data.partOfSpeech}</div> : null}
              {data.pronunciation ? <div className="phon">/{data.pronunciation}/</div> : null}
              <button className={"speak" + (playing ? " playing" : "")} onClick={onListen}>
                {playing ?
                <span className="eqbars"><span></span><span></span><span></span></span> :
                <Icon name="speaker" size={16} />}
                {playing ? t.listening : t.listen}
                <span className="pill free" style={{ marginLeft: 4 }}>{t.free}</span>
              </button>
            </div>
          </div>

          {Array.isArray(data.examples) && data.examples.length ?
          <>
              <div className="sec-label">{t.examples}</div>
              {data.examples.slice(0, 2).map((ex, i) =>
            <div className="ex" key={i}>
                  <div className="es">{ex.source}</div>
                  <div className="en">{ex.target}</div>
                </div>
            )}
            </> :
          null}
        </div>

        {/* Gentle upsell gate */}
        <div className="gate">
          <div className="gate-head">
            <span style={{ color: "var(--sage-deep)" }}><Icon name="spark" size={20} /></span>
            <span className="gate-title">{t.gateTitle}</span>
          </div>
          <p className="gate-sub">{t.gateSub}</p>
          <div className="locked-grid">
            <LockedCard t={t} icon="spark" title={t.idiomsTitle} onUnlock={onPro}>
              {Array.isArray(data.idioms) && data.idioms.length ?
              data.idioms.slice(0, 2).map((id, i) =>
              <div key={i} style={{ marginBottom: 6 }}><b>{id.phrase}</b> — {id.meaning}</div>
              ) :
              <div>Common idioms and natural collocations for this word, with examples.</div>}
            </LockedCard>
            <LockedCard t={t} icon="chat" title={t.practiceTitle} onUnlock={onPro}>
              {t.practiceBlur}
            </LockedCard>
          </div>
          <div className="gate-actions">
            <button className="btn-save" onClick={onSave}><Icon name="bookmark" size={18} /> {t.save}</button>
            <button className="btn-pro" onClick={onPro}><Icon name="spark" size={18} /> {t.tryPro}</button>
            <button className="nav-link" onClick={onNew} style={{ marginLeft: "auto" }}>{t.newSearch}</button>
          </div>
        </div>
      </div>
    </div>);

}

function StorySections({ t, showVideo, onContact }) {
  const submit = (e) => {e.preventDefault();onContact();};
  return (
    <>
      <section className="section" id="ethos">
        <div className="sec-wrap ethos" style={{ padding: "104px 10px 88px" }}>
          <h2 className="sec-title" style={{ margin: "0px 0px 30px 10px" }}>{t.ethosTitle}</h2>
          <div className="sec-rule" style={{ margin: "0px 0px 30px 10px" }} />
          <div className="prose">
            <p style={{ margin: "0px 0px 22px 10px" }}>{t.ethos1}</p>
            <p style={{ padding: "0px 0px 0px 10px" }}>{t.ethos2}</p>
          </div>
        </div>
      </section>

      <section className="section alt" id="founder">
        <div className="sec-wrap founder" style={{ padding: "72px 0px 72px 20px" }}>
          <img className="watermark" src="assets/logo-navy.png" alt="" style={{ top: 40, right: 40 }} />
          <h2 className="sec-title" style={{ padding: "0px 15px 0px 10px" }}>{t.founderTitle}</h2>
          <div className="sec-rule" style={{ margin: "0px 0px 30px 10px" }} />
          <div className={"founder-grid" + (showVideo ? "" : " notext")} style={{ padding: "0px 1px 0px 40px" }}>
            {showVideo ?
            <div className="video-col">
              <div className="video-ph" role="button" tabIndex={0} title={t.founderVideoCap} style={{ padding: "15px" }}>
                <div className="play"><Icon name="play" size={30} /></div>
              </div>
              <div className="video-cap">{t.founderVideoCap}</div>
            </div> :
            null}
            <div className="founder-bio">
              <p className="kicker">{t.founderKicker}</p>
              <div className="prose"><p style={{ padding: "0px 0px 0px 1px" }}>{t.founderBio}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="sec-wrap contact" style={{ padding: "88px 30px 56px 20px" }}>
          <img className="watermark" src="assets/logo-navy.png" alt="" style={{ bottom: 0, right: 40 }} />
          <h2 className="sec-title" style={{ margin: "0px 10px 30px" }}>{t.contactTitle}</h2>
          <div className="sec-rule" style={{ margin: "0px 10px 30px" }} />
          <div className="contact-grid">
            <div className="qr-col">
              <div className="scan">{t.scanMe}</div>
              <div className="qr-box"><img src="assets/cep-qr.png" alt="QR code — The Corporate English Project" /></div>
              <a className="wa" href="https://wa.me/525573132329" target="_blank" rel="noreferrer">
                <img className="wa-logo" src="assets/whatsapp-logo.png" alt="WhatsApp" />55 7313 2329
              </a>
            </div>
            <div className="cor-mid">{t.fOr}</div>
            <div className="form-col">
              <h3 className="form-head">{t.formHead}</h3>
              <p className="form-sub">{t.formSub}</p>
              <form className="cform" onSubmit={submit}>
                <div className="cfield"><input type="text" placeholder={t.fFullName} /></div>
                <div className="cfield"><input type="tel" placeholder={t.fCell} /></div>
                <div className="cfield"><input type="email" placeholder={t.fEmail} /></div>
                <button className="csubmit" type="submit">{t.fSubmit}</button>
              </form>
            </div>
          </div>
          <p className="foot-cep">{t.footer}</p>
        </div>
      </section>
    </>);

}

function Modal({ t, mode, onClose, onSubmit }) {
  const title = mode === "pro" ? t.mProTitle : mode === "login" ? t.login : t.mSaveTitle;
  const lead = mode === "pro" ? t.mProLead : mode === "login" ? "" : t.mSaveLead;
  return (
    <div className="overlay" onMouseDown={(e) => {if (e.target === e.currentTarget) onClose();}}>
      <div className="modal" role="dialog" aria-modal="true">
        <button className="x" onClick={onClose} aria-label="Close"><Icon name="close" size={20} /></button>
        <img className="mlogo" src="assets/logo-navy.png" alt="" />
        <h2>{title}</h2>
        {lead ? <p className="lead">{lead}</p> : null}
        <form onSubmit={(e) => {e.preventDefault();onSubmit();}}>
          <div className="field"><label>{t.email}</label><input type="email" placeholder="name@email.com" required /></div>
          <div className="field"><label>{t.password}</label><input type="password" placeholder="••••••••" required /></div>
          <button className="btn-primary" type="submit">{mode === "login" ? t.login : t.create}</button>
        </form>
        <div className="or">{t.orcont}</div>
        <button className="btn-google" onClick={onSubmit}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M45 24c0-1.6-.1-2.8-.4-4H24v7.6h12c-.2 1.9-1.5 4.8-4.4 6.8l6.7 5.2C42.6 36 45 30.6 45 24Z" /><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.7-5.2c-1.9 1.3-4.4 2.2-7.8 2.2-6 0-11-4-12.8-9.5l-7 5.4C7.8 40.9 15.3 46 24 46Z" /><path fill="#FBBC05" d="M11.2 28.2c-.5-1.4-.7-2.8-.7-4.2s.3-2.9.7-4.2l-7-5.4C3.5 17.3 3 20.6 3 24s.5 6.7 1.2 9.6l7-5.4Z" /><path fill="#EA4335" d="M24 10.5c3.4 0 5.7 1.5 7 2.7l5.9-5.7C33 4.3 28 2 24 2 15.3 2 7.8 7.1 4.2 14.4l7 5.4C13 14.5 18 10.5 24 10.5Z" /></svg>
          {t.google}
        </button>
        {mode !== "login" ? <p className="reassure"><Icon name="shield" size={15} /> {t.reassure}</p> : null}
        <p className="foot">{t.haveAcct} <a onClick={onSubmit}>{t.loginLink}</a></p>
      </div>
    </div>);

}

/* ---------------- App ---------------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "defaultLang": "en",
  "glowStyle": "sage",
  "glowIntensity": 58,
  "animateGlow": true,
  "founderVideo": true
} /*EDITMODE-END*/;

function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang] = useState(tw.defaultLang || "en");
  useEffect(() => {setLang(tw.defaultLang || "en");}, [tw.defaultLang]);
  const t = STR[lang] || STR.en;

  const [query, setQuery] = useState("");
  const [dir, setDir] = useState("auto"); // auto | en2es | es2en
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | 'save' | 'pro' | 'login'
  const [toast, setToast] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const showToast = (msg) => {setToast(msg);setTimeout(() => setToast(""), 2600);};

  const cycleDir = () => setDir((d) => d === "auto" ? "es2en" : d === "es2en" ? "en2es" : "auto");

  const runTranslate = useCallback(async (text) => {
    const q = (text != null ? text : query).trim();
    if (!q) return;
    setBusy(true);setError("");
    try {
      if (!window.claude || !window.claude.complete) throw new Error("offline");
      const data = await translatePhrase(q, dir);
      console.log("TRANSLATE_OK", data.translation);
      setResult(data);
    } catch (e) {
      console.log("TRANSLATE_ERR", e && e.message);
      setError(t.err);
      setResult(null);
    } finally {setBusy(false);}
  }, [query, dir, t]);

  const onQuick = (w) => {setQuery(w);runTranslate(w);};

  const onMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {showToast(lang === "es" ? "Tu navegador no admite voz" : "Voice input not supported here");return;}
    if (listening && recRef.current) {recRef.current.stop();return;}
    const rec = new SR();
    rec.lang = dir === "en2es" ? "en-US" : dir === "es2en" ? "es-ES" : lang === "es" ? "es-ES" : "en-US";
    rec.interimResults = false;
    rec.onresult = (ev) => {const txt = ev.results[0][0].transcript;setQuery(txt);runTranslate(txt);};
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;setListening(true);rec.start();
  };

  const onSave = () => setModal("save");
  const onHome = (e) => {
    if (e) e.preventDefault();
    setQuery(""); setResult(null); setError(""); setModal(null); setBusy(false);
    if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const onPro = () => setModal("pro");
  const onModalSubmit = () => {setModal(null);showToast(t.acctToast);};

  const hasResult = !!result || busy || !!error;

  const glowColor = tw.glowStyle === "navy" ?
  "rgba(32,57,92,VAR)" :
  tw.glowStyle === "none" ?
  "rgba(0,0,0,0)" :
  "rgba(93,124,105,VAR)";
  const a = Math.max(0, Math.min(1, (tw.glowIntensity || 0) / 100)) * 0.85;
  const glowBg = `radial-gradient(circle at center, ${glowColor.replace("VAR", a.toFixed(3))} 0%, ${glowColor.replace("VAR", (a * 0.5).toFixed(3))} 32%, rgba(0,0,0,0) 66%)`;

  return (
    <div className="page">
      <div className={"glow" + (tw.animateGlow && tw.glowStyle !== "none" ? " animate" : "")}
      style={{ background: glowBg, top: hasResult ? "30%" : "42%" }} />
      <Nav t={t} lang={lang} setLang={setLang} onLogin={() => setModal("login")} onHome={onHome} />

      <main className={"hero" + (hasResult ? " compact" : "")}>
        <div className="shell">
          <div className={"hero-fold" + (hasResult ? " hidden" : "")}>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="headline">{t.h1pre}<em>{t.h1b}</em>{t.h1c}<br />{t.h1a}</h1>
            <p className="subhead">{t.sub}</p>
          </div>

          <SearchBar
            t={t} value={query} setValue={setValue(setQuery)}
            onGo={() => runTranslate()} busy={busy} dir={dir} cycleDir={cycleDir}
            listening={listening} onMic={onMic} />
          

          {!hasResult ?
          <div className="quickrow">
              <span className="hint" style={{ marginRight: 4 }}>{t.quickLabel}</span>
              {t.quick.map((w) => <button key={w} className="qchip" onClick={() => onQuick(w)}>{w}</button>)}
            </div> :
          null}

          {busy && !result ?
          <div className="loading"><span className="spinner" /> {lang === "es" ? "Traduciendo…" : "Translating…"}</div> :
          null}
          {error ? <div className="errbox">{error}</div> : null}
          {result ? <Result t={t} data={result} onSave={onSave} onPro={onPro} onNew={() => {setResult(null);setError("");setQuery("");}} /> : null}
        </div>
      </main>

      <StorySections t={t} showVideo={tw.founderVideo !== false} onContact={() => showToast(t.contactToast)} />

      {modal ? <Modal t={t} mode={modal} onClose={() => setModal(null)} onSubmit={onModalSubmit} /> : null}
      {toast ? <div className="toast"><Icon name="check" size={18} /> {toast}</div> : null}

      <TweaksPanel>
        <TweakSection label="Atmosphere" />
        <TweakRadio label="Glow color" value={tw.glowStyle} options={["sage", "navy", "none"]}
        onChange={(v) => setTweak("glowStyle", v)} />
        <TweakSlider label="Glow intensity" value={tw.glowIntensity} min={0} max={100} unit="%"
        onChange={(v) => setTweak("glowIntensity", v)} />
        <TweakToggle label="Animate glow" value={tw.animateGlow} onChange={(v) => setTweak("animateGlow", v)} />
        <TweakSection label="Content" />
        <TweakRadio label="Default language" value={tw.defaultLang} options={["en", "es"]}
        onChange={(v) => setTweak("defaultLang", v)} />
        <TweakToggle label="Founder intro video" value={tw.founderVideo !== false} onChange={(v) => setTweak("founderVideo", v)} />
      </TweaksPanel>
    </div>);

}

// tiny helper so SearchBar's setValue signature stays clean
function setValue(setter) {return (v) => setter(v);}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);