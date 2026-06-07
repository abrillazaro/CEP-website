/* ============================================================
   dash-core.jsx — Icons, data, copy, shared chrome + chart
   Exports to window for the other Babel scripts.
   ============================================================ */
const { useState, useRef, useEffect, useMemo, useCallback } = React;

/* ============================================================
   Live stats — real-time behaviour tracking, persisted locally.
   Everything starts at zero; numbers move only as the user acts.
   ============================================================ */
const STATS_KEY = "cep_stats_v1";
const DEFAULT_STATS = {
  points: 0, streak: 0, lastActive: null,
  goalTarget: 5, goalDone: 0, goalDate: null,
  fluency: 0, vocabulary: 0, speaking: 0, listening: 0, grammar: 0,
  drillsDone: 0, cardsReviewed: 0, lessonsDone: 0,
  history: [] /* [{ d:"YYYY-MM-DD", overall, vocabulary, speaking, listening, grammar }] */
};
function _dayKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function todayKey() { return _dayKey(new Date()); }
function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return _dayKey(d); }
function loadStats() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATS_KEY) || "null");
    if (raw && typeof raw === "object") return { ...DEFAULT_STATS, ...raw };
  } catch (e) {}
  return { ...DEFAULT_STATS };
}
let _stats = loadStats();
const _statSubs = new Set();
function getStats() { return _stats; }
function _commit(next) {
  _stats = next;
  try { localStorage.setItem(STATS_KEY, JSON.stringify(_stats)); } catch (e) {}
  _statSubs.forEach((fn) => fn(_stats));
}
function setStats(updater) { _commit(typeof updater === "function" ? updater(_stats) : updater); }
function useStats() {
  const [s, set] = React.useState(_stats);
  React.useEffect(() => {
    const fn = (ns) => set(ns);
    _statSubs.add(fn); set(_stats);
    return () => { _statSubs.delete(fn); };
  }, []);
  return s;
}
/* fold day/streak rollovers (reset today's goal, break a missed streak) */
function normalizeStats() {
  setStats((prev) => {
    const today = todayKey(), y = yesterdayKey();
    const s = { ...prev };
    if (s.goalDate !== today) { s.goalDone = 0; s.goalDate = today; }
    if (s.lastActive && s.lastActive !== today && s.lastActive !== y) s.streak = 0;
    return s;
  });
}
/* award points + skill XP for a completed activity, snapshot today's fluency */
function recordActivity(gain) {
  const g = gain || {};
  setStats((prev) => {
    const today = todayKey(), y = yesterdayKey();
    const s = { ...prev };
    if (s.goalDate !== today) { s.goalDone = 0; s.goalDate = today; }
    if (s.lastActive !== today) { s.streak = s.lastActive === y ? s.streak + 1 : 1; s.lastActive = today; }
    s.points += g.points || 0;
    s.vocabulary += g.vocab || 0;
    s.speaking += g.speaking || 0;
    s.listening += g.listening || 0;
    s.grammar += g.grammar || 0;
    s.drillsDone += g.drill || 0;
    s.cardsReviewed += g.card || 0;
    s.lessonsDone += g.lesson || 0;
    s.goalDone = Math.min(s.goalTarget, s.goalDone + (g.goal || 0));
    s.fluency = Math.round((s.vocabulary + s.speaking + s.listening + s.grammar) / 4);
    const snap = { d: today, overall: s.fluency, vocabulary: s.vocabulary, speaking: s.speaking, listening: s.listening, grammar: s.grammar };
    s.history = [...s.history.filter((h) => h.d !== today), snap];
    return s;
  });
}
/* % change of a metric vs ~30 days ago (0 until there's real history) */
function fluencyChange(history, id) {
  id = id || "overall";
  if (!history || history.length < 2) return 0;
  const cur = history[history.length - 1][id] || 0;
  const cutoff = Date.now() - 30 * 864e5;
  let base = history[0][id] || 0;
  for (const h of history) { if (new Date(h.d).getTime() >= cutoff) { base = h[id] || 0; break; } }
  if (base === 0) return cur > 0 ? 100 : 0;
  return +(((cur - base) / base) * 100).toFixed(1);
}
function seriesValue(history, id) { return history && history.length ? (history[history.length - 1][id] || 0) : 0; }

