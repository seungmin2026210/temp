import { useEffect, useMemo, useRef, useState } from "react";
import { useSchedule } from "./schedule.js";
import { logOut, useAuth } from "./auth.js";
import Login from "./components/Login.jsx";
import { CheckIcon, PenIcon, PlusIcon } from "./components/Icons.jsx";
import MapCard from "./components/MapCard.jsx";
import Timeline from "./components/Timeline.jsx";
import ItemSheet from "./components/ItemSheet.jsx";
import DayMemo from "./components/DayMemo.jsx";
import { K, itemsFor, keyOf, stopsFor } from "./utils.js";
import { auth, db } from "./firebase.js";
import { OPT_LINK, usePersistent, useSyncedMap } from "./storage.js";

const MESSAGES = {
  loading: "일정을 불러오는 중이에요…",
  empty: "DB에 일정이 아직 없어요. scripts/seed.mjs 로 일정을 올려 주세요.",
  error: "일정을 불러오지 못했어요. 이 계정에 권한이 없거나 네트워크 문제일 수 있어요.",
  nodb: "Firebase 설정(.env.local)이 없어요. 일정은 DB에서 불러옵니다.",
};

const Center = ({ children }) => (
  <div className="app"><div className="nomap" style={{ margin: "40vh 20px 0", textAlign: "center" }}>{children}</div></div>
);

/** Firebase 를 쓰면 로그인(허용된 이메일만 DB 접근 가능)을 거친 뒤에야 일정을 불러온다. */
export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <Center>확인하는 중이에요…</Center>;
  if (auth && !user) return <Login />;
  return <Schedule />;
}

/** 일정과 장소는 DB에서 받아 온다. 받기 전에는 안내 문구만 보여 준다. */
function Schedule() {
  const { D, P, status } = useSchedule();
  if (status !== "ready")
    return (
      <Center>
        <p>{MESSAGES[status]}</p>
        {status === "error" && auth && (
          <button className="btn" style={{ marginTop: 12 }} onClick={logOut}>다른 계정으로 로그인</button>
        )}
      </Center>
    );
  return <Trip D={D} P={P} />;
}

