import { useEffect, useMemo, useState } from "react";

/* ===== ここを Firebase コンソールの自分の値に置き換え！ ===== */
const firebaseConfig = {
  apiKey: "AIzaSyDEpxJ68m7uERr9EnJ3-13ahMhU0DLUWmw",
  authDomain: "eagles-event-appli.firebaseapp.com",
  projectId: "eagles-event-appli",
  storageBucket: "eagles-event-appli.firebasestorage.app",
  messagingSenderId: "908768795767",
  appId: "1:908768795767:web:f54b5e168d0d98d4efba72"
};
/* ========================================================== */

/** Firebase（CDN）を動的 import。npm 追加なしでOK */
async function loadFirebase() {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    onSnapshot,
    query,
    orderBy,
  } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  return { db, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, orderBy };
}

const STATUSES = ["出席", "欠席", "未定"];

const initialDetail = {
  title: "",
  month: "",
  day: "",
  place: "",
  info: "",
  meetTime: "",
  items: "",
  coachesParentsNotes: "",
};


export default function App() {
  const [fb, setFb] = useState(null);
  const [ready, setReady] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);
  const [events, setEvents] = useState([]);
  const [roster, setRoster] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", month: "", day: "" });

  const activeEvent = useMemo(() => events.find((e) => e.id === activeEventId) || null, [events, activeEventId]);
  const [detail, setDetail] = useState(initialDetail);


  useEffect(() => {
    (async () => {
      const lib = await loadFirebase();
      setFb(lib);
      setReady(true);

      // 一覧は dateKey（MM-DD）で並べる → 複合インデックス不要
      const evQ = lib.query(lib.collection(lib.db, "events"), lib.orderBy("dateKey"));
      lib.onSnapshot(evQ, (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));

      const roQ = lib.query(lib.collection(lib.db, "roster"), lib.orderBy("name"));
      lib.onSnapshot(roQ, (snap) => setRoster(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    })();
  }, []);

useEffect(() => {
  if (!activeEvent) {
    setDetail(initialDetail);
    return;
  }
  setDetail({
    title: activeEvent.title || "",
    month: activeEvent.month || "",
    day: activeEvent.day || "",
    place: activeEvent.place || "",
    info: activeEvent.info || "",
    meetTime: activeEvent.meetTime || "",
    items: activeEvent.items || "",
    coachesParentsNotes: activeEvent.coachesParentsNotes || "",
  });
}, [activeEvent]);


  if (!ready) return <Center>初期化中…（<code>firebaseConfig</code> を設定してね）</Center>;

  if (!activeEventId) {
    return (
      <Page>
        <Section>
          <H1>🏀 Eaglesオリジナルスケジュールapp</H1>
          <Card style={{ marginTop: 16 }}>
            <H2>＋ イベントを登録（「月・日・イベント名」）</H2>
            <Row>
              <input style={input} placeholder="月(10)" value={newEvent.month}
                     onChange={(e) => setNewEvent({ ...newEvent, month: e.target.value })}/>
              <input style={input} placeholder="日(15)" value={newEvent.day}
                     onChange={(e) => setNewEvent({ ...newEvent, day: e.target.value })}/>
              <input style={{ ...input, flex: 1 }} placeholder="イベント名（例：地区大会）" value={newEvent.title}
                     onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}/>
              <button style={btnPrimary} onClick={async () => {
                const { month, day, title } = newEvent;
                if (!month || !day || !title) return alert("月・日・イベント名は必須です");
                await fb.addDoc(fb.collection(fb.db, "events"), {
                  ...newEvent,
                  dateKey: `${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`,
                  place: "", info: "", meetTime: "", items: "", coachesParentsNotes: "",
                  createdAt: Date.now(),
                });
                setNewEvent({ title: "", month: "", day: "" });
              }}>登録</button>
            </Row>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <H2>📅 イベント一覧</H2>
            {events.length === 0 && <p style={{ color: "#777" }}>まだ登録がありません。</p>}
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
              {events.map((ev) => (
                <li key={ev.id} style={listItem}>
                 <div>
  <b>{pad2(ev.month)}/{pad2(ev.day)}</b> {ev.title}
  {ev.place ? <span style={{ color: "#777" }}>（{ev.place}）</span> : null}
</div>
<button
  style={{ ...btnPrimary, padding: "6px 10px" }}
  onClick={() => setActiveEventId(ev.id)}
>
  詳細を開く
</button>
                  <button style={btnGhost} onClick={async () => {
                    if (!confirm("このイベントを削除しますか？")) return;
                    const resCol = fb.collection(fb.db, `events/${ev.id}/responses`);
                    const snap = await fb.getDocs(resCol);
                    await Promise.all(snap.docs.map((d) => fb.deleteDoc(d.ref)));
                    await fb.deleteDoc(fb.doc(fb.db, "events", ev.id));
                  }}>削除</button>
                </li>
              ))}
            </ul>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <H2>👥 メンバー台帳（選手/コーチ/保護者）</H2>
            <p style={{ color: "#666" }}>ここに登録された <b>選手</b> が出欠表に並びます。</p>
            <RosterManager fb={fb} roster={roster}/>
          </Card>
        </Section>
      </Page>
    );
  }

  return (
    <Page>
      <Section>
        <button style={btnGhost} onClick={() => setActiveEventId(null)}>← 一覧へ戻る</button>
        <H1>📝 イベント詳細</H1>

        <Card style={{ marginTop: 12 }}>
          <H2>概要</H2>
          <Row>
            <input style={smallInput} placeholder="月" value={detail.month}
                   onChange={(e)=>setDetail({ ...detail, month: e.target.value })}/>
            <input style={smallInput} placeholder="日" value={detail.day}
                   onChange={(e)=>setDetail({ ...detail, day: e.target.value })}/>
            <input style={{ ...input, flex: 1 }} placeholder="イベント名" value={detail.title}
                   onChange={(e)=>setDetail({ ...detail, title: e.target.value })}/>
          </Row>
          <Row>
            <input style={{ ...input, flex: 1 }} placeholder="場所（例：○○体育館）" value={detail.place}
                   onChange={(e)=>setDetail({ ...detail, place: e.target.value })}/>
          </Row>
          <Row>
            <textarea style={{ ...textarea, height: 70 }} placeholder="イベント詳細（自由記入）" value={detail.info}
                      onChange={(e)=>setDetail({ ...detail, info: e.target.value })}/>
          </Row>
          <Row>
            <input style={{ ...input, flex: 1 }} placeholder="集合時間（例：8:30 体育館入口）" value={detail.meetTime}
                   onChange={(e)=>setDetail({ ...detail, meetTime: e.target.value })}/>
          </Row>
          <Row>
            <textarea style={{ ...textarea, height: 70 }} placeholder="持ち物（自由記入）" value={detail.items}
                      onChange={(e)=>setDetail({ ...detail, items: e.target.value })}/>
          </Row>
          <Row right>
            <button style={btnPrimary} onClick={async ()=>{
              await fb.updateDoc(fb.doc(fb.db, "events", activeEventId), { ...detail, updatedAt: Date.now(),
                dateKey: `${String(detail.month).padStart(2,"0")}-${String(detail.day).padStart(2,"0")}`,
              });
              alert("保存しました");
            }}>保存</button>
          </Row>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <H2>出欠（選手）</H2>
          <AttendanceTable fb={fb} eventId={activeEventId} members={roster.filter(m=>m.role==="選手")}/>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <H2>コーチ・保護者の出席（自由記入）</H2>
          <textarea style={{ ...textarea, height: 120 }}
                    placeholder="例：コーチ山田：出席／コーチ佐藤：欠席。保護者◯◯さん送迎可 など"
                    value={detail.coachesParentsNotes}
                    onChange={(e)=>setDetail({ ...detail, coachesParentsNotes: e.target.value })}/>
          <Row right>
            <button style={btnPrimary} onClick={async ()=>{
              await fb.updateDoc(fb.doc(fb.db, "events", activeEventId), {
                coachesParentsNotes: detail.coachesParentsNotes, updatedAt: Date.now(),
              });
              alert("保存しました");
            }}>保存</button>
          </Row>
        </Card>
      </Section>
    </Page>
  );
}

