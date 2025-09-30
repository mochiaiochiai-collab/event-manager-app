import React, { useEffect, useMemo, useState } from "react";

// ==== Firebase（あなたの値でOK）====
const firebaseConfig = {
  apiKey: "AIzaSyDEpxJ68m7uERr9EnJ3-13ahMhU0DLUWmw",
  authDomain: "eagles-event-appli.firebaseapp.com",
  projectId: "eagles-event-appli",
  storageBucket: "eagles-event-appli.firebasestorage.app",
  messagingSenderId: "908768795767",
  appId: "1:908768795767:web:f54b5e168d0d98d4efba72",
};

// Firestore を CDN から読み込み（npm依存なし / JSオンリー）
async function loadFirebase() {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    onSnapshot,
    setDoc,
  } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  return { db, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot, setDoc };
}

// ===== 定数（JSのみ）=====
const STATUSES = ["出席", "欠席", "遅刻", "早退"]; // プルダウンの選択肢

// 見た目の共通クラス（Tailwindが無くても動作しますが、あれば色が出ます）
const inputBase = "border border-gray-300 bg-white rounded-lg px-3 py-2 w-full";
const btnBlue = "px-4 py-2 rounded-xl bg-blue-600 text-white active:scale-[0.99] disabled:opacity-50";
const card = "bg-white rounded-2xl shadow p-4";