function Trip({ D, P }) {
  const dayById = (id) => D.find((d) => d.id === id);
  const [dayId, setDayId] = useState(() => {
    const h = location.hash.slice(1);
    if (dayById(h)) return h;
    const n = new Date();
    const today = "d01" + n.getDate();
    if (n.getFullYear() === 2027 && n.getMonth() === 0 && dayById(today)) return today;
    return D[0].id;
  });
  const [items, putItem, itemsErr] = useSyncedMap("items");
  const [memoDocs, putMemo, memosErr] = useSyncedMap("memos");
  const memos = useMemo(() => Object.fromEntries(Object.entries(memoDocs).map(([k, v]) => [k, v.text])), [memoDocs]);
  const [opts, setOpts] = usePersistent("ses-opts", {});
  const [edit, setEdit] = useState(false);
  const [sheet, setSheet] = useState(null); // {mode: view|edit|add, it}
  const [hl, setHl] = useState(null);
  const hlTimer = useRef(0);

  const day = dayById(dayId) || D[0];
  const opt = day.opt ? (opts[day.id] === 2 ? 2 : 1) : 0;
  const list = useMemo(() => itemsFor(day, opt, items), [day, opt, items]);
  const { groups, num } = useMemo(() => stopsFor(list, P), [list, P]);

  useEffect(() => {
    const onHash = () => {
      const h = location.hash.slice(1);
      if (dayById(h)) setDayId(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [D]);
  useEffect(() => {
    document.body.classList.toggle("lock", !!sheet);
    if (!sheet) return;
    const onKey = (e) => e.key === "Escape" && setSheet(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet]);
  useEffect(() => {
    document.querySelector(`.chip[data-id="${dayId}"]`)?.scrollIntoView({ inline: "center", block: "nearest" });
    window.scrollTo(0, 0);
  }, [dayId]);

  const pickDay = (id) => {
    setDayId(id);
    history.replaceState(null, "", "#" + id);
  };
  const pickOpt = (v) =>
    setOpts((o) => {
      const next = { ...o, [day.id]: v };
      if (OPT_LINK[day.id]) next[OPT_LINK[day.id]] = v;
      return next;
    });

  const saveMemo = (key, text) => {
    const v = (text || "").replace(/\s+$/, "");
    if ((memos[key] || "") === v) return;
    putMemo(key, v ? { text: v, at: new Date().toISOString() } : null);
  };

  const saveItem = (fields, memoText) => {
    const at = new Date().toISOString();
    let key, body;
    if (sheet.mode === "add") {
      key = "add-" + day.id + "-" + Date.now().toString(36);
      body = { type: "add", day: day.id, o: opt || 0, ...fields, at };
    } else {
      key = sheet.it.key;
      body = { ...(items[key] || {}), ...(sheet.it.base ? { type: "ovr", day: day.id } : {}), ...fields, at };
    }
    putItem(key, body);
    saveMemo(key, memoText);
    setSheet(null);
  };

  const deleteItem = () => {
    const it = sheet.it;
    if (it.base) putItem(it.key, { ...(items[it.key] || {}), type: "ovr", day: day.id, del: true, at: new Date().toISOString() });
    else putItem(it.key, null);
    setSheet(null);
  };

  const highlightStop = (k, scroll) => {
    const j = list.findIndex((it) => it.nums.some((x) => x.k === k));
    if (j < 0) return;
    setHl(j);
    if (scroll) document.querySelector(`[data-blk="${j}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    clearTimeout(hlTimer.current);
    hlTimer.current = setTimeout(() => setHl(null), 1800);
  };

  const dayKey = keyOf(day.id, "day");

  return (
    <>
      <div className="app">
        <header>
          <p className="trip">스페인 여행(테스트) · 2027년 1월 11일 – 20일</p>
          <div className="head">
            <h1>{day.city}</h1>
            <div className="when">1월 {day.d}일 ({day.w})</div>
          </div>
          <div className="days" role="tablist" aria-label="날짜 선택">
            {D.map((d) => (
              <button key={d.id} className="chip" role="tab" data-id={d.id} aria-selected={d.id === day.id} onClick={() => pickDay(d.id)}>
                <b>{d.d}</b><span>{d.w}</span>
              </button>
            ))}
          </div>
        </header>

        <main>
          {day.opt && (
            <>
              <div className="seg" role="group" aria-label="일정안 선택">
                {day.opt.map((t, i) => (
                  <button key={t} aria-pressed={opt === i + 1} onClick={() => pickOpt(i + 1)}>{t}</button>
                ))}
              </div>
              <p className="optnote">{day.note[opt - 1] || "기본 일정"}</p>
            </>
          )}

          {groups.length ? (
            groups.map((g) => <MapCard key={g.city + day.id} group={g} num={num} P={P} onPoint={(k) => highlightStop(k, true)} />)
          ) : (
            <div className="nomap">이동하는 날이라 지도에 표시할 장소가 없어요.</div>
          )}

          <div className="th">
            <h2>일정</h2>
            <div className="keys">
              {Object.keys(K).map((k) => (
                <span key={k}><b className={"k-" + k} />{K[k]}</span>
              ))}
            </div>
          </div>
          {edit && <div className="editbar">수정 중이에요. 블록을 누르면 제목과 내용을 고칠 수 있어요.</div>}
          {list.length ? (
            <Timeline
              list={list} memos={memos} editing={edit} highlight={hl}
              onSelect={(it) => setSheet({ mode: edit ? "edit" : "view", it })}
              onNumber={(k) => highlightStop(k, false)}
            />
          ) : (
            <div className="nomap">일정이 없어요. 오른쪽 아래 버튼으로 추가해 보세요.</div>
          )}

          <DayMemo key={day.id} memo={memos[dayKey]} onSave={(t) => saveMemo(dayKey, t)} />
          <p className="sync">
            {itemsErr || memosErr
              ? "공유 저장에 실패해 이 기기에만 저장했어요."
              : db
                ? "수정한 일정과 메모는 이 페이지를 여는 모든 기기에서 함께 보여요."
                : "수정한 일정과 메모는 이 기기에 저장돼요."}
            {auth && <> <button className="pen" style={{ width: "auto", padding: "0 8px", fontSize: 12 }} onClick={logOut}>로그아웃</button></>}
          </p>
        </main>
      </div>

      <div className="fab">
        {edit ? (
          <>
            <button className="fb sub" onClick={() => setSheet({ mode: "add", it: null })}><span>일정 추가</span><i><PlusIcon /></i></button>
            <button className="fb" onClick={() => setEdit(false)}><span>수정 완료</span><i><CheckIcon /></i></button>
          </>
        ) : (
          <button className="fb" aria-label="일정 수정" onClick={() => setEdit(true)}><i><PenIcon /></i></button>
        )}
      </div>

      <div className={sheet ? "open" : ""}>
        <div className="scrim" onClick={() => setSheet(null)} />
        {sheet && (
          <ItemSheet
            key={sheet.it ? sheet.it.key : "new"}
            mode={sheet.mode} item={sheet.it} P={P} memo={sheet.it ? memos[sheet.it.key] : ""}
            onClose={() => setSheet(null)} onSave={saveItem} onDelete={deleteItem}
          />
        )}
      </div>
    </>
  );
}