/* ---- 出欠テーブル（選手） ---- */
function AttendanceTable({ fb, eventId, members }) {
  const [responses, setResponses] = useState({});
  useEffect(() => {
    if (!fb || !eventId) return;
    const col = fb.collection(fb.db, `events/${eventId}/responses`);
    const unsub = fb.onSnapshot(col, (snap) => {
      const map = {};
      snap.docs.forEach((d) => { const data = d.data(); map[data.name] = { status: data.status || "未定" }; });
      setResponses(map);
    });
    return () => unsub();
  }, [fb, eventId]);

  const setStatus = async (name, status) => {
    const ref = fb.doc(fb.db, `events/${eventId}/responses`, name);
    await fb.setDoc(ref, { name, status, updatedAt: Date.now() }, { merge: true });
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "#f5f5f5" }}>
          <th style={th}>選手名</th><th style={th}>出欠</th></tr></thead>
        <tbody>
        {members.map((m)=>(
          <tr key={m.id} style={{ borderTop: "1px solid #eee" }}>
            <td style={td}>{m.name}</td>
            <td style={td}>
              <select value={responses[m.name]?.status || "未定"}
                      onChange={(e)=>setStatus(m.name, e.target.value)} style={select}>
                {STATUSES.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
          </tr>
        ))}
        {members.length===0 && <tr><td style={td} colSpan={2}>まず「メンバー台帳」で <b>選手</b> を登録してください。</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/* ---- メンバー台帳 ---- */
function RosterManager({ fb, roster }) {
  const [form, setForm] = useState({ name: "", role: "選手" });

  const add = async () => {
    if (!form.name.trim()) return;
    await fb.addDoc(fb.collection(fb.db, "roster"), { name: form.name.trim(), role: form.role, createdAt: Date.now() });
    setForm({ name: "", role: "選手" });
  };
  const remove = async (id) => {
    if (!confirm("このメンバーを削除しますか？")) return;
    await fb.deleteDoc(fb.doc(fb.db, "roster", id));
  };

  return (
    <>
      <Row>
        <input style={{ ...input, flex: 1 }} placeholder="氏名（例：佐藤 太郎）"
               value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })}/>
        <select style={select} value={form.role} onChange={(e)=>setForm({ ...form, role: e.target.value })}>
          <option value="選手">選手</option><option value="コーチ">コーチ</option><option value="保護者">保護者</option>
        </select>
        <button style={btnPrimary} onClick={add}>追加</button>
      </Row>

      <ul style={{ listStyle:"none", padding:0, marginTop:12, border:"1px solid #eee", borderRadius:12 }}>
        {roster.map((m)=>(
          <li key={m.id} style={listItem}>
            <div><b>{m.name}</b> <span style={{ color:"#777", fontSize:12 }}>（{m.role}）</span></div>
            <button style={btnGhost} onClick={()=>remove(m.id)}>削除</button>
          </li>
        ))}
        {roster.length===0 && <li style={{ padding:12, color:"#777" }}>まだ登録がありません。</li>}
      </ul>
    </>
  );
}

