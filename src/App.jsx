// src/App.jsx

import React, { useEffect, useMemo, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  getDocs,       // ← 追加
  writeBatch,    // ← 追加
} from "firebase/firestore";

/* ===== Firebase 設定（そのまま使えます） ===== */
const firebaseConfig = {
  apiKey: "AIzaSyDEpxJ68m7uERr9EnJ3-13ahMhU0DLUWmw",
  authDomain: "eagles-event-appli.firebaseapp.com",
  projectId: "eagles-event-appli",
  storageBucket: "eagles-event-appli.firebasestorage.app",
  messagingSenderId: "908768795767",
  appId: "1:908768795767:web:f54b5e168d0d98d4efba72",
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// --------- 共通値 ---------
const ACCENT = "#2577ff";
const TEXT = "#606060";
const BG = "#ffffff";
const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];
const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [THIS_YEAR, THIS_YEAR + 1, THIS_YEAR + 2];
const GRADES = ["1年", "2年", "3年", "4年", "5年", "6年"];
const GENDERS = ["男子", "女子"];
const ATTEND_STATUSES = ["未回答", "出席","調整中","欠席", "早退", "遅刻"];

// Google Fonts を読み込み
function useNotoSans() {
  useEffect(() => {
    const id = "noto-sans-jp";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);
}

// --------- スタイル（中央配置＆幅統一） ---------
const styles = {

    numBox2: {
   width: 56,
    padding: "8px 10px",
    border: "1px solid #ddd",
    borderRadius: 10,
    textAlign: "center",
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    fontSize: 16,
    fontWeight: 600,
    color: TEXT,
    background: "#fff",
    boxSizing: "border-box",
  },

    // --- 追加：小さめボタン ---
  btnSm: {
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    padding: "8px 10px",
    background: ACCENT,
    color: "#fff",
    borderRadius: 10,
    border: 0,
    width: "auto",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnOutlineSmGray: {
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 8px",
    background: "#f5f5f7",
    color: "#666",
    borderRadius: 10,
    border: "1px solid #cfcfd4",
    width: "auto",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },


  app: {
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    background: "#f5f7fb",
    color: TEXT,
    minHeight: "100svh",
    colorScheme: "light",
    display: "grid",
    placeItems: "start center",
    padding: 16,
    boxSizing: "border-box",
    width: "100%",
  },

  shellBase: { width: "100%" },

  card: {
    width: "clamp(280px, 90vw, 400px)",
    minWidth: 0,
    background: BG,
    borderRadius: 16,
    boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
    padding: "12px 16px 48px",
    boxSizing: "border-box",
    position: "relative",
    margin: "0 auto",
  },

  // タイポ（20 / 18 / 16）
  h1: { fontSize: 20, fontWeight: 700, margin: "4px 0 12px" },
  h2: {
    fontSize: 18,
    fontWeight: 500,
    margin: "20px 0 8px",
    borderLeft: `4px solid ${ACCENT}`,
    paddingLeft: 8,
  },

  row: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },

  input: {
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.6,
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 10,
    outline: "none",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    background: "#fff",
    color: TEXT,
  },
  textarea: {
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.6,
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 10,
    outline: "none",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    background: "#fff",
    color: TEXT,
    minHeight: 160,
    resize: "vertical",
  },
  select: {
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.6,
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 10,
    outline: "none",
    background: "#fff",
    color: TEXT,
    boxSizing: "border-box",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  },

  btn: {
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    fontSize: 16,
    fontWeight: 500,
    padding: "12px 14px",
    background: ACCENT,
    color: "#fff",
    borderRadius: 12,
    border: 0,
    width: "100%",
    cursor: "pointer",
  },
  btnOutline: {
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    fontSize: 16,
    fontWeight: 500,
    padding: "12px 14px",
    background: "#fff",
    color: ACCENT,
    borderRadius: 12,
    border: `1px solid ${ACCENT}`,
    width: "100%",
    cursor: "pointer",
  },

  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "10px 12px",
    border: "1px solid #eee",
    borderRadius: 12,
    background: "#fff",
  },

  hr: { height: 1, background: "#eee", border: 0, margin: "16px 0" },
  pill: {
    display: "inline-block",
    fontSize: 12,
    color: "#fff",
    background: ACCENT,
    borderRadius: 999,
    padding: "3px 8px",
  },
};
// ===== URL/メールを安全寄りに自動リンク化するヘルパー =====
function renderWithLineBreaks(plain) {
  const segments = String(plain || "").split(/\n/);
  return segments.map((seg, idx) =>
    idx === 0 ? (
      seg
    ) : (
      <React.Fragment key={`lb-${idx}`}>
        <br />
        {seg}
      </React.Fragment>
    )
  );
}

function linkify(text) {
  if (!text) return null;
  const pattern = /(https?:\/\/[^\s\u3000]+|www\.[^\s\u3000]+|[\w.+-]+@[\w-]+\.[\w.-]+)/gi;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const urlText = match[0];
    const start = match.index;

    if (start > lastIndex) {
      parts.push(renderWithLineBreaks(text.slice(lastIndex, start)));
    }

    let href = urlText;
    let isEmail = false;

    if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(urlText)) {
      isEmail = true;
      href = `mailto:${urlText}`;
    } else if (/^www\./i.test(urlText)) {
      href = `https://${urlText}`;
    }

    parts.push(
      <a
        key={`link-${start}-${urlText}`}
        href={href}
        target={isEmail ? "_self" : "_blank"}
        rel={isEmail ? undefined : "noopener noreferrer"}
        style={{ textDecoration: "underline", wordBreak: "break-all" }}
      >
        {urlText}
      </a>
    );

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(renderWithLineBreaks(text.slice(lastIndex)));
  }

  return <>{parts}</>;
}


