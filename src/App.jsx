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

// ステータス別セレクト背景
function statusBg(status) {
  switch (status) {
    case "出席":
      return { backgroundColor: "#E9F2FF", borderColor: "#C9DFFF" };
    case "調整中":
      return { backgroundColor: "#F0F4FF", borderColor: "#D6E3FF" };
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
const formatEventLine = (evt) =>
  `${evt.month}/${pad2(evt.day)}(${evt.weekday}) ${evt.name || ""}`;

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

  const [view, setView] = useState("top"); // "top" | "detail"
  const [selectedEventId, setSelectedEventId] = useState(null);

  // イベント一覧（複合インデックス: month ASC, day ASC）
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const q = query(
      collection(db, "events"),
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

  return (
    <div style={styles.app}>
      <div style={styles.shellBase}>
        <div style={styles.card}>
          {view === "top" && (
            <TopPage
              events={events}
              players={players}
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
            />
          )}

          {view === "detail" && selectedEventId && (
            <DetailPage
              eventId={selectedEventId}
              players={players}
              onBack={backTop}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Top Page ----------------
function TopPage({ events, players, onDeleteEvent, onOpenDetail }) {
  // イベント登録フォーム
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [weekday, setWeekday] = useState("");
  const [name, setName] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  async function registerEvent() {
    if (!month || !day || !weekday || !name.trim()) {
      alert("月・日・曜日・イベント名を入力してください。");
      return;
    }
    try {
      setSavingEvent(true);
      await addDoc(collection(db, "events"), {
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
      setMonth("");
      setDay("");
      setWeekday("");
      setName("");
    } catch (e) {
      console.error("add event error:", e);
      alert("イベントの登録に失敗しました。\n" + e.message);
    } finally {
      setSavingEvent(false);
    }
  }

  // 選手登録
  const [pName, setPName] = useState("");
  const [pGrade, setPGrade] = useState("");
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
      setPName("");
      setPGrade("");
      setPGender("");
    } catch (e) {
      console.error("add player error:", e);
      alert("選手の登録に失敗しました。\n" + e.message);
    } finally {
      setSavingPlayer(false);
    }
  }

  const boys = players.filter((p) => p.gender === "男子");
  const girls = players.filter((p) => p.gender === "女子");

  // 追加: 選手削除
  async function deletePlayer(id) {
    if (!window.confirm("この選手の登録を削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "players", id));
      // ※出欠サブコレクションはそのまま（必要になったら物理削除のロジックを追加）
    } catch (e) {
      console.error("delete player error:", e);
      alert("選手の削除に失敗しました。\n" + e.message);
    }
  }

  return (
    <>
      <h1 style={styles.h1}>🏀Eaglesイベント管理App</h1>

      {/* イベント登録 */}
      <h2 style={styles.h2}>イベント登録</h2>
      <div className="grid" style={{ display: "grid", gap: 8 }}>
        <div style={styles.row}>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={styles.select}
          >
            <option value="">月</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>

          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            style={styles.select}
          >
            <option value="">日</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}日
              </option>
            ))}
          </select>

          <select
            value={weekday}
            onChange={(e) => setWeekday(e.target.value)}
            style={styles.select}
          >
            <option value="">曜日</option>
            {WEEKDAYS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <input
          style={styles.input}
          placeholder="イベント名"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button style={styles.btn} onClick={registerEvent} disabled={savingEvent}>
          {savingEvent ? "登録中…" : "登録"}
        </button>
      </div>

      <hr style={styles.hr} />

      {/* イベント一覧 */}
      <h2 style={styles.h2}>イベント一覧</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {events.length === 0 && (
          <div style={{ color: "#999", fontSize: 14 }}>イベントはまだありません</div>
        )}
        {events.map((evt) => (
          <div key={evt.id} style={styles.listItem}>
            <button
              onClick={() => onOpenDetail(evt.id)}
              style={{
                background: "transparent",
                border: 0,
                textAlign: "left",
                padding: 0,
                color: TEXT,
                fontSize: 16,
                fontWeight: 500,
                flex: 1,
                cursor: "pointer",
              }}
              title="詳細を開く"
            >
              {formatEventLine(evt)}
            </button>
            <button
              onClick={() => onDeleteEvent(evt.id)}
              style={{ ...styles.btnOutline, width: "auto", padding: "8px 10px" }}
            >
              削除
            </button>
          </div>
        ))}
      </div>

      <hr style={styles.hr} />

      {/* 選手登録 */}
      <h2 style={styles.h2}>選手登録</h2>
      <div style={{ fontSize: 14, marginBottom: 8 }}>
        登録合計：<b>男子 {boys.length}名</b> / <b>女子 {girls.length}名</b>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <input
          style={styles.input}
          placeholder="なまえ"
          maxLength={20}
          value={pName}
          onChange={(e) => setPName(e.target.value)}
        />
        <div style={styles.row}>
          <select
            value={pGrade}
            onChange={(e) => setPGrade(e.target.value)}
            style={{ ...styles.select, flex: 1 }}
          >
            <option value="">学年</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={pGender}
            onChange={(e) => setPGender(e.target.value)}
            style={{ ...styles.select, flex: 1 }}
          >
            <option value="">性別</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <button style={styles.btn} onClick={registerPlayer} disabled={savingPlayer}>
          {savingPlayer ? "登録中…" : "登録"}
        </button>
      </div>

      <hr style={styles.hr} />

      {/* 選手一覧（削除ボタン付き） */}
      <h2 style={styles.h2}>選手一覧</h2>

      <div style={{ display: "grid", gap: 4, marginBottom: 12 }}>
        <div>
          <span style={styles.pill}>男子 合計 {boys.length}名</span>
        </div>
        {sortPlayersForList(boys).map((p) => (
          <div key={p.id} style={styles.listItem}>
            <div style={{ fontSize: 16 }}>
              <b>{p.grade}年</b> {p.name}
            </div>
            <button
              onClick={() => deletePlayer(p.id)}
              style={{ ...styles.btnOutline, width: "auto", padding: "6px 10px" }}
              title="この選手を削除"
            >
              削除
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <div>
          <span style={styles.pill}>女子 合計 {girls.length}名</span>
        </div>
        {sortPlayersForList(girls).map((p) => (
          <div key={p.id} style={styles.listItem}>
            <div style={{ fontSize: 16 }}>
              <b>{p.grade}年</b> {p.name}
            </div>
            <button
              onClick={() => deletePlayer(p.id)}
              style={{ ...styles.btnOutline, width: "auto", padding: "6px 10px" }}
              title="この選手を削除"
            >
              削除
            </button>
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
  const [place, setPlace] = useState("");
  const [meetTime, setMeetTime] = useState("");
  const [items, setItems] = useState("");
  const [detail, setDetail] = useState("");
  const [coachMemo, setCoachMemo] = useState("");
  const [escortMemo, setEscortMemo] = useState("");
  const [carMemo, setCarMemo] = useState("");
  const [noteMemo, setNoteMemo] = useState("");

  // 追加：イベント基本情報を編集可能に
  const [eMonth, setEMonth] = useState("");
  const [eDay, setEDay] = useState("");
  const [eWeekday, setEWeekday] = useState("");
  const [eName, setEName] = useState("");

  useEffect(() => {
    if (!eventData) return;
    setPlace(eventData.place || "");
    setMeetTime(eventData.meetTime || "");
    setItems(eventData.items || "");
    setDetail(eventData.detail || "");
    setCoachMemo(eventData.coachMemo || "");
    setEscortMemo(eventData.escortMemo || "");
    setCarMemo(eventData.carMemo || "");
    setNoteMemo(eventData.noteMemo || "");

    // 基本情報
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

  // 出席・調整中を男女別で集計
const attendanceSummary = useMemo(() => {
  const boysPresent = [];
  const girlsPresent = [];
  const boysAdjust  = [];
  const girlsAdjust = [];

  const sortFn = (a, b) =>
    (b.grade || 0) - (a.grade || 0) ||
    (a.name || "").localeCompare(b.name || "");

  players.forEach((p) => {
    const s = uiMap[p.id]?.status || "未回答";
    const item = { name: p.name, grade: Number(p.grade) || 0 };
    if (s === "出席") {
      if (p.gender === "男子") boysPresent.push(item);
      if (p.gender === "女子") girlsPresent.push(item);
    } else if (s === "調整中") {
      if (p.gender === "男子") boysAdjust.push(item);
      if (p.gender === "女子") girlsAdjust.push(item);
    }
  });

  [boysPresent, girlsPresent, boysAdjust, girlsAdjust].forEach(arr => arr.sort(sortFn));

  return {
    boys: {
      presentCount: boysPresent.length,
      presentNames: boysPresent.map(x => x.name),
      adjustCount:  boysAdjust.length,
      adjustNames:  boysAdjust.map(x => x.name),
    },
    girls: {
      presentCount: girlsPresent.length,
      presentNames: girlsPresent.map(x => x.name),
      adjustCount:  girlsAdjust.length,
      adjustNames:  girlsAdjust.map(x => x.name),
    },
  };
}, [uiMap, players]);


  async function saveAll() {
    // 入力チェック（基本情報）
    if (!eMonth || !eDay || !eWeekday || !eName.trim()) {
      if (
        !window.confirm(
          "日付またはイベント名が未入力です。このまま保存しますか？（未入力のままでも保存はできます）"
        )
      ) {
        return;
      }
    }

    try {
      await updateDoc(doc(db, "events", eventId), {
        // 基本情報も保存
        month: eMonth ? Number(eMonth) : null,
        day: eDay ? Number(eDay) : null,
        weekday: eWeekday || "",
        name: eName.trim(),

        // 付随情報
        place,
        meetTime,
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
    <>
      <h1 style={styles.h1}>🏀イベント詳細</h1>

      <h2 style={styles.h2}>イベント情報</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={styles.row}>
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
        
   <h2 style={styles.h2}>場所</h2>
        <input
          style={styles.input}
          placeholder="場所"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />
         <h2 style={styles.h2}>時間/集合場所/鍵当番 等</h2>
        <input
          style={styles.input}
          placeholder="集合時間"
          value={meetTime}
          onChange={(e) => setMeetTime(e.target.value)}
        />
                 <h2 style={styles.h2}>もちもの</h2>
        <textarea
          style={styles.textarea}
          placeholder="もちもの"
          value={items}
          onChange={(e) => setItems(e.target.value)}
        />
                         <h2 style={styles.h2}>自由記入</h2>
        <textarea
          style={styles.textarea}
          placeholder="自由記入"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
      </div>
            <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <button style={styles.btn} onClick={saveAll}>登録</button>
        <button style={styles.btnOutline} onClick={onBack}>トップページにもどる</button>
      </div>

      <hr style={styles.hr} />

      <h2 style={styles.h2}>選手出欠管理</h2>

{/* 合計欄（男子→女子、出席→調整中 の順） */}
<div style={{ fontSize: 14, marginBottom: 8, lineHeight: 1.6, width: "100%" }}>
  {/* 男子 出席 */}
  <div style={{ display: "block", width: "100%", overflowWrap: "anywhere", wordBreak: "break-word" }}>
    <b>男子 出席 {attendanceSummary.boys.presentCount}名：</b>
    {attendReady
      ? (attendanceSummary.boys.presentNames.length ? attendanceSummary.boys.presentNames.join("、") : "—")
      : "読み込み中…"}
  </div>

  {/* 男子 調整中 */}
  <div style={{ display: "block", width: "100%", overflowWrap: "anywhere", wordBreak: "break-word" }}>
    <b>男子 調整中 {attendanceSummary.boys.adjustCount}名：</b>
    {attendReady
      ? (attendanceSummary.boys.adjustNames.length ? attendanceSummary.boys.adjustNames.join("、") : "—")
      : "読み込み中…"}
  </div>

  {/* 女子 出席 */}
  <div style={{ display: "block", width: "100%", overflowWrap: "anywhere", wordBreak: "break-word" }}>
    <b>女子 出席 {attendanceSummary.girls.presentCount}名：</b>
    {attendReady
      ? (attendanceSummary.girls.presentNames.length ? attendanceSummary.girls.presentNames.join("、") : "—")
      : "読み込み中…"}
  </div>

  {/* 女子 調整中 */}
  <div style={{ display: "block", width: "100%", overflowWrap: "anywhere", wordBreak: "break-word" }}>
    <b>女子 調整中 {attendanceSummary.girls.adjustCount}名：</b>
    {attendReady
      ? (attendanceSummary.girls.adjustNames.length ? attendanceSummary.girls.adjustNames.join("、") : "—")
      : "読み込み中…"}
  </div>
</div>



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
                  {ATTEND_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
                  {ATTEND_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            );
          })}
      </div>

      <hr style={styles.hr} />

      <h2 style={styles.h2}>コーチ出欠</h2>
      <textarea
        style={styles.textarea}
        placeholder="コーチ出欠"
        value={coachMemo}
        onChange={(e) => setCoachMemo(e.target.value)}
      />

      <h2 style={styles.h2}>引率</h2>
      <textarea
        style={styles.textarea}
        placeholder="引率"
        value={escortMemo}
        onChange={(e) => setEscortMemo(e.target.value)}
      />

      <h2 style={styles.h2}>配車</h2>
      <textarea
        style={styles.textarea}
        placeholder="配車"
        value={carMemo}
        onChange={(e) => setCarMemo(e.target.value)}
      />

      <h2 style={styles.h2}>その他補足</h2>
      <textarea
        style={styles.textarea}
        placeholder="その他補足"
        value={noteMemo}
        onChange={(e) => setNoteMemo(e.target.value)}
      />

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <button style={styles.btn} onClick={saveAll}>登録</button>
        <button style={styles.btnOutline} onClick={onBack}>トップページにもどる</button>
      </div>
    </>
  );
}