/* ---------------- Icons ---------------- */
function Icon({ name, size = 22, stroke = 2 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home":return <svg {...p}><path d="M4 11 12 4l8 7" /><path d="M6 10v9h12v-9" /></svg>;
    case "menu":return <svg {...p}><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>;
    case "book":return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 5v14" /></svg>;
    case "task":return <svg {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v3H9z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "deck":return <svg {...p}><rect x="3" y="6" width="13" height="13" rx="2" /><path d="M8 6V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1" /></svg>;
    case "drill":return <svg {...p}><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" /></svg>;
    case "chart":return <svg {...p}><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 14 3-4 3 2 4-6" /></svg>;
    case "feed":return <svg {...p}><path d="M4 5h16v14H4z" /><path d="M4 9h16" /><path d="M8 13h5" /><path d="M8 16h8" /></svg>;
    case "video":return <svg {...p}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></svg>;
    case "search":return <svg {...p}><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>;
    case "bell":return <svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
    case "gear":return <svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>;
    case "logout":return <svg {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17 5 12l5-5" /><path d="M5 12h12" /></svg>;
    case "arrow-ur":return <svg {...p}><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>;
    case "chevron-r":return <svg {...p}><path d="m9 6 6 6-6 6" /></svg>;
    case "chevron-l":return <svg {...p}><path d="m15 6-6 6 6 6" /></svg>;
    case "check":return <svg {...p}><path d="m5 12 4.5 4.5L19 7" /></svg>;
    case "close":return <svg {...p}><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>;
    case "play":return <svg {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5z" /></svg>;
    case "speaker":return <svg {...p}><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>;
    case "flame":return <svg {...p} fill="currentColor" stroke="none"><path d="M12 2c1 3-1 4-1 6 0 1 1 2 2 2s2-1 2-3c2 2 3 4 3 7a6 6 0 0 1-12 0c0-3 2-5 3-7 1 1 1 2 2 2 0-2-1-3 0-6Z" /></svg>;
    case "heart":return <svg {...p}><path d="M12 20s-7-4.3-9.2-8.5C1.3 8.5 2.7 5.5 5.8 5.5c1.8 0 3 1 4.2 2.3C11.2 6.5 12.4 5.5 14.2 5.5c3.1 0 4.5 3 3 6C19 15.7 12 20 12 20Z" /></svg>;
    case "comment":return <svg {...p}><path d="M4 5h16v11H9l-4 4V5Z" /></svg>;
    case "share":return <svg {...p}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" /></svg>;
    case "star":return <svg {...p} fill="currentColor" stroke="none"><path d="M12 3.5 14.3 9l6 .5-4.6 3.9 1.5 5.8L12 16.9 6.8 19.2l1.5-5.8L3.7 9.5l6-.5Z" /></svg>;
    case "lock":return <svg {...p}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case "plus":return <svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case "clock":return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "calendar":return <svg {...p}><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9h16M8 3v4M16 3v4" /></svg>;
    case "trophy":return <svg {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 18h6M10 18v-3M14 18v-3M8 21h8" /></svg>;
    case "target":return <svg {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></svg>;
    case "image":return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="m4 17 5-4 4 3 3-2 4 3" /></svg>;
    case "send":return <svg {...p}><path d="M4 12 20 4l-6 16-3-7-7-1Z" /></svg>;
    case "globe":return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" /></svg>;
    case "pin":return <svg {...p} fill="currentColor" stroke="none"><path d="M9 3h6l-1 6 4 3v2h-5v5l-1 2-1-2v-5H5v-2l4-3-1-6Z" /></svg>;
    case "spark":return <svg {...p}><path d="M12 2.5 14 9.6 21 12 14 14.4 12 21.5 10 14.4 3 12 10 9.6Z" /></svg>;
    case "headset":return <svg {...p}><path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="7" rx="2" /><rect x="17" y="13" width="4" height="7" rx="2" /><path d="M20 20a3 3 0 0 1-3 3h-3" /></svg>;
    case "swap":return <svg {...p}><path d="M7 7h11l-3-3M17 17H6l3 3" /></svg>;
    case "mic":return <svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></svg>;
    case "bookmark":return <svg {...p}><path d="M6 4h12v16l-6-4-6 4V4Z" /></svg>;
    case "trash":return <svg {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" /></svg>;
    case "sort":return <svg {...p}><path d="M4 6h13M4 12h9M4 18h5M17 9V18M17 18l3-3M17 18l-3-3" /></svg>;
    case "paperclip":return <svg {...p}><path d="M20 11.5 12 19.5a4.5 4.5 0 0 1-6.4-6.4l8-8a3 3 0 0 1 4.3 4.3l-8 8a1.5 1.5 0 0 1-2.2-2.2l7.3-7.3" /></svg>;
    case "link":return <svg {...p}><path d="M10 13a3 3 0 0 0 4.2 0l3-3a3 3 0 0 0-4.2-4.2L11.5 7" /><path d="M14 11a3 3 0 0 0-4.2 0l-3 3A3 3 0 0 0 11 18.2L12.5 17" /></svg>;
    case "switch":return <svg {...p}><path d="M16 3l4 4-4 4" /><path d="M20 7H8a4 4 0 0 0-4 4" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h12a4 4 0 0 0 4-4" /></svg>;
    case "shield":return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "users":return <svg {...p}><circle cx="9" cy="8" r="3.4" /><path d="M3.5 19.2a5.5 5.5 0 0 1 11 0" /><path d="M16.2 5.3a3 3 0 0 1 0 5.8" /><path d="M17.8 13.6a5.5 5.5 0 0 1 3.2 5" /></svg>;
    case "clipboard":return <svg {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v3H9z" /><path d="M8.5 12h7M8.5 16h4" /></svg>;
    case "flag":return <svg {...p}><path d="M5 21V4" /><path d="M5 4.5h11l-2.2 3.5L16 11.5H5" /></svg>;
    case "megaphone":return <svg {...p}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /><path d="M7 11.5v3.5" /></svg>;
    default:return null;
  }
}

/* Microsoft Teams glyph (brand simplified) */
function TeamsMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="17.5" cy="5.5" r="2.4" />
      <rect x="11" y="8.4" width="11" height="9.2" rx="2.2" />
      <circle cx="8" cy="6.2" r="3" opacity=".85" />
      <path d="M2 9.5h10a1 1 0 0 1 1 1v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-7Z" opacity=".6" />
      <path d="M4 11.4h6M7 11.4V17" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>);

}

/* ---------------- Data ---------------- */
// Read real user name from Supabase session stored in localStorage
const STUDENT = (function() {
  const fallback = { name: "Student", first: "Student", initials: "S" };
  try {
    const raw = localStorage.getItem("sb-qkxhzpicqjxodeadhcvw-auth-token");
    if (!raw) return { ...fallback, level: "B1 · Intermediate", levelEs: "B1 · Intermedio", instructor: "Abril Lázaro" };
    const session = JSON.parse(raw);
    const meta = (session.user && session.user.user_metadata) || {};
    const email = (session.user && session.user.email) || "";
    const fullName = meta.full_name || meta.name || email.split("@")[0].replace(/[._]/g, " ");
    const first = fullName.split(" ")[0];
    const initials = fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return { name: fullName, first, initials, level: "B1 · Intermediate", levelEs: "B1 · Intermedio", instructor: "Abril Lázaro" };
  } catch(e) {
    return { ...fallback, level: "B1 · Intermediate", levelEs: "B1 · Intermedio", instructor: "Abril Lázaro" };
  }
})();

const NAV = [
{ id: "home", icon: "home", en: "Home", es: "Inicio" },
{ id: "lessons", icon: "book", en: "Lessons", es: "Lecciones" },
{ id: "drills", icon: "drill", en: "Drills", es: "Práctica" },
{ id: "deck", icon: "deck", en: "Study Deck", es: "Mazo" },
{ id: "assignments", icon: "task", en: "Tasks", es: "Tareas" },
{ id: "progress", icon: "chart", en: "Progress", es: "Progreso" },
{ id: "announce", icon: "megaphone", en: "Announcements", es: "Anuncios" },
{ id: "feed", icon: "feed", en: "Feed", es: "Muro" },
{ id: "meetings", icon: "video", en: "Meetings", es: "Clases" }];


const TRACKS = [
{ n: "01", en: "Everyday Conversations", es: "Conversaciones diarias",
  metaEn: "Unit 1 of 8 · Not started", metaEs: "Unidad 1 de 8 · Sin empezar",
  lessons: [
  { t: "Greetings & Introductions", te: "Saludos y presentaciones", s: "now" },
  { t: "Talking About Routines", te: "Hablar de rutinas", s: "lock" },
  { t: "At the Café", te: "En el café", s: "lock" },
  { t: "Making Plans & Invitations", te: "Hacer planes e invitaciones", s: "lock" },
  { t: "Giving Directions", te: "Dar indicaciones", s: "lock" },
  { t: "Phone & Messages", te: "Llamadas y mensajes", s: "lock" }]
},
{ n: "02", en: "Workplace English", es: "Inglés profesional",
  metaEn: "Locked · Finish Track 1 to unlock", metaEs: "Bloqueado · Termina la ruta 1",
  lessons: [
  { t: "Introducing Yourself at Work", te: "Presentarte en el trabajo", s: "lock" },
  { t: "Emails & Tone", te: "Correos y tono", s: "lock" },
  { t: "Meetings Vocabulary", te: "Vocabulario de juntas", s: "lock" },
  { t: "Negotiating Politely", te: "Negociar con cortesía", s: "lock" }]
},
{ n: "03", en: "Pronunciation Lab", es: "Laboratorio de pronunciación",
  metaEn: "Locked · Finish Track 1 to unlock", metaEs: "Bloqueado · Termina la ruta 1",
  lessons: [
  { t: "The TH Sound", te: "El sonido TH", s: "lock" },
  { t: "Vowel Length", te: "Duración de vocales", s: "lock" },
  { t: "Word Stress", te: "Acento tónico", s: "lock" }]
}];


const CURRENT = { track: "Everyday Conversations", trackEs: "Conversaciones diarias",
  title: "Greetings & Introductions", titleEs: "Saludos y presentaciones",
  unit: "Unit 1 · Lesson 1", unitEs: "Unidad 1 · Lección 1", progress: 0,
  leftEn: "12 min lesson", leftEs: "Lección de 12 min" };

const DECK = [
{ term: "aprovechar", lang: "es", tr: "to make the most of", pos: "verb", phon: "ah-pro-veh-CHAR", ex: "Hay que aprovechar el buen clima.", due: true },
{ term: "to look forward to", lang: "en", tr: "tener muchas ganas de", pos: "phrase", phon: "luk FOR-werd", ex: "I look forward to meeting you.", due: true },
{ term: "echar de menos", lang: "es", tr: "to miss (someone)", pos: "phrase", phon: "eh-CHAR deh MEH-nos", ex: "Echo de menos a mi familia.", due: true },
{ term: "hindsight", lang: "en", tr: "retrospectiva", pos: "noun", phon: "HYND-syt", ex: "In hindsight, I should have called.", due: false },
{ term: "soler", lang: "es", tr: "to usually (do)", pos: "verb", phon: "so-LEHR", ex: "Suelo correr por las mañanas.", due: true },
{ term: "to come up with", lang: "en", tr: "idear / ocurrírsele", pos: "phrase", phon: "kuhm UHP with", ex: "She came up with a great idea.", due: false }];


/* ============================================================
   Study-deck store — seeded from DECK, words saved from the
   dashboard translator get prepended and persist locally.
   ============================================================ */
const DECK_KEY = "cep_deck_v1";
function loadDeck() {
  try {
    const raw = JSON.parse(localStorage.getItem(DECK_KEY) || "null");
    if (Array.isArray(raw)) return raw;
  } catch (e) {}
  return DECK.map((c) => ({ ...c }));
}
let _deck = loadDeck();
const _deckSubs = new Set();
function _commitDeck(next) {
  _deck = next;
  try { localStorage.setItem(DECK_KEY, JSON.stringify(_deck)); } catch (e) {}
  _deckSubs.forEach((fn) => fn(_deck));
}
function getDeck() { return _deck; }
/* returns false if the term is already in the deck */
function addCard(card) {
  const key = (card.term || "").trim().toLowerCase();
  if (!key) return false;
  if (_deck.some((c) => (c.term || "").trim().toLowerCase() === key)) return false;
  _commitDeck([{ ...card, due: true, saved: true }, ..._deck]);
  return true;
}
function useDeck() {
  const [d, set] = React.useState(_deck);
  React.useEffect(() => {
    const fn = (nd) => set(nd);
    _deckSubs.add(fn); set(_deck);
    return () => { _deckSubs.delete(fn); };
  }, []);
  return d;
}
function removeCard(term) {
  const key = (term || "").trim().toLowerCase();
  _commitDeck(_deck.filter((c) => (c.term || "").trim().toLowerCase() !== key));
}
/* patch a card in place (used for instructor flag / unflag) */
function updateCard(term, patch) {
  const key = (term || "").trim().toLowerCase();
  _commitDeck(_deck.map((c) => (c.term || "").trim().toLowerCase() === key ? { ...c, ...patch } : c));
}
/* instructor suggests a card into the student's deck (deduped by term) */
function suggestCard(card) {
  const key = (card.term || "").trim().toLowerCase();
  if (!key) return false;
  if (_deck.some((c) => (c.term || "").trim().toLowerCase() === key)) return false;
  _commitDeck([{ ...card, due: true, suggested: true, by: INSTRUCTOR.name, suggestedAt: Date.now() }, ..._deck]);
  return true;
}

/* ============================================================
   Class-feed store — starts empty; every post is user-generated
   (text + optional image/video). Persisted locally; if media is
   too large for storage, text/meta still persist across reloads.
   ============================================================ */
const FEED_KEY = "cep_feed_v1";
function loadFeed() {
  try {
    const raw = JSON.parse(localStorage.getItem(FEED_KEY) || "null");
    if (Array.isArray(raw)) return raw;
  } catch (e) {}
  return [];
}
let _feed = loadFeed();
const _feedSubs = new Set();
function _commitFeed(next) {
  _feed = next;
  try {
    localStorage.setItem(FEED_KEY, JSON.stringify(_feed));
  } catch (e) {
    // quota (large video/image) — keep full posts in memory, persist text-only
    try { localStorage.setItem(FEED_KEY, JSON.stringify(_feed.map((p) => ({ ...p, media: [] })))); } catch (_) {}
  }
  _feedSubs.forEach((fn) => fn(_feed));
}
function getFeed() { return _feed; }
function addPost(post) {
  _commitFeed([{ id: "p" + Date.now() + Math.random().toString(36).slice(2, 6), ...post }, ..._feed]);
}
function removePost(id) { _commitFeed(_feed.filter((p) => p.id !== id)); }
function updatePost(id, patch) { _commitFeed(_feed.map((p) => p.id === id ? { ...p, ...patch } : p)); }
function useFeed() {
  const [f, set] = React.useState(_feed);
  React.useEffect(() => {
    const fn = (nf) => set(nf);
    _feedSubs.add(fn); set(_feed);
    return () => { _feedSubs.delete(fn); };
  }, []);
  return f;
}
/* relative timestamp: now / 5m / 3h / 2d / date */
function relTime(ts, lang) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 45) return lang === "es" ? "ahora" : "now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  const d = Math.floor(h / 24);
  if (d < 7) return d + "d";
  return new Date(ts).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" });
}
/* absolute date-time, e.g. "Thu, Jun 5 · 6:00 PM" */
function fmtWhen(ts, lang) {
  if (!ts) return "";
  const d = new Date(ts);
  const date = d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(lang === "es" ? "es-ES" : "en-US", { hour: "numeric", minute: "2-digit" });
  return date + " · " + time;
}

/* ============================================================
   Role — the same dashboard can be viewed as the student who
   owns it, or as an instructor who creates/grades. Persisted.
   ============================================================ */
const INSTRUCTOR = { name: "Abril Lázaro", first: "Abril", initials: "AL", color: "#5d7c69",
  level: "Instructor", levelEs: "Instructora" };
const ROLE_KEY = "cep_role_v1";
// Student dashboard always starts as student — clear any stored instructor role
let _role = "student";
try { localStorage.removeItem(ROLE_KEY); } catch (e) {}
const _roleSubs = new Set();
function getRole() { return _role; }
function setRole(r) {
  _role = r;
  try { localStorage.setItem(ROLE_KEY, r); } catch (e) {}
  _roleSubs.forEach((fn) => fn(_role));
}
function useRole() {
  const [r, set] = React.useState(_role);
  React.useEffect(() => { const fn = (nr) => set(nr); _roleSubs.add(fn); set(_role); return () => { _roleSubs.delete(fn); }; }, []);
  return r;
}
function isInstructor() { return _role === "instructor"; }
/* identity for whoever is acting right now */
function currentUser() {
  return _role === "instructor" ?
  { name: INSTRUCTOR.name, initials: INSTRUCTOR.initials, color: INSTRUCTOR.color, role: "instructor" } :
  { name: STUDENT.name, initials: STUDENT.initials, color: "var(--sage)", role: "student" };
}

/* ============================================================
   Assignments store — empty by default. Instructors create them;
   students submit (text + files); instructors grade + give feedback.
   ============================================================ */
const ASSIGN_KEY = "cep_assignments_v1";
function loadAssign() {
  try { const r = JSON.parse(localStorage.getItem(ASSIGN_KEY) || "null"); if (Array.isArray(r)) return r; } catch (e) {}
  return [];
}
let _assign = loadAssign();
const _assignSubs = new Set();
function _commitAssign(next) {
  _assign = next;
  try { localStorage.setItem(ASSIGN_KEY, JSON.stringify(_assign)); }
  catch (e) { try { localStorage.setItem(ASSIGN_KEY, JSON.stringify(_assign.map((a) => ({ ...a, submission: a.submission ? { ...a.submission, files: [] } : null })))); } catch (_) {} }
  _assignSubs.forEach((fn) => fn(_assign));
}
function getAssignments() { return _assign; }
function addAssignment(a) {
  _commitAssign([{ id: "a" + Date.now() + Math.random().toString(36).slice(2, 5), createdAt: Date.now(), points: 100, submission: null, grade: null, ...a }, ..._assign]);
}
function updateAssignment(id, patch) { _commitAssign(_assign.map((a) => a.id === id ? { ...a, ...patch } : a)); }
function removeAssignment(id) { _commitAssign(_assign.filter((a) => a.id !== id)); }
function useAssignments() {
  const [v, set] = React.useState(_assign);
  React.useEffect(() => { const fn = (n) => set(n); _assignSubs.add(fn); set(_assign); return () => { _assignSubs.delete(fn); }; }, []);
  return v;
}

/* ============================================================
   Live-sessions store — empty by default. Instructors schedule
   sessions; students join. Past vs upcoming derived from time.
   ============================================================ */
const MEET_KEY = "cep_meetings_v1";
function loadMeet() {
  try { const r = JSON.parse(localStorage.getItem(MEET_KEY) || "null"); if (Array.isArray(r)) return r; } catch (e) {}
  return [];
}
let _meet = loadMeet();
const _meetSubs = new Set();
function _commitMeet(next) {
  _meet = next;
  try { localStorage.setItem(MEET_KEY, JSON.stringify(_meet)); } catch (e) {}
  _meetSubs.forEach((fn) => fn(_meet));
}
function getMeetings() { return _meet; }
function addMeeting(m) {
  _commitMeet([{ id: "m" + Date.now() + Math.random().toString(36).slice(2, 5), createdAt: Date.now(), host: INSTRUCTOR.name, ...m }, ..._meet]);
}
function updateMeeting(id, patch) { _commitMeet(_meet.map((m) => m.id === id ? { ...m, ...patch } : m)); }
function removeMeeting(id) { _commitMeet(_meet.filter((m) => m.id !== id)); }
function useMeetings() {
  const [v, set] = React.useState(_meet);
  React.useEffect(() => { const fn = (n) => set(n); _meetSubs.add(fn); set(_meet); return () => { _meetSubs.delete(fn); }; }, []);
  return v;
}

/* ============================================================
   Announcements store — SEPARATE from the social class feed.
   Only instructors post here. Each announcement auto-expires one
   week after it's posted: students see it in their Announcements
   tab for 7 days, then it disappears. Expired items are pruned
   from storage on load and on every write.
   ============================================================ */
const ANNOUNCE_KEY = "cep_announcements_v1";
const ANNOUNCE_TTL = 7 * 864e5; // one week, in ms
function _pruneAnnounce(arr) {
  const cut = Date.now() - ANNOUNCE_TTL;
  return arr.filter((a) => (a.ts || 0) >= cut);
}
function loadAnnounce() {
  try { const r = JSON.parse(localStorage.getItem(ANNOUNCE_KEY) || "null"); if (Array.isArray(r)) return _pruneAnnounce(r); } catch (e) {}
  return [];
}
let _announce = loadAnnounce();
const _annSubs = new Set();
function _commitAnnounce(next) {
  _announce = _pruneAnnounce(next);
  try { localStorage.setItem(ANNOUNCE_KEY, JSON.stringify(_announce)); } catch (e) {}
  _annSubs.forEach((fn) => fn(_announce));
}
function getAnnouncements() { return _pruneAnnounce(_announce); }
function addAnnouncement(a) {
  _commitAnnounce([{ id: "an" + Date.now() + Math.random().toString(36).slice(2, 5), ts: Date.now(), ...a }, ..._announce]);
}
function removeAnnouncement(id) { _commitAnnounce(_announce.filter((a) => a.id !== id)); }
/* hook returns only the announcements still within their 7-day window */
function useAnnouncements() {
  const [v, set] = React.useState(_announce);
  React.useEffect(() => { const fn = (n) => set(n); _annSubs.add(fn); set(_announce); return () => { _annSubs.delete(fn); }; }, []);
  const cut = Date.now() - ANNOUNCE_TTL;
  return v.filter((a) => (a.ts || 0) >= cut);
}

/* ============================================================
   Translation engine — uses Google Translate free API, same as
   the landing page. No API key required.
   ============================================================ */
async function translatePhrase(input, forced) {
  let sourceLang, targetLang;
  if (forced === "en2es") {
    sourceLang = "en"; targetLang = "es";
  } else if (forced === "es2en") {
    sourceLang = "es"; targetLang = "en";
  } else {
    sourceLang = /[áéíóúüñ¿¡]/i.test(input) ? "es" : "en";
    targetLang = sourceLang === "es" ? "en" : "es";
  }

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=at&q=${encodeURIComponent(input)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();

  const translation = data[0]?.map(s => s?.[0]).filter(Boolean).join("") || "";
  if (!translation) throw new Error("Empty response");

  let partOfSpeech = "";
  if (Array.isArray(data[1])) partOfSpeech = data[1][0]?.[0] || "";

  return { input, sourceLang, targetLang, translation, partOfSpeech, register: "", pronunciation: "", examples: [], note: "" };
}

const DRILLS = [
{ qEn: "Choose the natural translation", qEs: "Elige la traducción natural",
  prompt: "Tengo muchas ganas de verte.", pLang: "es", sub: "Spanish → English",
  opts: ["I'm really looking forward to seeing you.", "I have many desires to see you.", "I have much want of seeing you.", "I am wishing see you."], correct: 0,
  why: "“Look forward to” is the natural idiom for tener ganas de." },
{ qEn: "Fill the gap", qEs: "Completa la frase", prompt: "We should ___ of the good weather.", pLang: "en", sub: "Pick the best verb phrase",
  opts: ["make the most", "take the more", "do the best", "get the much"], correct: 0,
  why: "“Make the most of” = aprovechar." },
{ qEn: "Listen & choose", qEs: "Escucha y elige", prompt: "“In hindsight, I should have left earlier.”", pLang: "en", sub: "What does “in hindsight” mean?",
  opts: ["Looking back now", "In the future", "Without thinking", "At the moment"], correct: 0,
  why: "Hindsight = retrospectiva: understanding after the fact." },
{ qEn: "Choose the natural translation", qEs: "Elige la traducción natural", prompt: "Suelo desayunar a las 8.", pLang: "es", sub: "Spanish → English",
  opts: ["I usually have breakfast at 8.", "I am used to breakfast at 8.", "I solo breakfast at 8.", "I custom to eat at 8."], correct: 0,
  why: "Soler + infinitive = “usually do”." }];


/* progress series — stock-market style (12 months) */
const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
const SERIES = {
  overall: [402, 431, 448, 470, 512, 498, 540, 575, 602, 640, 690, 728],
  vocabulary: [380, 420, 460, 500, 540, 560, 600, 650, 690, 720, 760, 800],
  speaking: [350, 360, 380, 410, 440, 430, 470, 500, 540, 560, 610, 650],
  listening: [420, 450, 470, 490, 520, 540, 560, 600, 620, 660, 700, 740],
  grammar: [440, 455, 470, 485, 500, 520, 540, 560, 580, 610, 640, 680]
};
const SERIES_META = [
{ id: "overall", color: "#20395c", en: "Fluency Index", es: "Índice de fluidez" },
{ id: "vocabulary", color: "#5d7c69", en: "Vocabulary", es: "Vocabulario" },
{ id: "speaking", color: "#bd8b3e", en: "Speaking", es: "Habla" },
{ id: "listening", color: "#4b53bc", en: "Listening", es: "Escucha" },
{ id: "grammar", color: "#b4574a", en: "Grammar", es: "Gramática" }];


/* ---------------- Copy (UI chrome) ---------------- */
const STR = {
  en: {
    goodmorning: "Good morning", goodafternoon: "Good afternoon", goodevening: "Good evening",
    todayis: "Here's your day at a glance.",
    searchph: "Translate or search lessons…",
    trHeading: "Found a new word?", trSub: "Translate it and save it straight to your deck.",
    trPlaceholder: "Type a word or phrase in English or Spanish…",
    trGo: "Translate", trAuto: "Detect language", trTry: "Try:",
    trListen: "Listen", trSaveDeck: "Save to deck", trSaved: "Saved to deck",
    trInDeck: "Already in your deck", trNew: "New translation", trErr: "Couldn't translate that — try again.",
    trSource: "You typed",
    continueLabel: "Continue learning", resume: "Resume lesson", left: "left",
    todayDrill: "Today's drill", drillBlurb: "A 4-question warm-up from your recent words.",
    startDrill: "Start drill", deckLabel: "Study deck", deckDue: "due for review", reviewNow: "Review now",
    progressLabel: "Your progress", thisMonth: "this month", viewProgress: "Full report",
    assignLabel: "Tasks", upcoming: "Upcoming & recent", viewAll: "View all",
    meetLabel: "Next live class", joinTeams: "Join on Teams", details: "Details",
    feedLabel: "Class feed", openFeed: "Open feed",
    streak: "day streak", dailyGoal: "Daily goal", goalDone: "of",
    points: "points", rankLabel: "Cohort rank",
    // page titles
    pLessons: "Lessons", pLessonsSub: "Your learning tracks, set by Abril.",
    pDrills: "Drills", pDrillsSub: "Quick, focused practice — like a daily workout.",
    pDeck: "Study Deck", pDeckSub: "The words you've saved. Flip to review.",
    pProgress: "Progress", pProgressSub: "Your fluency, tracked over time.",
    pAssign: "Tasks", pAssignSub: "Everything due, submitted, and graded.",
    pFeed: "Class Feed", pFeedSub: "Share and connect with your classmates.",
    pMeet: "Meetings", pMeetSub: "Live classes hosted on Microsoft Teams.",
    pAccount: "Account Settings", pAccountSub: "Manage your profile and preferences.",
    back: "Back",
    // flashcard
    tapFlip: "Tap to flip", again: "Again", soon2: "Soon", good: "Got it", knownIn: "Review in 4 days",
    cardOf: "Card", of: "of", deckDone: "Deck complete!", deckDoneSub: "Nice work — come back tomorrow for your next review.",
    backToDash: "Back to dashboard", reviewAgain: "Review again",
    dkAllCards: "All cards", dkSortRecent: "Recent", dkSortAlpha: "A–Z",
    dkPrev: "Previous", dkNext: "Next", dkDelete: "Delete card",
    dkEmpty: "No cards yet", dkEmptySub: "Translate a word from your dashboard and save it to start your deck.",
    dkGoTranslate: "Go translate",
    // drill
    check: "Check", next: "Continue", correct: "Correct!", incorrect: "Not quite",
    drillDone: "Drill complete!", drillDoneSub: "You earned 40 points and kept your streak alive.",
    quit: "Quit",
    // meetings
    upcomingClasses: "Upcoming classes", pastClasses: "Past classes", hostedBy: "Hosted by", watch: "Recording",
    // feed
    shareSomething: "Share something with your class…",
    like: "Like", comment: "Comment", share: "Share", pinned: "Pinned by instructor",
    fdPost: "Post", fdPhoto: "Photo", fdVideo: "Video", fdRemove: "Remove",
    fdEmpty: "No posts yet", fdEmptySub: "Be the first to share something with your class.",
    fdDelete: "Delete post", fdNow: "now", fdYou: "You",
    fdNoFeed: "Nothing posted yet.",
    fdComment: "Comment", commentPh: "Write a comment…", fdReply: "Reply",
    commentsN: "comments", commentN: "comment", noComments: "No comments yet — start the conversation.",
    fdDelComment: "Delete comment",
    // announcements (instructor-posted, auto-expire after one week)
    pAnnounce: "Announcements",
    pAnnounceSubStu: "Important updates from your instructor — from the last 7 days.",
    pAnnounceSubInstr: "Post updates to your class. Each one stays visible to students for one week.",
    annComposePh: "Write an announcement for your class…", annTitlePh: "Add a headline (optional)",
    annPost: "Post announcement",
    annEmptyStu: "No announcements right now", annEmptyStuSub: "When your instructor posts an announcement, it'll show up here for a week.",
    annEmptyInstr: "No active announcements", annEmptyInstrSub: "Post an update and your whole class will see it for the next 7 days.",
    annExpires: "Expires in", annExpiresToday: "Expires today", annDay: "d",
    annTtlNote: "Visible to students for 7 days", annDelete: "Delete announcement",
    // role
    viewingAs: "Viewing as", roleStudent: "Student", roleInstructor: "Instructor",
    switchInstr: "Switch to Instructor", switchStudent: "Switch to Student", instrMode: "Instructor mode",
    // tasks
    newTask: "New assignment", taskTitleL: "Title", taskDescL: "Instructions",
    taskDueL: "Due date", taskPointsL: "Points", createTask: "Post assignment", cancel: "Cancel",
    noTasks: "No assignments yet", noTasksInstr: "Post the first assignment for your class.",
    noTasksStu: "Your instructor hasn't posted any assignments.",
    dueLabel: "Due", noDue: "No due date", submitWork: "Submit work", yourResponse: "Your response…",
    attach: "Attach file", submitBtn: "Turn in", submitted: "Turned in", resubmit: "Edit submission",
    awaiting: "Awaiting grade", notTurnedIn: "Not turned in", viewSubmission: "View submission",
    gradeBtn: "Grade", scoreL: "Score", feedbackL: "Feedback", feedbackPh: "Leave feedback for the student…",
    saveGrade: "Save grade", gradedBy: "Graded", instrFeedback: "Instructor feedback",
    deleteTask: "Delete assignment", noSubmission: "Not submitted yet", reviewWork: "Review submission",
    // sessions
    newSession: "Schedule session", sessTitleL: "Session title", sessWhenL: "Date & time",
    sessDurL: "Duration (min)", sessLinkL: "Meeting link (Teams/Zoom)", createSession: "Schedule",
    noSessions: "No live sessions yet", noSessInstr: "Schedule your first live session.",
    noSessStu: "Your instructor hasn't scheduled any sessions.",
    addRecording: "Add recording link", recordingL: "Recording URL", deleteSession: "Delete session",
    minShort: "min",
    // account
    aProfile: "Profile", aLearning: "Learning", aNotifs: "Notifications", aBilling: "Subscription",
    fullName: "Full name", email: "Email", nativeLang: "Native language", goalLvl: "Target level",
    dailyGoalSet: "Daily goal", save: "Save changes", saved: "Changes saved",
    plan: "Pro · $9/mo", planRenew: "Renews Jun 28, 2026", manage: "Manage subscription",
    logout: "Log out", logoutQ: "Log out of CEP?", logoutSub: "You can pick up right where you left off next time.",
    cancel: "Cancel",
    settings: "Account settings"
  },
  es: {
    goodmorning: "Buenos días", goodafternoon: "Buenas tardes", goodevening: "Buenas noches",
    todayis: "Tu día de un vistazo.",
    searchph: "Traduce o busca lecciones…",
    trHeading: "¿Una palabra nueva?", trSub: "Tradúcela y guárdala directo en tu mazo.",
    trPlaceholder: "Escribe una palabra o frase en inglés o español…",
    trGo: "Traducir", trAuto: "Detectar idioma", trTry: "Prueba:",
    trListen: "Escuchar", trSaveDeck: "Guardar en el mazo", trSaved: "Guardada en el mazo",
    trInDeck: "Ya está en tu mazo", trNew: "Nueva traducción", trErr: "No se pudo traducir — inténtalo de nuevo.",
    trSource: "Escribiste",
    continueLabel: "Continúa aprendiendo", resume: "Reanudar lección", left: "restan",
    todayDrill: "Práctica de hoy", drillBlurb: "Un calentamiento de 4 preguntas con tus palabras recientes.",
    startDrill: "Empezar", deckLabel: "Mazo de estudio", deckDue: "para repasar", reviewNow: "Repasar ahora",
    progressLabel: "Tu progreso", thisMonth: "este mes", viewProgress: "Reporte completo",
    assignLabel: "Tareas", upcoming: "Próximas y recientes", viewAll: "Ver todo",
    meetLabel: "Próxima clase en vivo", joinTeams: "Unirse en Teams", details: "Detalles",
    feedLabel: "Muro de clase", openFeed: "Abrir muro",
    streak: "días seguidos", dailyGoal: "Meta diaria", goalDone: "de",
    points: "puntos", rankLabel: "Ranking del grupo",
    pLessons: "Lecciones", pLessonsSub: "Tus rutas de aprendizaje, definidas por Abril.",
    pDrills: "Práctica", pDrillsSub: "Práctica breve y enfocada — como ejercicio diario.",
    pDeck: "Mazo de estudio", pDeckSub: "Las palabras que guardaste. Voltea para repasar.",
    pProgress: "Progreso", pProgressSub: "Tu fluidez, medida en el tiempo.",
    pAssign: "Tareas", pAssignSub: "Todo lo pendiente, entregado y calificado.",
    pFeed: "Muro de clase", pFeedSub: "Comparte y conecta con tus compañeros.",
    pMeet: "Clases", pMeetSub: "Clases en vivo en Microsoft Teams.",
    pAccount: "Configuración de cuenta", pAccountSub: "Administra tu perfil y preferencias.",
    back: "Atrás",
    tapFlip: "Toca para voltear", again: "Otra vez", soon2: "Pronto", good: "La sé", knownIn: "Repaso en 4 días",
    cardOf: "Tarjeta", of: "de", deckDone: "¡Mazo completo!", deckDoneSub: "¡Bien hecho! Vuelve mañana para tu próximo repaso.",
    backToDash: "Volver al inicio", reviewAgain: "Repasar de nuevo",
    dkAllCards: "Todas las tarjetas", dkSortRecent: "Recientes", dkSortAlpha: "A–Z",
    dkPrev: "Anterior", dkNext: "Siguiente", dkDelete: "Eliminar tarjeta",
    dkEmpty: "Aún no hay tarjetas", dkEmptySub: "Traduce una palabra desde tu panel y guárdala para empezar tu mazo.",
    dkGoTranslate: "Ir a traducir",
    check: "Revisar", next: "Continuar", correct: "¡Correcto!", incorrect: "Casi",
    drillDone: "¡Práctica completa!", drillDoneSub: "Ganaste 40 puntos y mantuviste tu racha.",
    quit: "Salir",
    upcomingClasses: "Próximas clases", pastClasses: "Clases pasadas", hostedBy: "Imparte", watch: "Grabación",
    shareSomething: "Comparte algo con tu clase…",
    like: "Me gusta", comment: "Comentar", share: "Compartir", pinned: "Fijado por la instructora",
    fdPost: "Publicar", fdPhoto: "Foto", fdVideo: "Video", fdRemove: "Quitar",
    fdEmpty: "Aún no hay publicaciones", fdEmptySub: "Sé la primera en compartir algo con tu clase.",
    fdDelete: "Eliminar publicación", fdNow: "ahora", fdYou: "Tú",
    fdNoFeed: "Aún no hay nada publicado.",
    fdComment: "Comentar", commentPh: "Escribe un comentario…", fdReply: "Responder",
    commentsN: "comentarios", commentN: "comentario", noComments: "Aún no hay comentarios — inicia la conversación.",
    fdDelComment: "Eliminar comentario",
    // announcements (publicados por la instructora, expiran tras una semana)
    pAnnounce: "Anuncios",
    pAnnounceSubStu: "Avisos importantes de tu instructora — de los últimos 7 días.",
    pAnnounceSubInstr: "Publica avisos para tu clase. Cada uno es visible para los estudiantes durante una semana.",
    annComposePh: "Escribe un anuncio para tu clase…", annTitlePh: "Agrega un título (opcional)",
    annPost: "Publicar anuncio",
    annEmptyStu: "No hay anuncios por ahora", annEmptyStuSub: "Cuando tu instructora publique un anuncio, aparecerá aquí durante una semana.",
    annEmptyInstr: "No hay anuncios activos", annEmptyInstrSub: "Publica un aviso y toda tu clase lo verá durante los próximos 7 días.",
    annExpires: "Expira en", annExpiresToday: "Expira hoy", annDay: "d",
    annTtlNote: "Visible para estudiantes durante 7 días", annDelete: "Eliminar anuncio",
    // role
    viewingAs: "Viendo como", roleStudent: "Estudiante", roleInstructor: "Instructora",
    switchInstr: "Cambiar a Instructora", switchStudent: "Cambiar a Estudiante", instrMode: "Modo instructora",
    // tasks
    newTask: "Nueva tarea", taskTitleL: "Título", taskDescL: "Instrucciones",
    taskDueL: "Fecha de entrega", taskPointsL: "Puntos", createTask: "Publicar tarea", cancel: "Cancelar",
    noTasks: "Aún no hay tareas", noTasksInstr: "Publica la primera tarea para tu clase.",
    noTasksStu: "Tu instructora aún no ha publicado tareas.",
    dueLabel: "Entrega", noDue: "Sin fecha", submitWork: "Entregar trabajo", yourResponse: "Tu respuesta…",
    attach: "Adjuntar archivo", submitBtn: "Entregar", submitted: "Entregado", resubmit: "Editar entrega",
    awaiting: "Pendiente de calificación", notTurnedIn: "Sin entregar", viewSubmission: "Ver entrega",
    gradeBtn: "Calificar", scoreL: "Calificación", feedbackL: "Retroalimentación", feedbackPh: "Deja retroalimentación para el estudiante…",
    saveGrade: "Guardar calificación", gradedBy: "Calificado", instrFeedback: "Retroalimentación de la instructora",
    deleteTask: "Eliminar tarea", noSubmission: "Aún sin entregar", reviewWork: "Revisar entrega",
    // sessions
    newSession: "Programar sesión", sessTitleL: "Título de la sesión", sessWhenL: "Fecha y hora",
    sessDurL: "Duración (min)", sessLinkL: "Enlace de la reunión (Teams/Zoom)", createSession: "Programar",
    noSessions: "Aún no hay sesiones en vivo", noSessInstr: "Programa tu primera sesión en vivo.",
    noSessStu: "Tu instructora aún no ha programado sesiones.",
    addRecording: "Agregar enlace de grabación", recordingL: "URL de la grabación", deleteSession: "Eliminar sesión",
    minShort: "min",
    aProfile: "Perfil", aLearning: "Aprendizaje", aNotifs: "Notificaciones", aBilling: "Suscripción",
    fullName: "Nombre completo", email: "Correo", nativeLang: "Idioma nativo", goalLvl: "Nivel objetivo",
    dailyGoalSet: "Meta diaria", save: "Guardar cambios", saved: "Cambios guardados",
    plan: "Pro · $9/mes", planRenew: "Se renueva el 28 jun 2026", manage: "Administrar suscripción",
    logout: "Cerrar sesión", logoutQ: "¿Cerrar sesión en CEP?", logoutSub: "La próxima vez retomas justo donde lo dejaste.",
    cancel: "Cancelar",
    settings: "Configuración"
  }
};

function greeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t.goodmorning;
  if (h < 19) return t.goodafternoon;
  return t.goodevening;
}
function todayStr(lang) {
  try {
    return new Date().toLocaleDateString(lang === "es" ? "es-MX" : "en-US",
    { weekday: "long", month: "long", day: "numeric" });
  } catch (e) {return "";}
}
function speak(text, lang) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-ES" : "en-US";u.rate = 0.92;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

/* ---------------- Shared chrome ---------------- */
function Sidebar({ view, go, t, lang, expanded, setExpanded, profileOpen, setProfileOpen, mobileOpen, setMobileOpen }) {
  const stats = useStats();
  const role = useRole();
  const me = currentUser();
  const instr = role === "instructor";
  const isExpanded = expanded || mobileOpen;
  const closeDrawer = () => setMobileOpen && setMobileOpen(false);
  const navGo = (id) => { go(id); closeDrawer(); };
  return (
    <>
      {mobileOpen ? <div className="mobile-backdrop" onClick={closeDrawer} /> : null}
      <aside className={"rail" + (isExpanded ? " expanded" : "") + (instr ? " instr" : "") + (mobileOpen ? " mobile-open" : "")}>
        <div className="rail-top">
          <div className="rail-logo" onClick={() => navGo("home")} title="CEP">
            <img src="logo-navy.png" alt="CEP" />
          </div>
          {isExpanded ?
          <div className="rail-word">Corporate English<small>The CEP</small></div> :
          null}
          <button className="rail-toggle" onClick={() => setExpanded((e) => !e)}
          title={expanded ? lang === "es" ? "Contraer" : "Collapse" : lang === "es" ? "Expandir" : "Expand"}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}>
            <Icon name={expanded ? "chevron-l" : "menu"} size={18} />
          </button>
        </div>
        <nav className="rail-nav">
          {NAV.map((n) =>
          <button key={n.id} className={"rail-item" + (view === n.id ? " active" : "")}
          onClick={() => navGo(n.id)} title={!isExpanded ? lang === "es" ? n.es : n.en : undefined}>
              <Icon name={n.icon} size={22} />
              <span>{lang === "es" ? n.es : n.en}</span>
              {n.badge ? <i className="rail-badge">{n.badge}</i> : null}
            </button>
          )}
        </nav>
        <div className="rail-foot">
          <div className="rail-streak" title={t.streak}>
            <span className="fire"></span>{isExpanded ? <span>{stats.streak} {t.streak}</span> : null}
          </div>
          <button className="rail-profile" onClick={() => setProfileOpen((o) => !o)} title={me.name}>
            <span className={"rail-avatar" + (profileOpen || view === "account" ? " active" : "")}
            style={instr ? { background: "var(--navy)", color: "#fff" } : undefined}>{me.initials}</span>
            {isExpanded ?
            <span className="rail-id"><b>{me.name}</b><small>{instr ? t.instrMode : lang === "es" ? STUDENT.levelEs : STUDENT.level}</small></span> :
            null}
          </button>
        </div>
        {profileOpen ?
        <div className="pop" onMouseLeave={() => setProfileOpen(false)}>
            <div className="pop-head">
              <div className="av" style={instr ? { background: "var(--navy)" } : undefined}>{me.initials}</div>
              <div><b>{me.name}</b><small>{instr ? t.roleInstructor : lang === "es" ? STUDENT.levelEs : STUDENT.level}</small></div>
            </div>
            <button className="pop-item" onClick={() => {navGo("account");setProfileOpen(false);}}>
              <Icon name="gear" size={18} /> {t.settings}
            </button>
            <button className="pop-item" onClick={() => {navGo("progress");setProfileOpen(false);}}>
              <Icon name="chart" size={18} /> {t.pProgress}
            </button>
            <a className="pop-item" href="Instructor Dashboard.html">
              <Icon name="users" size={18} /> {lang === "es" ? "Panel de instructora" : "Instructor dashboard"}
            </a>
            <button className="pop-item danger" onClick={() => {setProfileOpen(false);closeDrawer();window.__cepLogout && window.__cepLogout();}}>
              <Icon name="logout" size={18} /> {t.logout}
            </button>
          </div> :
        null}
      </aside>
    </>);

}

function Topbar({ t, lang, setLang, go, title, sub, onMobileMenu }) {
  return (
    <div className="topbar">
      <button className="mob-menu-btn" onClick={onMobileMenu} aria-label="Open menu">
        <Icon name="menu" size={22} />
      </button>
      <div className="tb-greet">
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="tb-right">
        <div className="tb-search" onClick={() => go("lessons")}>
          <Icon name="search" size={18} />
          <input placeholder={t.searchph} onFocus={(e) => e.target.blur()} readOnly />
        </div>
        <div className="lang-seg">
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ES</button>
        </div>
        <button className="icon-btn" onClick={() => go("feed")} title="Notifications"><Icon name="bell" size={19} /><span className="dot" /></button>
      </div>
    </div>);

}

function Ring({ value, total, size = 64 }) {
  const r = (size - 8) / 2,c = 2 * Math.PI * r,frac = Math.max(0, Math.min(1, value / total));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sage)" strokeWidth="7"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="rtxt">{value}/{total}</div>
    </div>);

}