// ステータス別セレクト背景
function statusBg(status) {
  switch (status) {
    case "出席":
      return { backgroundColor: "#E9F2FF", borderColor: "#C9DFFF" };
    case "調整中":
      return { backgroundColor: "#f0fff1ff", borderColor: "#D6E3FF" };
    case "欠席":
      return { backgroundColor: "#FFEAEA", borderColor: "#FFD1D1" };
    case "早退":
    case "遅刻":
      return { backgroundColor: "#FFF7DB", borderColor: "#F2E5A8" };
    default:
      return { backgroundColor: "#fff", borderColor: "#ddd" };
  }
}

const pad2 = (n) => String(n).padStart(2, "0");
const formatEventDate = (evt) => {
  const y = evt.year;
  const base = `${pad2(evt.month)}/${pad2(evt.day)}(${evt.weekday || ""})`;
  return y ? `${y}/${base}` : base;
};


function sortPlayersForList(players) {
  return [...players].sort((a, b) => {
    const ga = parseInt(a.grade);
    const gb = parseInt(b.grade);
    if (ga !== gb) return gb - ga; // 6 → 1
    return (a.name || "").localeCompare(b.name || "");
  });
}

// ---------------- App ----------------
export default function App() {
  useNotoSans();
  
  const [view, setView] = useState("top"); // "top" | "detail" | "uniforms"
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [memos, setMemos] = useState([]);
  const [selectedMemoId, setSelectedMemoId] = useState(null);

  // イベント一覧（複合インデックス: month ASC, day ASC）
  const [events, setEvents] = useState([]);
  useEffect(() => {
const q = query(
  collection(db, "events"),
  orderBy("year", "asc"),
  orderBy("month", "asc"),
  orderBy("day", "asc")
);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(arr);
      },
      (err) => {
        console.error("events onSnapshot error:", err);
        alert("イベント一覧の取得に失敗しました。\n" + err.message);
      }
    );
    return () => unsub();
  }, []);

  // メモ一覧（新しい順）