export default function App() {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [fb, setFb] = useState(null);

  const [events, setEvents] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [roster, setRoster] = useState([]); // {id, name, role, gender}

  // 画面モード（トップ=登録/一覧、詳細）
  const [mode, setMode] = useState("list");

  // イベント登録（モバイル優先：月/日/曜/タイトル）
  const [newEvent, setNewEvent] = useState({ title: "", month: "", day: "", weekday: "" });

  // 新規選手
  const [newMember, setNewMember] = useState({ name: "", gender: "男子" });

  // アクティブイベント
  const activeEvent = useMemo(() => events.find((e) => e.id === activeId) || null, [events, activeId]);

  // 詳細（場所・補足・集合時間・持ち物＋メモ3種）
  const initialDetail = {
    title: "",
    month: "",
    day: "",
    weekday: "",
    place: "",
    info: "",
    meetTime: "",
    items: "",
    coachNotes: "",
    carpool: "",
    escort: "",
  };
  const [detail, setDetail] = useState(initialDetail);

  useEffect(() => {
    (async () => {
      const lib = await loadFirebase();
      setFb(lib);
      setFirebaseReady(true);

      // events
      const evCol = lib.collection(lib.db, "events");
      lib.onSnapshot(evCol, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort(
          (a, b) =>
            Number(a.month || 0) - Number(b.month || 0) ||
            Number(a.day || 0) - Number(b.day || 0)
        );
        setEvents(list);
      });

      // roster
      const roCol = lib.collection(lib.db, "roster");
      lib.onSnapshot(roCol, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setRoster(list);
      });
    })();
  }, []);

  // イベント選択時に詳細へ
  useEffect(() => {
    if (!activeEvent) { setDetail(initialDetail); return; }
    setDetail({
      title: activeEvent.title || "",
      month: activeEvent.month || "",
      day: activeEvent.day || "",
      weekday: activeEvent.weekday || "",
      place: activeEvent.place || "",
      info: activeEvent.info || "",
      meetTime: activeEvent.meetTime || "",
      items: activeEvent.items || "",
      coachNotes: activeEvent.coachNotes || "",
      carpool: activeEvent.carpool || "",
      escort: activeEvent.escort || "",
    });
  }, [activeEvent]);

  if (!firebaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Firebase を初期化しています…
      </div>
    );
  }

  // ===== CRUD =====
  const addEvent = async () => {
    const { title, month, day } = newEvent;
    if (!title || !month || !day) return alert("イベント名・月・日を入力してください");
    await fb.addDoc(fb.collection(fb.db, "events"), { ...newEvent, createdAt: Date.now() });
    setNewEvent({ title: "", month: "", day: "", weekday: "" });
  };

  const saveDetails = async () => {
    if (!activeEvent) return;
    await fb.updateDoc(fb.doc(fb.db, "events", activeEvent.id), { ...detail, updatedAt: Date.now() });
    alert("保存しました");
  };

  const removeEvent = async (id) => {
    if (!confirm("このイベントを削除しますか？出欠情報も失われます。")) return;
    const resCol = fb.collection(fb.db, `events/${id}/responses`);
    const resSnap = await fb.getDocs(resCol);
    await Promise.all(resSnap.docs.map((d) => fb.deleteDoc(d.ref)));
    await fb.deleteDoc(fb.doc(fb.db, "events", id));
    if (activeId === id) setActiveId(null);
  };

  const addMember = async () => {
    if (!newMember.name.trim()) return;
    await fb.addDoc(fb.collection(fb.db, "roster"), {
      name: newMember.name.trim(),
      role: "選手",
      gender: newMember.gender, // 「男子」「女子」
      createdAt: Date.now(),
    });
    setNewMember({ name: "", gender: "男子" });
  };

  const removeMember = async (id) => {
    if (!confirm("このメンバーを削除しますか？")) return;
    await fb.deleteDoc(fb.doc(fb.db, "roster", id));
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <div className="mx-auto max-w-md sm:max-w-2xl space-y-6">
        {/* ヘッダー */}
        <header className="sticky top-0 z-10 bg-sky-600 text-white rounded-2xl px-4 py-3 shadow">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏀</span>
            <h1 className="font-semibold">Eaglesオリジナルスケジュールapp</h1>
          </div>
        </header>

        {/* ====== Top（イベント登録 & イベント一覧） ====== */}
        <section className={card} style={{ display: mode === "list" ? "block" : "none" }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">📅 イベント登録</h2>

          {/* 月/日/曜 → タイトル → 登録 */}
          <div className="grid grid-cols-4 gap-2 items-center mb-2">
            <select className={inputBase} style={{ width: 64 }} value={newEvent.month}
              onChange={(e) => setNewEvent({ ...newEvent, month: onlyNum(e.target.value) })}>
              <option value="">月</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
              ))}
            </select>
            <select className={inputBase} style={{ width: 64 }} value={newEvent.day}
              onChange={(e) => setNewEvent({ ...newEvent, day: onlyNum(e.target.value) })}>
              <option value="">日</option>
              {Array.from({ length: 31 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
              ))}
            </select>
            <select className={inputBase} style={{ width: 64 }} value={newEvent.weekday}
              onChange={(e) => setNewEvent({ ...newEvent, weekday: e.target.value })}>
              <option value="">曜</option>
              {"日月火水木金土".split("").map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <div className="col-span-4 sm:col-span-1 hidden sm:block" />
          </div>

          <div className="flex gap-2 mb-3">
            <input className={`${inputBase} flex-1`} placeholder="イベント名"
              value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
            <button className={btnBlue} onClick={addEvent}>登録</button>
          </div>

          <h3 className="text-base font-semibold mb-2 flex items-center gap-2">≡ イベント一覧</h3>
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="rounded-xl bg-blue-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setActiveId(ev.id);
                      setMode("detail");
                      setTimeout(() => document.getElementById("detailTop")?.scrollIntoView({ behavior: "smooth" }), 0);
                    }}
                    className="text-left flex-1"
                  >
                    <div className="font-medium text-sm">{fmtDate(ev.month, ev.day, ev.weekday)}　{ev.title}</div>
                  </button>
                  <div className="flex items-center gap-2">
                    <button title="詳細" className="text-sm border rounded-lg px-2 py-1 bg-white"
                      onClick={() => {
                        setActiveId(ev.id);
                        setMode("detail");
                        setTimeout(() => document.getElementById("detailTop")?.scrollIntoView({ behavior: "smooth" }), 0);
                      }}>↻</button>
                    <button title="削除" className="text-sm border rounded-lg px-2 py-1 bg-white"
                      onClick={() => removeEvent(ev.id)}>✖</button>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && <p className="text-sm text-gray-500">イベントがまだありません。上で登録してください。</p>}
          </div>
        </section>

        {/* ====== 詳細（場所・補足・集合時間・持ち物） ====== */}
        <section className="space-y-6">
          <div className={card} id="detailTop" style={{ display: mode === "detail" ? "block" : "none" }}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">📋 イベント詳細</h2>
            {!activeEvent ? (
              <p className="text-sm text-gray-500">イベント一覧から選んでください。</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-50 px-3 py-2 font-semibold">
                  {fmtDate(detail.month, detail.day, detail.weekday)}　{detail.title}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <input className={inputBase} placeholder="場所"
                    value={detail.place} onChange={(e) => setDetail({ ...detail, place: e.target.value })} />
                  <textarea className={inputBase} placeholder="補足" rows={3}
                    value={detail.info} onChange={(e) => setDetail({ ...detail, info: e.target.value })} onInput={autoGrow} />
                  <input className={inputBase} placeholder="集合時間"
                    value={detail.meetTime} onChange={(e) => setDetail({ ...detail, meetTime: e.target.value })} />
                  <textarea className={inputBase} placeholder="持ち物" rows={3}
                    value={detail.items} onChange={(e) => setDetail({ ...detail, items: e.target.value })} onInput={autoGrow} />
                </div>
                <div className="flex justify-end"><button className={btnBlue} onClick={saveDetails}>保存</button></div>
              </div>
            )}
          </div>

          {/* ====== 出欠（男子・女子 + 合計） ====== */}
          {mode === "detail" && activeEvent && (
            <div className={card}>
              <h2 className="text-lg font-semibold mb-3">🧒 選手出欠</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AttendanceTable title="男子" fb={fb} eventId={activeEvent.id}
                  members={roster.filter((m) => (m.role === "選手" || m.role === "子ども") && m.gender === "男子")} />
                <AttendanceTable title="女子" fb={fb} eventId={activeEvent.id}
                  members={roster.filter((m) => (m.role === "選手" || m.role === "子ども") && m.gender === "女子")} />
              </div>
            </div>
          )}

          {/* ====== メモ（参加コーチ / 引率 / 配車） ====== */}
          {mode === "detail" && activeEvent && (
            <div className={card}>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">🙋 参加コーチ</h3>
                  <textarea className={inputBase} placeholder="コーチ名" rows={3}
                    value={detail.coachNotes} onChange={(e) => setDetail({ ...detail, coachNotes: e.target.value })} onInput={autoGrow} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">🐇 引率</h3>
                  <textarea className={inputBase} placeholder="保護者名" rows={3}
                    value={detail.escort} onChange={(e) => setDetail({ ...detail, escort: e.target.value })} onInput={autoGrow} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">🚗 配車</h3>
                  <textarea className={inputBase} placeholder="配車メモ" rows={3}
                    value={detail.carpool} onChange={(e) => setDetail({ ...detail, carpool: e.target.value })} onInput={autoGrow} />
                </div>
                <div className="flex justify-end"><button className={btnBlue} onClick={saveDetails}>保存</button></div>
              </div>
            </div>
          )}

          {/* ====== Top（選手登録＆一覧） ====== */}
          <div className={card} style={{ display: mode === "list" ? "block" : "none" }}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">🤖 選手登録</h2>
            <div className="flex gap-2 mb-3">
              <input className={`${inputBase} flex-1`} placeholder="なまえ"
                value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
              <select className={inputBase} value={newMember.gender}
                onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}>
                <option value="男子">男・女</option>
                <option value="男子">男子</option>
                <option value="女子">女子</option>
              </select>
              <button className={btnBlue} onClick={addMember}>登録</button>
            </div>

            <h3 className="text-base font-semibold mb-2 flex items-center gap-2">≡ 選手一覧</h3>
            <PlayersGroup
              title="男子" colorClass="bg-green-100"
              count={roster.filter((m) => (m.role === "選手" || m.role === "子ども") && m.gender === "男子").length}
              list={roster.filter((m) => (m.role === "選手" || m.role === "子ども") && m.gender === "男子")}
              onRemove={removeMember}
            />
            <PlayersGroup
              title="女子" colorClass="bg-orange-100"
              count={roster.filter((m) => (m.role === "選手" || m.role === "子ども") && m.gender === "女子").length}
              list={roster.filter((m) => (m.role === "選手" || m.role === "子ども") && m.gender === "女子")}
              onRemove={removeMember}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function PlayersGroup({ title, colorClass, count, list, onRemove }) {
  return (
    <div className="mb-4">
      <div className={`flex items-center justify-between rounded-xl px-3 py-2 mb-2 ${colorClass}`}>
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-gray-600">{count}人</span>
      </div>
      <ul className="space-y-2">
        {list.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-3 py-2 border rounded-xl bg-white">
            <span className="font-medium">{m.name}</span>
            <button className="text-sm border rounded-lg px-3 py-1 bg-white" onClick={() => onRemove(m.id)}>削除</button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="px-3 py-2 text-sm text-gray-500 border rounded-xl bg-white">該当なし</li>
        )}
      </ul>
    </div>
  );
}