/* ---------------- Progress chart (real daily history) ---------------- */
function ProgressChart({ history, active, timeframe, lang, height = 260, showAxis = true }) {
  const dayMap = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365, "All": 100000 };
  const days = dayMap[timeframe] || 365;
  const cutoff = Date.now() - days * 864e5;
  let data = (history || []).filter((h) => new Date(h.d).getTime() >= cutoff);
  if (data.length === 0) {
    const base = (history && history[history.length - 1]) ||
    { d: todayKey(), overall: 0, vocabulary: 0, speaking: 0, listening: 0, grammar: 0 };
    data = [base];
  }
  // need two points to render a segment — duplicate a lone day into a flat line
  const plot = data.length === 1 ? [data[0], data[0]] : data;
  const count = plot.length;

  const W = 760, H = height, padL = showAxis ? 44 : 12, padR = 14, padT = 14, padB = showAxis ? 30 : 12;
  const ids = SERIES_META.filter((s) => active.includes(s.id)).map((s) => s.id);
  let lo = Infinity, hi = -Infinity;
  ids.forEach((id) => plot.forEach((h) => { const v = h[id] || 0; lo = Math.min(lo, v); hi = Math.max(hi, v); }));
  if (!isFinite(lo)) { lo = 0; hi = 100; }
  if (hi - lo < 50) { hi = lo + 100; } else { lo = Math.floor((lo - 30) / 50) * 50; hi = Math.ceil((hi + 30) / 50) * 50; }
  lo = Math.max(0, lo);

  const x = (i) => padL + (count === 1 ? 0.5 : i / (count - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const fmt = (d) => { try { return new Date(d).toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { month: "short", day: "numeric" }); } catch (e) { return ""; } };
  const labels = plot.map((h) => fmt(h.d));
  const labelStep = Math.max(1, Math.ceil(count / 6));
  const primaryId = ids.includes("overall") ? "overall" : ids[0];

  const [hover, setHover] = useState(null);
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width * W;
    let i = Math.round((px - padL) / (W - padL - padR) * (count - 1));
    i = Math.max(0, Math.min(count - 1, i));
    setHover(i);
  };
  const gridY = []; const steps = 4;
  for (let s = 0; s <= steps; s++) gridY.push(lo + (hi - lo) * s / steps);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: "block" }}>
        <defs>
          {SERIES_META.map((s) =>
          <linearGradient key={s.id} id={`g-${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          )}
        </defs>
        {showAxis && gridY.map((gv, i) =>
        <g key={i}>
            <line x1={padL} y1={y(gv)} x2={W - padR} y2={y(gv)} stroke="#e4e7df" strokeWidth="1" />
            <text x={padL - 8} y={y(gv) + 4} textAnchor="end" fontSize="11" fill="#9aa3ad" fontFamily="Hanken Grotesk">{Math.round(gv)}</text>
          </g>
        )}
        {showAxis && labels.map((m, i) =>
        i % labelStep === 0 || i === count - 1 ?
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#9aa3ad" fontFamily="Hanken Grotesk">{m}</text> :
        null
        )}
        {SERIES_META.filter((s) => active.includes(s.id)).map((s) => {
          const series = plot.map((h) => h[s.id] || 0);
          const line = series.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
          const area = `${line} L${x(count - 1)},${H - padB} L${x(0)},${H - padB} Z`;
          const primary = s.id === "overall";
          return (
            <g key={s.id}>
              {primary && active.length <= 2 ? <path d={area} fill={`url(#g-${s.id})`} /> : null}
              <path d={line} fill="none" stroke={s.color} strokeWidth={primary ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" opacity={primary ? 1 : 0.85} />
              {hover != null ? <circle cx={x(hover)} cy={y(series[hover])} r={primary ? 5 : 4} fill="#fff" stroke={s.color} strokeWidth="2.5" /> : null}
            </g>);

        })}
        {hover != null ? <line x1={x(hover)} y1={padT} x2={x(hover)} y2={H - padB} stroke="#cdd4c9" strokeWidth="1" strokeDasharray="3 3" /> : null}
      </svg>
      {hover != null && primaryId ?
      <div className="chart-tip" style={{
        left: `${x(hover) / W * 100}%`, top: `${y(plot[hover][primaryId] || 0) / H * 100}%`,
        opacity: 1, transform: "translate(-50%,-130%)" }}>
          {labels[hover]} · <b>{plot[hover][primaryId] || 0}</b>
        </div> :
      null}
    </div>);

}

Object.assign(window, {
  Icon, TeamsMark, Sidebar, Topbar, Ring, ProgressChart,
  STUDENT, NAV, TRACKS, CURRENT, DECK, DRILLS,
  MONTHS, SERIES, SERIES_META, STR, greeting, todayStr, speak,
  useStats, getStats, setStats, recordActivity, normalizeStats,
  fluencyChange, seriesValue, todayKey,
  useDeck, getDeck, addCard, removeCard, updateCard, suggestCard, translatePhrase,
  useFeed, getFeed, addPost, removePost, updatePost, relTime, fmtWhen,
  INSTRUCTOR, getRole, setRole, useRole, isInstructor, currentUser,
  useAssignments, getAssignments, addAssignment, updateAssignment, removeAssignment,
  useMeetings, getMeetings, addMeeting, updateMeeting, removeMeeting
});