/* ---- ちょい可愛い素朴スタイル ---- */
const Page = ({ children }) => <div style={{ minHeight:"100vh", background:"#fafafa", color:"#111", padding:16 }}>{children}</div>;
const Section = ({ children }) => <div style={{ maxWidth:900, margin:"0 auto" }}>{children}</div>;
const Card = ({ children, style }) => <div style={{ background:"#fff", border:"1px solid #eee", borderRadius:16, padding:16, ...style }}>{children}</div>;
const H1 = ({ children }) => <h1 style={{ fontSize:24, margin:0 }}>{children}</h1>;
const H2 = ({ children }) => <h2 style={{ fontSize:18, margin:"4px 0 12px" }}>{children}</h2>;
const Row = ({ children, right=false }) => <div style={{ display:"flex", gap:8, alignItems:"center", justifyContent:right?"flex-end":"flex-start", marginTop:8 }}>{children}</div>;
const Center = ({ children }) => <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#444" }}>{children}</div>;

const input = { padding:"10px 12px", border:"1px solid #ddd", borderRadius:10, width:140 };
const smallInput = { ...input, width:90 };
const textarea = { ...input, width:"100%", resize:"vertical" };
const select = { ...input, width:120, paddingRight:28 };
const btnPrimary = { padding:"10px 14px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:12, cursor:"pointer" };
const btnGhost = { padding:"8px 12px", background:"transparent", color:"#333", border:"1px solid #ddd", borderRadius:10, cursor:"pointer" };
const listItem = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:12, border:"1px solid #eee", borderRadius:12, marginBottom:8, background:"#fff" };
const th = { textAlign:"left", padding:"10px 12px" };
const td = { padding:"10px 12px" };

function pad2(v){ return String(v||"").padStart(2,"0"); }