function fmtDate(month, day, weekday) {
  const mm = month ? String(month).padStart(2, "0") : "--";
  const dd = day ? String(day).padStart(2, "0") : "--";
  const w = weekday ? `(${weekday})` : "";
  return `${mm}/${dd}${w}`;
}
function onlyNum(v) { return v.replace(/[^0-9]/g, ""); }
function autoGrow(e) { const ta = e.currentTarget; ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight}px`; }
function rowBg(status) {
  if (status === "出席") return "bg-sky-100";
  if (status === "欠席") return "bg-red-50";
  if (status === "遅刻" || status === "早退") return "bg-yellow-50";
  return "bg-white";
}
function AttendanceTable({ title, fb, eventId, members }) {
  const [responses, setResponses] = useState({});
  useEffect(() => {
    if (!fb || !eventId) return;
    const col = fb.collection(fb.db, `events/${eventId}/responses`);
    const unsub = fb.onSnapshot(col, (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[data.name] = { status: data.status || "" };
      });
      setResponses(map);
    });
    return () => unsub();
  }, [fb, eventId]);

  const setStatus = async (name, status) => {
    const qdoc = fb.doc(fb.db, `events/${eventId}/responses`, name);
    await fb.setDoc(qdoc, { name, status, updatedAt: Date.now() }, { merge: true });
  };
  const totalAttend = members.reduce(
    (acc, m) => (responses[m.name] && responses[m.name].status === "出席" ? acc + 1 : acc), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-sm text-gray-600">出席: <span className="font-bold">{totalAttend}</span> 人</span>
      </div>
      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-3 py-2 w-1/2">名前</th>
              <th className="text-left px-3 py-2">出欠</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const s = (responses[m.name] && responses[m.name].status) || "";
              return (
                <tr key={m.id} className={`border-t ${rowBg(s)}`}>
                  <td className="px-3 py-2 font-medium">{m.name}</td>
                  <td className="px-3 py-2">
                    <select className={`${inputBase} py-1`} value={s}
                      onChange={(e) => setStatus(m.name, e.target.value)}>
                      <option value="">選択</option>
                      {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr><td className="px-3 py-4 text-gray-500" colSpan={2}>メンバーがいません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
