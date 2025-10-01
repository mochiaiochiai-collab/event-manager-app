import React, { useEffect, useMemo, useState } from "react";

/** ================= Firebase設定（そのままでOK） ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDEpxJ68m7uERr9EnJ3-13ahMhU0DLUWmw",
  authDomain: "eagles-event-appli.firebaseapp.com",
  projectId: "eagles-event-appli",
  storageBucket: "eagles-event-appli.firebasestorage.app",
  messagingSenderId: "908768795767",
  appId: "1:908768795767:web:f54b5e168d0d98d4efba72",
};

// CDN import（追加npm不要）
async function loadFirebase() {
  const { initializeApp } = await import(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"
  );
  const firestore = await import(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"
  );
  const app = initializeApp(firebaseConfig);
  const db = firestore.getFirestore(app);
  return { db, ...firestore };
}

/** ================== 最低限のスタイル ================== */
const S = {
  page: {
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,"Noto Sans JP"',
    background: "#f7f7f7",
    minHeight: "100svh",
    padding: 12,
  },
  wrap: { maxWidth: 560, margin: "0 auto" },
  card: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    padding: 14,
    marginBottom: 12,
  },
  h1: { fontSize: 20, fontWeight: 700, margin: "4px 0 12px" },
  h2: { fontSize: 16, fontWeight: 700, margin: "12px 0 6px" },
  row: { display: "flex", gap: 8, alignItems: "center" },
  col: { display: "flex", flexDirection: "column", gap: 8 },
  input: {
    width: "100%",
    fontSize: 16,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
  },
  select: {
    width: "100%",
    fontSize: 16,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    fontSize: 16,
    padding: "12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    resize: "vertical",
  },
  btn: {
    appearance: "none",
    border: "1px solid transparent",
    borderRadius: 999,
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    background: "#fff",
  },
  btnPrimary: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
  btnGhost: { color: "#2563eb", borderColor: "#cfe0ff" },
  btnDanger: { background: "#ef4444", color: "#fff", borderColor: "#ef4444" },
  listItem: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr auto",
    gap: 8,
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #eee",
  },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    background: "#f1f5f9",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 13,
  },
  footerBar: {
    position: "sticky",
    bottom: 0,
    background: "linear-gradient(180deg, rgba(247,247,247,0.6) 0%, #f7f7f7 40%)",
    padding: "10px 0 4px",
    marginTop: 6,
  },
};

