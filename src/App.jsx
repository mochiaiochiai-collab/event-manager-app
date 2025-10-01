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

/* ===== Firebase 設定（そのまま使用できます） ===== */
const firebaseConfig = {
  apiKey: "AIzaSyDEpxJ68m7uERr9EnJ3-13ahMhU0DLUWmw",
  authDomain: "eagles-event-appli.firebaseapp.com",
  projectId: "eagles-event-appli",
  storageBucket: "eagles-event-appli.firebasestorage.app",
  messagingSenderId: "908768795767",
  appId: "1:908768795767:web:f54b5e168d0d98d4efba72",
};
/* =============================================== */

// 既に初期化済みでもOKにする
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ------------- 共通定義 -------------
const ACCENT = "#2577ff";
const TEXT = "#606060";
const BG = "#ffffff";
const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];
const GRADES = ["1年", "2年", "3年", "4年", "5年", "6年"];
const GENDERS = ["男子", "女子"];
const ATTEND_STATUSES = ["未回答", "出席", "欠席", "早退", "遅刻"];

// Google Fonts 読み込み
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

// ミニCSS
const styles = {
  app: {
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    background: BG,
    color: TEXT,
    minHeight: "100svh",
  },
  wrap: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "12px 16px 48px",
  },
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
    fontSize: 16,
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 10,
    outline: "none",
    width: "100%",
  },
  select: {
    fontSize: 16,
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 10,
    outline: "none",
    background: "#fff",
  },
  btn: {
    fontSize: 16,
    fontWeight: 500,
    padding: "12px 14px",
    background: ACCENT,
    color: "#fff",
    borderRadius: 12,
    border: 0,
    width: "100%",
  },
  btnOutline: {
    fontSize: 16,
    fontWeight: 500,
    padding: "12px 14px",
    background: "#fff",
    color: ACCENT,
    borderRadius: 12,
    border: `1px solid ${ACCENT}`,
    width: "100%",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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

  // イベント一覧（※複合 orderBy。where を付けてないのでインデックス不要）
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
      <div style={styles.wrap}>
        {view === "top" && (
          <TopPage
            events={events}
            players={players}
            onDeleteEvent={async (id) => {
              if (!window.confirm("このイベントを削除しますか？")) return;
              try {
                await deleteDoc(doc(db, "events", id));
              } catch (e) {
                console.error("delete event error:", e);
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
      // 入力リセット
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

  return (
    <>
      <h1 style={styles.h1}>イベント管理App</h1>

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

      {/* 選手一覧 */}
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

  // 出欠サブコレクション
  const [attendMap, setAttendMap] = useState({});
  useEffect(() => {
    const ref = collection(db, "events", eventId, "attendance");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const map = {};
        snap.forEach((d) => (map[d.id] = d.data()));
        setAttendMap(map);
      },
      (err) => {
        console.error("attendance onSnapshot error:", err);
        alert("出欠情報の取得に失敗しました。\n" + err.message);
      }
    );
    return () => unsub();
  }, [eventId]);

  // 入力コントロール
  const [place, setPlace] = useState("");
  const [meetTime, setMeetTime] = useState("");
  const [detail, setDetail] = useState("");
  const [items, setItems] = useState("");
  const [coachMemo, setCoachMemo] = useState("");
  const [escortMemo, setEscortMemo] = useState("");
  const [carMemo, setCarMemo] = useState("");
  const [noteMemo, setNoteMemo] = useState("");

  useEffect(() => {
    if (!eventData) return;
    setPlace(eventData.place || "");
    setMeetTime(eventData.meetTime || "");
    setDetail(eventData.detail || "");
    setItems(eventData.items || "");
    setCoachMemo(eventData.coachMemo || "");
    setEscortMemo(eventData.escortMemo || "");
    setCarMemo(eventData.carMemo || "");
    setNoteMemo(eventData.noteMemo || "");
  }, [eventData]);

  const boys = useMemo(
    () => sortPlayersForList(players.filter((p) => p.gender === "男子")),
    [players]
  );
  const girls = useMemo(
    () => sortPlayersForList(players.filter((p) => p.gender === "女子")),
    [players]
  );

  const boysPresent = useMemo(
    () =>
      Object.values(attendMap).filter(
        (v) => v.gender === "男子" && v.status === "出席"
      ).length,
    [attendMap]
  );
  const girlsPresent = useMemo(
    () =>
      Object.values(attendMap).filter(
        (v) => v.gender === "女子" && v.status === "出席"
      ).length,
    [attendMap]
  );

  function updateLocalAttendance(player, status) {
    setAttendMap((prev) => ({
      ...prev,
      [player.id]: {
        status,
        gender: player.gender,
        grade: `${player.grade}年`,
        name: player.name,
      },
    }));
  }

  async function saveAll() {
    try {
      await updateDoc(doc(db, "events", eventId), {
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

      const writes = Object.entries(attendMap).map(([pid, v]) =>
        setDoc(doc(db, "events", eventId, "attendance", pid), v, { merge: true })
      );
      await Promise.all(writes);

      alert("登録しました");
    } catch (e) {
      console.error("saveAll error:", e);
      alert("保存に失敗しました。\n" + e.message);
    }
  }

  if (!eventData) return null;

  return (
    <>
      <h1 style={styles.h1}>イベント詳細</h1>

      <h2 style={styles.h2}>イベント情報</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 16 }}>
          <b>
            {eventData.month}/{pad2(eventData.day)}({eventData.weekday})
          </b>{" "}
          {eventData.name}
        </div>

        <input
          style={styles.input}
          placeholder="場所"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="集合時間"
          value={meetTime}
          onChange={(e) => setMeetTime(e.target.value)}
        />
        <textarea
          style={{ ...styles.input, minHeight: 80 }}
          placeholder="詳細"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
        <textarea
          style={{ ...styles.input, minHeight: 80 }}
          placeholder="もちもの"
          value={items}
          onChange={(e) => setItems(e.target.value)}
        />
      </div>

      <hr style={styles.hr} />

      <h2 style={styles.h2}>選手出欠管理</h2>
      <div style={{ fontSize: 14, marginBottom: 8 }}>
        出席合計：<b>男子 {boysPresent}名</b> / <b>女子 {girlsPresent}名</b>
      </div>

      {/* 男子 */}
      <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
        <div>
          <span style={styles.pill}>男子</span>
        </div>
        {boys.map((p) => {
          const current = attendMap[p.id]?.status || "未回答";
          return (
            <div key={p.id} style={styles.listItem}>
              <div style={{ fontSize: 16, marginRight: 8 }}>
                <b>{p.grade}年</b> {p.name}
              </div>
              <select
                style={styles.select}
                value={current}
                onChange={(e) => updateLocalAttendance(p, e.target.value)}
              >
                {ATTEND_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* 女子 */}
      <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
        <div>
          <span style={styles.pill}>女子</span>
        </div>
        {girls.map((p) => {
          const current = attendMap[p.id]?.status || "未回答";
          return (
            <div key={p.id} style={styles.listItem}>
              <div style={{ fontSize: 16, marginRight: 8 }}>
                <b>{p.grade}年</b> {p.name}
              </div>
              <select
                style={styles.select}
                value={current}
                onChange={(e) => updateLocalAttendance(p, e.target.value)}
              >
                {ATTEND_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <hr style={styles.hr} />

      <h2 style={styles.h2}>コーチ出欠</h2>
      <textarea
        style={{ ...styles.input, minHeight: 80 }}
        placeholder="コーチ出欠"
        value={coachMemo}
        onChange={(e) => setCoachMemo(e.target.value)}
      />

      <h2 style={styles.h2}>引率</h2>
      <textarea
        style={{ ...styles.input, minHeight: 80 }}
        placeholder="引率"
        value={escortMemo}
        onChange={(e) => setEscortMemo(e.target.value)}
      />

      <h2 style={styles.h2}>配車</h2>
      <textarea
        style={{ ...styles.input, minHeight: 80 }}
        placeholder="配車"
        value={carMemo}
        onChange={(e) => setCarMemo(e.target.value)}
      />

      <h2 style={styles.h2}>その他補足</h2>
      <textarea
        style={{ ...styles.input, minHeight: 80 }}
        placeholder="その他補足"
        value={noteMemo}
        onChange={(e) => setNoteMemo(e.target.value)}
      />

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <button style={styles.btn} onClick={saveAll}>
          登録
        </button>
        <button style={styles.btnOutline} onClick={onBack}>
          トップページにもどる
        </button>
      </div>
    </>
  );
}