useEffect(() => {
  const q = query(
    collection(db, "memos"),
    orderBy("createdAt", "desc")
  );
  const unsub = onSnapshot(
    q,
    (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMemos(arr);
    },
    (err) => {
      console.error("memos onSnapshot error:", err);
      alert("メモ一覧の取得に失敗しました。\n" + err.message);
    }
  );
  return () => unsub();
}, []);

  // 選手一覧
  const [players, setPlayers] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "players"),
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPlayers(sortPlayersForList(arr));
      },
      (err) => {
        console.error("players onSnapshot error:", err);
        alert("選手一覧の取得に失敗しました。\n" + err.message);
      }
    );
    return () => unsub();
  }, []);

  const goDetail = (id) => {
    setSelectedEventId(id);
    setView("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const backTop = () => {
    setSelectedEventId(null);
    setView("top");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goUniforms = () => {
    setView("uniforms");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goMemoDetail = (id) => {
  setSelectedMemoId(id);
  setView("memo");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

  return (
    <div style={styles.app} className="eagles-app">
      <style>{`
  .eagles-app input::placeholder,
  .eagles-app textarea::placeholder {
    color: #d3dbf2ff;  /* ← プレースホルダーの色 */
    opacity: 1;      /* ← iPhoneやSafariで薄すぎないように */
  }
`}</style>

      <div style={styles.shellBase}>
        <div style={styles.card}>
          {view === "top" && (
            <TopPage
              events={events}
              players={players}
              memos={memos} 
              onDeleteEvent={async (id) => {
                if (!window.confirm("このイベントを削除しますか？")) return;
                try {
                  await deleteDoc(doc(db, "events", id));
                } catch (e) {
                  console.error(e);
                  alert("イベント削除に失敗しました。\n" + e.message);
                }
              }}
              onOpenDetail={goDetail}
              onOpenUniforms={goUniforms}  
              onOpenMemoDetail={goMemoDetail}
              onDeleteMemo={async (id) => {   // ★ 追加
    if (!window.confirm("このメモを削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "memos", id));
    } catch (e) {
      console.error(e);
      alert("メモ削除に失敗しました。\n" + e.message);
    }
  }}
            />
          )}

          {view === "detail" && selectedEventId && (
            <DetailPage
              eventId={selectedEventId}
              players={players}
              onBack={backTop}
            />
          )}
                    {view === "uniforms" && (
            <UniformPage
              players={players}
              onBack={backTop}
            />
          )}
          {view === "memo" && selectedMemoId && (
  <MemoDetailPage
    memoId={selectedMemoId}
    onBack={backTop}
  />
)}

          
        </div>
      </div>
    </div>
  );
}
async function backfillEventYear(defaultYear = new Date().getFullYear()) {
  try {
    
    const snap = await getDocs(collection(db, "events"));
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d.year == null) {
        batch.update(doc(db, "events", docSnap.id), { year: defaultYear });
      }
    });
    await batch.commit();
    alert("year をバックフィルしました");
  } catch (e) {
    console.error(e);
    alert("バックフィルに失敗しました。\n" + e.message);
  }
  
}



// ---------------- Top Page ----------------
function TopPage({
  events,
  players,
  memos,
  onDeleteEvent,
  onOpenDetail,
  onOpenUniforms,
  onOpenMemoDetail,
  onDeleteMemo
}) {
  // イベント登録フォーム
  const [year, setYear]       = useState("");
  const [month, setMonth]     = useState("");
  const [day, setDay]         = useState("");
  const [weekday, setWeekday] = useState("");
  const [name, setName]       = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  async function registerEvent() {
    if (!year || !month || !day || !weekday || !name.trim()) {
      alert("年・月・日・曜日・イベント名を入力してください。");
      return;
    }
    try {
      setSavingEvent(true);
      await addDoc(collection(db, "events"), {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        weekday,
        name: name.trim(),
        place: "",
        meetTime: "",
        detail: "",
        items: "",
        coachMemo: "",
        escortMemo: "",
        carMemo: "",
        noteMemo: "",
        createdAt: Date.now(),
      });
      setYear(""); setMonth(""); setDay(""); setWeekday(""); setName("");
    } catch (e) {
      console.error("add event error:", e);
      alert("イベントの登録に失敗しました。\n" + e.message);
    } finally {
      setSavingEvent(false);
    }
  }

  // 選手登録
  const [pName, setPName]     = useState("");
  const [pGrade, setPGrade]   = useState("");
  const [pGender, setPGender] = useState("");
  const [savingPlayer, setSavingPlayer] = useState(false);

  async function registerPlayer() {
    if (!pName.trim() || !pGrade || !pGender) {
      alert("名前・学年・性別を入力してください。");
      return;
    }
    try {
      setSavingPlayer(true);
      await addDoc(collection(db, "players"), {
        name: pName.trim(),
        grade: pGrade.replace("年", ""),
        gender: pGender,
        createdAt: Date.now(),
      });
      setPName(""); setPGrade(""); setPGender("");
    } catch (e) {
      console.error("add player error:", e);
      alert("選手の登録に失敗しました。\n" + e.message);
    } finally {
      setSavingPlayer(false);
    }
  }

  const boys  = players.filter((p) => p.gender === "男子");
  const girls = players.filter((p) => p.gender === "女子");

  async function deletePlayer(id) {
    if (!window.confirm("この選手の登録を削除しますか？")) return;
    try { await deleteDoc(doc(db, "players", id)); }
    catch (e) {
      console.error("delete player error:", e);
      alert("選手の削除に失敗しました。\n" + e.message);
    }
  }

  // ---- ここからメモ機能（state / 関数を追加）----
  const [memoName, setMemoName] = useState("");
  const [savingMemo, setSavingMemo] = useState(false);

  async function registerMemo() {
    const name = memoName.trim();
    if (!name) { alert("メモ名を入力してください。"); return; }
    try {
      setSavingMemo(true);
      await addDoc(collection(db, "memos"), {
        name,
        body: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setMemoName("");
    } catch (e) {
      console.error("add memo error:", e);
      alert("メモの登録に失敗しました。\n" + e.message);
    } finally {
      setSavingMemo(false);
    }
  }
  // ---- メモ機能 ここまで ----

  return (
    <>
      <h1 style={styles.h1}>🏀Eaglesイベント管理App</h1>

      {/* イベント登録 */}
      <h2 style={styles.h2}>イベント登録</h2>
      <div className="grid" style={{ display: "grid", gap: 8 }}>
        <div style={styles.row}>
          <select value={year} onChange={(e)=>setYear(e.target.value)} style={styles.select}>
            <option value="">年</option>
            {YEAR_OPTIONS.map((y)=> <option key={y} value={y}>{y}年</option>)}
          </select>
          <select value={month} onChange={(e)=>setMonth(e.target.value)} style={styles.select}>
            <option value="">月</option>
            {Array.from({length:12},(_,i)=>i+1).map(m=> <option key={m} value={m}>{m}月</option>)}
          </select>
          <select value={day} onChange={(e)=>setDay(e.target.value)} style={styles.select}>
            <option value="">日</option>
            {Array.from({length:31},(_,i)=>i+1).map(d=> <option key={d} value={d}>{d}日</option>)}
          </select>
          <select value={weekday} onChange={(e)=>setWeekday(e.target.value)} style={styles.select}>
            <option value="">曜日</option>
            {WEEKDAYS.map(w=> <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        <input style={styles.input} placeholder="イベント名" value={name} onChange={(e)=>setName(e.target.value)} />
        <button style={styles.btn} onClick={registerEvent} disabled={savingEvent}>
          {savingEvent ? "登録中…" : "登録"}
        </button>
      </div>

      <hr style={styles.hr} />

      {/* イベント一覧 */}
      <h2 style={styles.h2}>イベント一覧</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {events.length === 0 && <div style={{ color:"#999", fontSize:14 }}>イベントはまだありません</div>}
        {events.map((evt)=>(
          <div key={evt.id} style={styles.listItem}>
            <button onClick={()=>onDeleteEvent(evt.id)} style={styles.btnOutlineSmGray} title="このイベントを削除">削除</button>
            <div style={{ flex:1, minWidth:0, display:"grid", gap:2, padding:"0 4px" }}>
              <span style={{ fontSize:"13pt", lineHeight:1.2 }}>{formatEventDate(evt)}</span>
              <span style={{ fontSize:16, fontWeight:600, lineHeight:1.4, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                {evt.name || ""}
              </span>
            </div>
            <button onClick={()=>onOpenDetail(evt.id)} style={styles.btnSm} title="詳細を開く">詳細</button>
          </div>
        ))}
      </div>

      <hr style={styles.hr} />

      {/* 選手登録 */}
      <h2 style={styles.h2}>選手登録</h2>
      <div style={{ fontSize:14, marginBottom:8 }}>
        登録合計：<b>男子 {boys.length}名</b> / <b>女子 {girls.length}名</b>
      </div>
      <div style={{ display:"grid", gap:8 }}>
        <input style={styles.input} placeholder="なまえ" maxLength={20} value={pName} onChange={(e)=>setPName(e.target.value)} />
        <div style={styles.row}>
          <select value={pGrade} onChange={(e)=>setPGrade(e.target.value)} style={{ ...styles.select, flex:1 }}>
            <option value="">学年</option>
            {GRADES.map(g=> <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={pGender} onChange={(e)=>setPGender(e.target.value)} style={{ ...styles.select, flex:1 }}>
            <option value="">性別</option>
            {GENDERS.map(g=> <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <button style={styles.btn} onClick={registerPlayer} disabled={savingPlayer}>
          {savingPlayer ? "登録中…" : "登録"}
        </button>
      </div>

      <hr style={styles.hr} />

      {/* 選手一覧 */}
      <h2 style={styles.h2}>選手一覧</h2>
      <div style={{ display:"grid", gap:4, marginBottom:12 }}>
        <div><span style={styles.pill}>男子 合計 {boys.length}名</span></div>
        {sortPlayersForList(boys).map((p)=>(
          <div key={p.id} style={styles.listItem}>
            <div style={{ fontSize:16 }}><b>{p.grade}年</b> {p.name}</div>
            <button onClick={()=>deletePlayer(p.id)} style={{ ...styles.btnOutline, width:"auto", padding:"6px 10px" }}>削除</button>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gap:4 }}>
        <div><span style={styles.pill}>女子 合計 {girls.length}名</span></div>
        {sortPlayersForList(girls).map((p)=>(
          <div key={p.id} style={styles.listItem}>
            <div style={{ fontSize:16 }}><b>{p.grade}年</b> {p.name}</div>
            <button onClick={()=>deletePlayer(p.id)} style={{ ...styles.btnOutline, width:"auto", padding:"6px 10px" }}>削除</button>
          </div>
        ))}
      </div>

      {/* ユニフォーム番号管理 */}
      <div style={{ display:"grid", gap:8, marginTop:8 }}>
        <button style={styles.btnOutline} onClick={onOpenUniforms} title="ユニフォーム番号とビブス番号を管理">
          🎽ユニフォーム番号管理
        </button>
      </div>

      {/* メモ登録 */}
      <hr style={styles.hr} />
      <h2 style={styles.h2}>メモ登録</h2>
      <div className="grid" style={{ display:"grid", gap:8 }}>
        <input
          style={styles.input}
          placeholder="メモ名（チーム共有情報）"
          value={memoName}
          onChange={(e)=>setMemoName(e.target.value)}
        />
        <button style={styles.btn} onClick={registerMemo} disabled={savingMemo}>
          {savingMemo ? "登録中…" : "登録"}
        </button>
      </div>

      {/* メモ一覧 */}
      <hr style={styles.hr} />
      <h2 style={styles.h2}>メモ一覧</h2>
      <div style={{ display:"grid", gap:8 }}>
        {memos.length === 0 && <div style={{ color:"#999", fontSize:14 }}>メモはまだありません</div>}
        {memos.map((m)=>(
          <div key={m.id} style={styles.listItem}>
            <button onClick={()=>onDeleteMemo(m.id)} style={styles.btnOutlineSmGray}>削除</button>
            <div style={{ flex:1, minWidth:0, display:"grid", gap:2, padding:"0 4px" }}>

              <span style={{ fontSize:16, fontWeight:600, lineHeight:1.4, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                {m.name || ""}
              </span>
            </div>
            <button onClick={()=>onOpenMemoDetail(m.id)} style={styles.btnSm}>詳細</button>
          </div>
        ))}
      </div>
    </>
  );
}


// ---------------- Detail Page ----------------
function DetailPage({ eventId, players, onBack }) {
  const [eventData, setEventData] = useState(null);

  // イベント購読
  useEffect(() => {
    const ref = doc(db, "events", eventId);
    const unsub = onSnapshot(
      ref,
      (snap) => setEventData({ id: snap.id, ...snap.data() }),
      (err) => {
        console.error("event detail onSnapshot error:", err);
        alert("イベント詳細の取得に失敗しました。\n" + err.message);
      }
    );
    return () => unsub();
  }, [eventId]);

  // --- 出欠：サーバー値とローカル編集を分離 ---
  const [serverMap, setServerMap] = useState({});
  const [pendingMap, setPendingMap] = useState({});
  const [attendReady, setAttendReady] = useState(false); // 初回ロード完了フラグ

  useEffect(() => {
    const ref = collection(db, "events", eventId, "attendance");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const map = {};
        snap.forEach((d) => (map[d.id] = d.data()));
        setServerMap(map);
        setAttendReady(true);
      },
      (err) => {
        console.error("attendance onSnapshot error:", err);
        alert("出欠情報の取得に失敗しました。\n" + err.message);
      }
    );
    setPendingMap({});
    setAttendReady(false);
    return () => unsub();
  }, [eventId]);

  // 画面表示はローカル優先でマージ
  const uiMap = useMemo(() => ({ ...serverMap, ...pendingMap }), [serverMap, pendingMap]);

  // 入力コントロール
  const [openAttendance, setOpenAttendance] = useState(false); // 出欠入力の開閉
  const [place, setPlace] = useState("");
  const [meetTime, setMeetTime] = useState("");
  const [carCost, setCarCost] = useState(""); // ← 配車代
  const [items, setItems] = useState("");
  const [detail, setDetail] = useState("");
  const [coachMemo, setCoachMemo] = useState("");
  const [escortMemo, setEscortMemo] = useState("");
  const [carMemo, setCarMemo] = useState("");
  const [noteMemo, setNoteMemo] = useState("");

  // 追加：イベント基本情報を編集可能に
  const [eYear, setEYear] = useState("");
  const [eMonth, setEMonth] = useState("");
  const [eDay, setEDay] = useState("");
  const [eWeekday, setEWeekday] = useState("");
  const [eName, setEName] = useState("");

  useEffect(() => {
    if (!eventData) return;
    setPlace(eventData.place || "");
    setMeetTime(eventData.meetTime || "");
    setCarCost(eventData.carCost || ""); // ← 配車代
    setItems(eventData.items || "");
    setDetail(eventData.detail || "");
    setCoachMemo(eventData.coachMemo || "");
    setEscortMemo(eventData.escortMemo || "");
    setCarMemo(eventData.carMemo || "");
    setNoteMemo(eventData.noteMemo || "");

    // 基本情報
    setEYear(String(eventData.year || ""));
    setEMonth(String(eventData.month || ""));
    setEDay(String(eventData.day || ""));
    setEWeekday(eventData.weekday || "");
    setEName(eventData.name || "");
  }, [eventData]);

  // セレクト変更：未保存編集に積む（UI即時反映）
  function updateLocalAttendance(player, status) {
    setPendingMap((prev) => ({
      ...prev,
      [player.id]: {
        ...(prev[player.id] || serverMap[player.id] || {}),
        status,
        gender: player.gender,
        grade: String(player.grade),
        name: player.name,
      },
    }));
  }

// 出席・調整中・遅刻・早退・未回答（男女混合）を集計
const attendanceSummary = useMemo(() => {
  const boys = { present: [], adjust: [], late: [], early: [] };
  const girls = { present: [], adjust: [], late: [], early: [] };
  const unanswered = [];       // 男女まとめの未回答
  // もし欠席も後で出したければ↓を使う
  // const absent = [];

  const sortFn = (a, b) =>
    (b.grade || 0) - (a.grade || 0) ||
    (a.name || "").localeCompare(b.name || "");

  const pushTo = (gender, bucket, item) => {
    if (gender === "男子") boys[bucket].push(item);
    else if (gender === "女子") girls[bucket].push(item);
  };

  // ←★ 正規化：空・未定義・不正値は「未回答」に
  const normalize = (val) => {
    const s = (val ?? "").toString().trim();
    const valid = new Set(["未回答","出席","調整中","欠席","早退","遅刻"]);
    if (!s || !valid.has(s)) return "未回答";
    return s;
  };

  players.forEach((p) => {
    const s = normalize(uiMap[p.id]?.status);
    const item = { name: p.name, grade: Number(p.grade) || 0 };

    if (s === "出席")        pushTo(p.gender, "present", item);
    else if (s === "調整中") pushTo(p.gender, "adjust",  item);
    else if (s === "遅刻")   pushTo(p.gender, "late",    item);
    else if (s === "早退")   pushTo(p.gender, "early",   item);
    else if (s === "欠席")   { /* absent.push(item); */ }   // ←★ 欠席は未回答に入れない
    else /* s === "未回答" */ unanswered.push(item);        // ←★ ここだけ未回答
  });

  [boys.present, boys.adjust, boys.late, boys.early,
   girls.present, girls.adjust, girls.late, girls.early,
   unanswered /*, absent*/].forEach(arr => arr.sort(sortFn));

  const pack = (arr) => ({ count: arr.length, names: arr.map(x => x.name) });

  return {
    boys: {
      present: pack(boys.present),
      adjust:  pack(boys.adjust),
      late:    pack(boys.late),
      early:   pack(boys.early),
    },
    girls: {
      present: pack(girls.present),
      adjust:  pack(girls.adjust),
      late:    pack(girls.late),
      early:   pack(girls.early),
    },
    unanswered: pack(unanswered),
    // absent: pack(absent),
  };
}, [uiMap, players]);



  async function saveAll() {
    // 入力チェック（基本情報）
    if (!eMonth || !eDay || !eWeekday || !eName.trim()) {
      const ok = window.confirm(
        "日付またはイベント名が未入力です。このまま保存しますか？（未入力のままでも保存はできます）"
      );
      if (!ok) return;
    }

    try {
      await updateDoc(doc(db, "events", eventId), {
        // 基本情報も保存
        year: eYear ? Number(eYear) : null,
        month: eMonth ? Number(eMonth) : null,
        day: eDay ? Number(eDay) : null,
        weekday: eWeekday || "",
        name: eName.trim(),

        // 付随情報
        place,
        meetTime,
        carCost, // ← 配車代
        detail,
        items,
        coachMemo,
        escortMemo,
        carMemo,
        noteMemo,
        updatedAt: Date.now(),
      });
      const writes = Object.entries(pendingMap).map(([pid, v]) =>
        setDoc(doc(db, "events", eventId, "attendance", pid), v, { merge: true })
      );
      await Promise.all(writes);
      setPendingMap({});
      alert("登録しました");
    } catch (e) {
      console.error("saveAll error:", e);
      alert("保存に失敗しました。\n" + e.message);
    }
  }

  if (!eventData) return null;

  const currentStatus = (p) => uiMap[p.id]?.status || "未回答";

  return (
    <div>
      <h1 style={styles.h1}>🏀イベント詳細</h1>
      

      <h2 style={styles.h2}>イベント情報</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={styles.row}>
            <select
              style={{ ...styles.select, flex: 1 }}
              value={eYear}
              onChange={(e) => setEYear(e.target.value)}
            >
              <option value="">年</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>

            <select
              style={{ ...styles.select, flex: 1 }}
              value={eMonth}
              onChange={(e) => setEMonth(e.target.value)}
            >
              <option value="">月</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>

            <select
              style={{ ...styles.select, flex: 1 }}
              value={eDay}
              onChange={(e) => setEDay(e.target.value)}
            >
              <option value="">日</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}日</option>
              ))}
            </select>

            <select
              style={{ ...styles.select, flex: 1 }}
              value={eWeekday}
              onChange={(e) => setEWeekday(e.target.value)}
            >
              <option value="">曜日</option>
              {WEEKDAYS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <input
            style={styles.input}
            placeholder="イベント名"
            value={eName}
            onChange={(e) => setEName(e.target.value)}
          />
        </div>
        {/* 登録/戻る（フッター） */}
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <button style={styles.btn} onClick={saveAll}>登録</button>
        <button style={styles.btnOutline} onClick={onBack}>トップページにもどる</button>
      </div>

        <hr style={styles.hr} />

        <h2 style={styles.h2}>選手出欠管理</h2>

        {/* 合計欄（男子→女子、出席→調整中→遅刻→早退 の順） */}
        <div style={{ fontSize: 14, marginBottom: 8, lineHeight: 1.6, width: "100%" }}>
          {[
            ["男子", "出席", attendanceSummary.boys.present],
            ["男子", "調整中", attendanceSummary.boys.adjust],
            ["男子", "遅刻", attendanceSummary.boys.late],
            ["男子", "早退", attendanceSummary.boys.early],
            ["女子", "出席", attendanceSummary.girls.present],
            ["女子", "調整中", attendanceSummary.girls.adjust],
            ["女子", "遅刻", attendanceSummary.girls.late],
            ["女子", "早退", attendanceSummary.girls.early],
          ].map(([gender, label, data]) => (
            <div
              key={`${gender}-${label}`}
              style={{ display: "block", width: "100%", overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              <b>{gender} {label} {data.count}名：</b>
              {attendReady ? (data.names.length ? data.names.join("、") : "—") : "読み込み中…"}
            </div>
          ))}
          {/* 1行空けて未回答を表示（男女まとめ） */}
<div style={{ height: 8 }} />
<div
  style={{ display: "block", width: "100%", overflowWrap: "anywhere", wordBreak: "break-word" }}
>
  <b>未回答 {(attendanceSummary.unanswered?.count ?? 0)}名：</b>
  {attendReady
    ? ((attendanceSummary.unanswered?.names?.length ?? 0) > 0
        ? attendanceSummary.unanswered.names.join("、")
        : "—")
    : "読み込み中…"}
</div>


        </div>

        {/* 出欠入力の開閉トグル */}
        <div style={{ display: "grid", gap: 8, margin: "8px 0 12px" }}>
          <button
            type="button"
            onClick={() => setOpenAttendance((v) => !v)}
            aria-expanded={openAttendance}
            style={{ ...styles.btnOutline, width: "auto", padding: "8px 12px" }}
            title="選手ごとの出欠入力を開閉"
          >
            {openAttendance ? "出欠入力 ▼" : "出欠入力 ▶"}
          </button>
        </div>

        {/* 出欠入力（トグル展開時のみ表示） */}
        {openAttendance && (
          <div data-block="attendance">
            {/* 男子リスト */}
            <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
              <div><span style={styles.pill}>男子</span></div>
              {players
                .filter((p) => p.gender === "男子")
                .sort((a, b) => parseInt(b.grade) - parseInt(a.grade) || (a.name || "").localeCompare(b.name || ""))
                .map((p) => {
                  const cur = currentStatus(p);
                  const colorStyle = statusBg(cur);
                  return (
                    <div key={p.id} style={styles.listItem}>
                      <div style={{ fontSize: 16, marginRight: 8 }}>
                        <b>{p.grade}年</b> {p.name}
                      </div>
                      <select
                        style={{ ...styles.select, ...colorStyle }}
                        value={cur}
                        onChange={(e) => updateLocalAttendance(p, e.target.value)}
                      >
                        {ATTEND_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
            </div>

            {/* 女子リスト */}
            <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
              <div><span style={styles.pill}>女子</span></div>
              {players
                .filter((p) => p.gender === "女子")
                .sort((a, b) => parseInt(b.grade) - parseInt(a.grade) || (a.name || "").localeCompare(b.name || ""))
                .map((p) => {
                  const cur = currentStatus(p);
                  const colorStyle = statusBg(cur);
                  return (
                    <div key={p.id} style={styles.listItem}>
                      <div style={{ fontSize: 16, marginRight: 8 }}>
                        <b>{p.grade}年</b> {p.name}
                      </div>
                      <select
                        style={{ ...styles.select, ...colorStyle }}
                        value={cur}
                        onChange={(e) => updateLocalAttendance(p, e.target.value)}
                      >
                        {ATTEND_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
            </div>

            {/* 登録/戻る（トグル内） */}
            <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
              <button style={styles.btn} onClick={saveAll}>登録</button>
              <button style={styles.btnOutline} onClick={onBack}>トップページにもどる</button>
            </div>
          </div>
        )}


      <h2 style={styles.h2}>参加コーチ名</h2>
      <textarea
        style={{ ...styles.textarea, minHeight: 100 }}
        placeholder="コーチ"
        value={coachMemo}
        onChange={(e) => setCoachMemo(e.target.value)}
      />
      <h2 style={styles.h2}>引率保護者名</h2>
      <textarea
        style={{ ...styles.textarea, minHeight: 100 }}
        placeholder="引率"
        value={escortMemo}
        onChange={(e) => setEscortMemo(e.target.value)}
      />
      <h2 style={styles.h2}>配車OK</h2>
      <textarea
        style={{ ...styles.textarea, minHeight: 100 }}
        placeholder="配車"
        value={carMemo}
        onChange={(e) => setCarMemo(e.target.value)}
      />

      {/* 登録/戻る（フッター） */}
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <button style={styles.btn} onClick={saveAll}>登録</button>
        <button style={styles.btnOutline} onClick={onBack}>トップページにもどる</button>
      </div>

        <hr style={styles.hr} />

        <h2 style={styles.h2}>場所</h2>
        <input
          style={styles.input}
          placeholder="場所"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />

        <h2 style={styles.h2}>時間/集合場所 等</h2>
        <input
          style={styles.input}
          placeholder="時間/集合場所 等"
          value={meetTime}
          onChange={(e) => setMeetTime(e.target.value)}
        />

        <h2 style={styles.h2}>配車代/担当</h2>
        <input
          style={styles.input}
          placeholder="配車代/担当"
          value={carCost}
          onChange={(e) => setCarCost(e.target.value)}
        />

        <h2 style={styles.h2}>その他詳細</h2>
        <textarea
          style={{ ...styles.textarea, minHeight: 1000 }}
          placeholder="もちもの"
          value={items}
          onChange={(e) => setItems(e.target.value)}
        />
    </div>

<h2 style={styles.h2}>その他資料情報＆リンク記入</h2>
<textarea
  style={styles.textarea}
  placeholder="URL"
  value={detail}
  onChange={(e) => setDetail(e.target.value)}
/>

{/* クリック可能なプレビュー */}
<div
  style={{
    marginTop: 8,
    padding: "10px 12px",
    border: "1px dashed #dcdcdc",
    borderRadius: 10,
    background: "#fafbfd",
    whiteSpace: "normal",
    wordBreak: "break-word",
    fontSize: 14,
    lineHeight: 1.6,
  }}
>
  {detail?.trim()
    ? (
      <>
        <div style={{ fontWeight: 600, marginBottom: 6, color: "#5a6b8a" }}>
          リンク生成欄：
        </div>
        {linkify(detail)}
      </>
    )
    : <span style={{ color: "#999" }}>ここに入力するとリンクとして表示されます</span>
  }
</div>




{/* （いまは画面に出さない） */}

{false && (
  <>

      <h2 style={styles.h2}>その他補足</h2>
      <textarea
        style={{ ...styles.textarea, minHeight: 500 }}
        placeholder="その他補足"
        value={noteMemo}
        onChange={(e) => setNoteMemo(e.target.value)}
      />
  </>
      )}

      {/* 登録/戻る（フッター） */}
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <button style={styles.btn} onClick={saveAll}>登録</button>
        <button style={styles.btnOutline} onClick={onBack}>トップページにもどる</button>
      </div>
    </div>
  );
}
// ---------------- UniformPage Page ----------------
function UniformPage({ players, onBack }) {
  // 学年降順（6→1）。同学年は名前の五十音順
  const byGradeDesc = (a, b) =>
    (parseInt(b.grade || 0) - parseInt(a.grade || 0)) ||
    (a.name || "").localeCompare(b.name || "");

  // ローカル編集マップ { playerId: { uniformNo: "00", bibNo: "00" } }
  const [numMap, setNumMap] = useState({});

  // players から初期値をセット（順序は関係なし）
  useEffect(() => {
    const m = {};
    (players || []).forEach(p => {
      m[p.id] = {
        uniformNo: (p.uniformNo ?? "").toString(),
        bibNo: (p.bibNo ?? "").toString(),
      };
    });
    setNumMap(m);
  }, [players]);

  // 男女別に 6年→1年 で並べる（ここが今回のポイント）
  const boys = useMemo(
    () => [...(players || [])].filter(p => p.gender === "男子").sort(byGradeDesc),
    [players]
  );
  const girls = useMemo(
    () => [...(players || [])].filter(p => p.gender === "女子").sort(byGradeDesc),
    [players]
  );

  // 入力値を2桁の数字に（空は許可）
  const sanitize = (value) => value.replace(/\D/g, "").slice(0, 2);
  const pad2 = (s) => (s === "" ? "" : s.padStart(2, "0"));

  const updateField = (pid, key, value) => {
    setNumMap(prev => ({
      ...prev,
      [pid]: { ...(prev[pid] || {}), [key]: sanitize(value) },
    }));
  };

  // 保存
  async function saveAll() {
    try {
      const writes = Object.entries(numMap).map(([pid, val]) => {
        const payload = {};
        if (val.uniformNo !== undefined) {
          const v = sanitize(val.uniformNo);
          payload.uniformNo = v === "" ? "" : pad2(v);
        }
        if (val.bibNo !== undefined) {
          const v = sanitize(val.bibNo);
          payload.bibNo = v === "" ? "" : pad2(v);
        }
        return setDoc(doc(db, "players", pid), payload, { merge: true });
      });
      await Promise.all(writes);
      alert("ユニフォーム／ビブス番号を登録しました");
    } catch (e) {
      console.error(e);
      alert("番号の登録に失敗しました。\n" + e.message);
    }
  }

  const renderList = (list, label) => (
    <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
      <div><span style={styles.pill}>{label}</span></div>
      {list.map((p) => {
        const cur = numMap[p.id] || { uniformNo: "", bibNo: "" };
        return (
          <div key={p.id} style={styles.listItem}>
            <div style={{ fontSize: 16, flex: 1, minWidth: 0 }}>
              <b>{p.grade}年</b> {p.name}
            </div>

            {/* ユニフォーム番号 */}
            <div style={{ display: "grid", gap: 4, justifyItems: "center" }}>
              <small style={{ color: "#666" }}>ユニ</small>
              <input
                inputMode="numeric"
                placeholder="00"
                value={cur.uniformNo}
                onChange={(e) => updateField(p.id, "uniformNo", e.target.value)}
                onBlur={(e) =>
                  updateField(p.id, "uniformNo", pad2(sanitize(e.target.value)))
                }
                style={styles.numBox2}
                aria-label="ユニフォーム番号"
              />
            </div>

            {/* ビブス番号 */}
            <div style={{ display: "grid", gap: 4, justifyItems: "center" }}>
              <small style={{ color: "#666" }}>ビブス</small>
              <input
                inputMode="numeric"
                placeholder="00"
                value={cur.bibNo}
                onChange={(e) => updateField(p.id, "bibNo", e.target.value)}
                onBlur={(e) =>
                  updateField(p.id, "bibNo", pad2(sanitize(e.target.value)))
                }
                style={styles.numBox2}
                aria-label="ビブス番号"
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <h1 style={styles.h1}>🎽 ユニフォーム番号管理</h1>

      <div style={{ fontSize: 14, marginBottom: 8 }}>
        表示順：<b>男子 6→1</b> / <b>女子 6→1</b>
      </div>

      {renderList(boys, "男子")}
      {renderList(girls, "女子")}

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <button style={styles.btn} onClick={saveAll}>登録</button>
        <button style={styles.btnOutline} onClick={onBack}>トップページにもどる</button>
      </div>
    </div>
  );
}
// ---------------- memo Page ----------------
function MemoDetailPage({ memoId, onBack }) {
  const [memo, setMemo] = useState(null);
  const [body, setBody] = useState("");

  useEffect(() => {
    const ref = doc(db, "memos", memoId);
    return onSnapshot(ref, (snap) => {
      const data = { id: snap.id, ...snap.data() };
      setMemo(data);
      setBody(data.body || "");
    });
  }, [memoId]);

  async function save() {
    try {
      await updateDoc(doc(db, "memos", memoId), {
        body,
        updatedAt: Date.now(),
      });
      alert("登録しました");
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。\n" + e.message);
    }
  }

  if (!memo) return null;

  return (
    <div>
      <h1 style={styles.h1}>📝 {memo.name || "メモ"}</h1>
      <textarea
        style={{ ...styles.textarea, minHeight: "70vh" }}
        placeholder="ここに自由に入力"
        value={body}
        onChange={(e)=>setBody(e.target.value)}
      />
      <div style={{ display:"grid", gap:8, marginTop:16 }}>
        <button style={styles.btn} onClick={save}>登録</button>
        <button style={styles.btnOutline} onClick={onBack}>トップページにもどる</button>
      </div>
    </div>
  );
}