/** ===================== メインアプリ ===================== */
export default function App() {
  const [fb, setFb] = useState(null);
  const [ready, setReady] = useState(false);

  // --- Events ---
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("list"); // 'list' | 'detail'
  const [detailId, setDetailId] = useState(null);

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  const [newEvent, setNewEvent] = useState({ date: today, title: "" });
  const [draft, setDraft] = useState({
    id: "",
    date: today,
    title: "",
    note: "",
    attendees: [],
  });

  // --- Roster（選手）---
  const [roster, setRoster] = useState([]); // {id,name,gender:'男子'|'女子'}
  const [newMember, setNewMember] = useState({ name: "", gender: "男子" });

  // Firebase init & subscriptions
  useEffect(() => {
    (async () => {
      const lib = await loadFirebase();
      setFb(lib);

      // events: dateのみで並び替え（登録できないのを回避）
      const evCol = lib.collection(lib.db, "events");
      const evQ = lib.query(evCol, lib.orderBy("date", "asc"));
      const un1 = lib.onSnapshot(evQ, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(list);
      });

      // roster: 名前昇順
      const roCol = lib.collection(lib.db, "roster");
      const roQ = lib.query(roCol, lib.orderBy("name", "asc"));
      const un2 = lib.onSnapshot(roQ, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRoster(list);
      });

      setReady(true);
      return () => {
        un1 && un1();
        un2 && un2();
      };
    })();
  }, []);

  // ====== Events handlers ======
  const openDetail = (id) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setDetailId(id);
    setDraft({
      id,
      date: ev.date || today,
      title: ev.title || "",
      note: ev.note || "",
      attendees: Array.isArray(ev.attendees) ? ev.attendees : [],
    });
    setView("detail");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const addEvent = async () => {
    try {
      if (!newEvent.title.trim()) {
        alert("イベント名を入力してください");
        return;
      }
      const evCol = fb.collection(fb.db, "events");
      await fb.addDoc(evCol, {
        date: newEvent.date || today,
        title: newEvent.title.trim(),
        note: "",
        attendees: [],
        createdAt: fb.serverTimestamp(),
        updatedAt: fb.serverTimestamp(),
      });
      setNewEvent({ date: today, title: "" });
    } catch (err) {
      console.error(err);
      alert("イベントの登録に失敗しました。\n" + (err?.message || ""));
    }
  };

  const deleteEvent = async (id) => {
    try {
      if (!confirm("このイベントを削除しますか？")) return;
      await fb.deleteDoc(fb.doc(fb.db, "events", id));
      if (detailId === id) {
        setView("list");
        setDetailId(null);
      }
    } catch (err) {
      alert("削除に失敗しました。\n" + (err?.message || ""));
    }
  };

  const saveDetail = async () => {
    try {
      if (!draft.id) return;
      const ref = fb.doc(fb.db, "events", draft.id);
      await fb.updateDoc(ref, {
        date: draft.date,
        title: draft.title,
        note: draft.note,
        attendees: draft.attendees,
        updatedAt: fb.serverTimestamp(),
      });
      alert("保存しました");
    } catch (err) {
      alert("保存に失敗しました。\n" + (err?.message || ""));
    }
  };

  // ====== Roster handlers ======
  const addMember = async () => {
    try {
      const name = (newMember.name || "").trim();
      if (!name) {
        alert("選手名を入力してください");
        return;
      }
      const roCol = fb.collection(fb.db, "roster");
      await fb.addDoc(roCol, {
        name,
        gender: newMember.gender || "男子",
        createdAt: fb.serverTimestamp(),
      });
      setNewMember({ name: "", gender: "男子" });
    } catch (err) {
      alert("選手の登録に失敗しました。\n" + (err?.message || ""));
    }
  };

  const deleteMember = async (id) => {
    try {
      await fb.deleteDoc(fb.doc(fb.db, "roster", id));
    } catch (err) {
      alert("削除に失敗しました。\n" + (err?.message || ""));
    }
  };

  // 男女で分けたリスト
  const boys = useMemo(
    () => roster.filter((r) => r.gender === "男子"),
    [roster]
  );
  const girls = useMemo(
    () => roster.filter((r) => r.gender === "女子"),
    [roster]
  );

  // ===== 画面 =====
  if (!ready) {
    return (
      <div style={{ ...S.page, display: "grid", placeItems: "center" }}>
        Firebase を初期化しています…
      </div>
    );
  }

  if (view === "detail" && detailId) {
    return (
      <div style={S.page}>
        <div style={{ ...S.wrap, ...S.col }}>
          {/* 上部：登録ページへ戻る */}
          <div style={{ ...S.row, justifyContent: "space-between" }}>
            <button
              style={{ ...S.btn, ...S.btnGhost }}
              onClick={() => {
                setView("list");
                setDetailId(null);
              }}
            >
              ← 登録ページに戻る
            </button>
          </div>

          <div style={S.card}>
            <div style={S.h1}>イベント詳細</div>

            {/* すべて縦並び */}
            <label>
              <div style={S.h2}>日付</div>
              <input
                type="date"
                style={S.input}
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </label>

            <label>
              <div style={S.h2}>イベント名</div>
              <input
                type="text"
                style={S.input}
                placeholder="例）練習試合 vs ○○"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>

            <section>
              <div style={S.h2}>自由記入（メモ）</div>
              <textarea
                style={S.textarea}
                placeholder="持ち物、集合、補足など"
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            </section>

            <AttendeeEditor draft={draft} setDraft={setDraft} />

            {/* 下部：保存／トップへ */}
            <div style={S.footerBar}>
              <div style={{ ...S.row, gap: 10 }}>
                <button
                  style={{ ...S.btn, ...S.btnPrimary, flex: 1 }}
                  onClick={saveDetail}
                >
                  保存
                </button>
                <button
                  style={{ ...S.btn, ...S.btnGhost, flex: 1 }}
                  onClick={() => {
                    setView("list");
                    setDetailId(null);
                  }}
                >
                  トップへ戻る
                </button>
              </div>
            </div>
          </div>

          <button
            style={{ ...S.btn, ...S.btnDanger }}
            onClick={() => deleteEvent(detailId)}
          >
            このイベントを削除
          </button>
        </div>
      </div>
    );
  }

  // ===== トップ（登録＋一覧＋選手登録） =====
  return (
    <div style={S.page}>
      <div style={S.wrap}>
        {/* イベント登録 */}
        <div style={S.card}>
          <div style={S.h1}>イベント登録</div>
          <div style={S.col}>
            <label>
              <div style={S.h2}>日付</div>
              <input
                type="date"
                style={S.input}
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
              />
            </label>

            <label>
              <div style={S.h2}>イベント名</div>
              <input
                type="text"
                style={S.input}
                placeholder="例）練習（体育館）"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
              />
            </label>

            <div style={{ ...S.row, marginTop: 6 }}>
              <button
                style={{ ...S.btn, ...S.btnPrimary, width: "100%" }}
                onClick={addEvent}
              >
                ＋ 登録する
              </button>
            </div>
          </div>
        </div>

        {/* イベント一覧 */}
        <div style={S.card}>
          <div style={S.h1}>イベント一覧</div>
          {events.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              まだイベントがありません。上のフォームから登録してください。
            </div>
          ) : (
            <div>
              {events.map((ev) => (
                <div key={ev.id} style={S.listItem}>
                  <button
                    onClick={() => openDetail(ev.id)}
                    style={{ ...S.btn, ...S.btnGhost }}
                    title="詳細を開く"
                  >
                    {ev.date}
                  </button>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={ev.title}
                    onClick={() => openDetail(ev.id)}
                  >
                    {ev.title || "（無題）"}
                  </div>
                  <button
                    style={{ ...S.btn, ...S.btnDanger }}
                    onClick={() => deleteEvent(ev.id)}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 選手登録 */}
        <div style={S.card}>
          <div style={S.h1}>選手登録</div>
          <div style={S.col}>
            <label>
              <div style={S.h2}>名前</div>
              <input
                type="text"
                style={S.input}
                placeholder="例）山田 太郎"
                value={newMember.name}
                onChange={(e) =>
                  setNewMember({ ...newMember, name: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && addMember()}
              />
            </label>

            <label>
              <div style={S.h2}>区分</div>
              <select
                style={S.select}
                value={newMember.gender}
                onChange={(e) =>
                  setNewMember({ ...newMember, gender: e.target.value })
                }
              >
                <option>男子</option>
                <option>女子</option>
              </select>
            </label>

            <div style={{ ...S.row, marginTop: 6 }}>
              <button
                style={{ ...S.btn, ...S.btnPrimary, width: "100%" }}
                onClick={addMember}
              >
                ＋ 選手を登録
              </button>
            </div>
          </div>
        </div>

        {/* 男女リスト */}
        <div style={S.card}>
          <div style={S.h1}>選手一覧</div>

          <div style={{ marginBottom: 10, fontWeight: 700 }}>男子</div>
          {boys.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 12 }}>
              未登録
            </div>
          ) : (
            boys.map((m) => (
              <PlayerRow key={m.id} m={m} onDelete={() => deleteMember(m.id)} />
            ))
          )}

          <div style={{ marginTop: 18, marginBottom: 10, fontWeight: 700 }}>
            女子
          </div>
          {girls.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 14 }}>未登録</div>
          ) : (
            girls.map((m) => (
              <PlayerRow key={m.id} m={m} onDelete={() => deleteMember(m.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** ============== 出欠エディタ（縦配置・カウント付き） ============== */
function AttendeeEditor({ draft, setDraft }) {
  const [name, setName] = useState("");

  const add = () => {
    const n = name.trim();
    if (!n) return;
    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: n,
      status: "未定",
    };
    setDraft({ ...draft, attendees: [...draft.attendees, item] });
    setName("");
  };

  const updateStatus = (id, status) => {
    setDraft({
      ...draft,
      attendees: draft.attendees.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    });
  };

  const remove = (id) => {
    setDraft({
      ...draft,
      attendees: draft.attendees.filter((p) => p.id !== id),
    });
  };

  const stats = useMemo(() => {
    const s = { 出席: 0, 欠席: 0, 未定: 0 };
    draft.attendees.forEach((p) => (s[p.status] = (s[p.status] || 0) + 1));
    return s;
  }, [draft.attendees]);

  return (
    <section style={S.col}>
      <div style={S.h2}>出欠</div>

      <div style={S.row}>
        <input
          type="text"
          style={{ ...S.input, flex: 1 }}
          placeholder="参加者名を追加（例：山田 太郎）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button style={{ ...S.btn, ...S.btnGhost }} onClick={add}>
          追加
        </button>
      </div>

      {draft.attendees.length === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 14 }}>
          参加者を追加すると、ここで「出席・欠席・未定」を選べます。
        </div>
      ) : (
        <div style={{ ...S.col, gap: 10 }}>
          {draft.attendees.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 10,
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: 8,
                background: "#fcfcfc",
              }}
            >
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <button
                onClick={() => remove(p.id)}
                style={{ ...S.btn, ...S.btnDanger }}
                title="この参加者を削除"
              >
                削除
              </button>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={S.chipRow}>
                  {["出席", "欠席", "未定"].map((s) => (
                    <label key={s} style={S.chip}>
                      <input
                        type="radio"
                        name={`status-${p.id}`}
                        value={s}
                        checked={p.status === s}
                        onChange={() => updateStatus(p.id, s)}
                        style={{ marginRight: 6 }}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div style={{ ...S.chipRow, marginTop: 2 }}>
            <span style={S.chip}>出席 {stats.出席}</span>
            <span style={S.chip}>欠席 {stats.欠席}</span>
            <span style={S.chip}>未定 {stats.未定}</span>
            <span style={S.chip}>合計 {draft.attendees.length}</span>
          </div>
        </div>
      )}
    </section>
  );
}

/** ============== 選手行コンポーネント ============== */
function PlayerRow({ m, onDelete }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <div>
        <div style={{ fontWeight: 700 }}>{m.name}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{m.gender}</div>
      </div>
      <button style={{ ...S.btn, ...S.btnDanger }} onClick={onDelete}>
        削除
      </button>
    </div>
  );
}
