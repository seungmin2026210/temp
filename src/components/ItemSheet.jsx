import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "./Icons.jsx";
import { K, du, fm, toMin } from "../utils.js";

const KINDS = [["", "장소"], ...Object.entries(K)];

/**
 * 모바일에서 키보드가 올라와도 시트가 화면 안에 머물도록 보이는 영역(visualViewport)을 CSS 변수로 알려 준다.
 * --vvh: 보이는 영역 높이, --kb: 키보드 등이 가리는 아래쪽 높이. (iOS는 키보드가 떠도 레이아웃 화면이 줄지 않는다)
 */
function useVisibleViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement.style;
    const update = () => {
      root.setProperty("--vvh", vv.height + "px");
      root.setProperty("--kb", Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + "px");
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.removeProperty("--vvh");
      root.removeProperty("--kb");
    };
  }, []);
}

export default function ItemSheet({ mode, item, memo, P, onClose, onSave, onDelete }) {
  useVisibleViewport();
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={item ? item.n : "일정 추가"}>
      {mode === "view" ? (
        <View item={item} memo={memo} P={P} onClose={onClose} />
      ) : (
        <Form mode={mode} item={item} memo={memo} onClose={onClose} onSave={onSave} onDelete={onDelete} />
      )}
    </div>
  );
}

function View({ item: it, memo, P, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <>
      <div className="sh">
        <h3>{it.n}</h3>
        <button ref={closeRef} className="x" onClick={onClose} aria-label="닫기"><CloseIcon /></button>
      </div>
      <p className="meta">{fm(it.st)} – {fm(it.en)} · {du(it.en - it.st)}{it.k ? " · " + K[it.k] : ""}</p>
      {it.s && <p className="dsc">{it.s}</p>}
      {it.nums.length > 0 && <p className="meta">{it.nums.map((x) => P[x.k][0]).join(" · ")}</p>}
      <span className="lbl">메모</span>
      <div className="box">
        {memo || <span style={{ color: "var(--mute)" }}>메모가 없어요. 오른쪽 아래 수정 버튼을 눌러 적을 수 있어요.</span>}
      </div>
    </>
  );
}

function Form({ mode, item, memo, onClose, onSave, onDelete }) {
  const [f, setF] = useState({
    n: item?.n ?? "",
    s: item?.s ?? "",
    t: item?.t ? fm(toMin(item.t)) : "",
    e: item?.e ? fm(toMin(item.e)) : "",
    k: item?.k ?? "",
    m: memo ?? "",
  });
  const [err, setErr] = useState("");
  const [armed, setArmed] = useState(false);
  const nameRef = useRef(null);
  // 터치 기기에서는 자동 포커스하지 않는다. (열자마자 키보드가 올라와 화면이 밀리는 것을 방지)
  useEffect(() => {
    if (window.matchMedia?.("(pointer: fine)").matches) nameRef.current?.focus();
  }, []);
  const set = (key) => (e) => setF((x) => ({ ...x, [key]: e.target.value }));

  const submit = () => {
    const n = f.n.trim(), t = f.t.trim(), e = f.e.trim();
    if (!n) return setErr("제목을 적어 주세요.");
    if (!t) return setErr("시작 시간을 골라 주세요.");
    if (e && toMin(e) <= toMin(t)) return setErr("끝 시간은 시작보다 늦어야 해요.");
    onSave({ n, s: f.s.trim(), t, e, k: f.k }, f.m);
  };

  return (
    <>
      <div className="sh">
        <h3>{mode === "add" ? "일정 추가" : "일정 수정"}</h3>
        <button className="x" onClick={onClose} aria-label="닫기"><CloseIcon /></button>
      </div>
      <label className="lbl" htmlFor="f-n">제목</label>
      <input ref={nameRef} type="text" id="f-n" value={f.n} onChange={set("n")} maxLength={80} />
      <label className="lbl" htmlFor="f-s">내용</label>
      <textarea id="f-s" value={f.s} onChange={set("s")} maxLength={400} />
      <div className="two">
        <div>
          <label className="lbl" htmlFor="f-t">시작</label>
          <input type="time" id="f-t" step="1800" value={f.t} onChange={set("t")} />
        </div>
        <div>
          <label className="lbl" htmlFor="f-e">끝</label>
          <input type="time" id="f-e" step="1800" value={f.e} onChange={set("e")} />
        </div>
      </div>
      <span className="lbl">분류</span>
      <div className="kinds" role="group" aria-label="분류">
        {KINDS.map(([k, t]) => (
          <button key={k} aria-pressed={f.k === k} onClick={() => setF((x) => ({ ...x, k }))}>
            <b
              className={"k-" + k}
              style={{
                display: "inline-block", width: 10, height: 10, borderRadius: 3, marginRight: 6,
                border: k ? undefined : "1px solid var(--line2)",
              }}
            />
            {t}
          </button>
        ))}
      </div>
      <label className="lbl" htmlFor="f-m">메모</label>
      <textarea id="f-m" value={f.m} onChange={set("m")} maxLength={2000} />
      <p className="err">{err}</p>
      <div className="rowb">
        {mode === "edit" && (
          <button className={"btn del" + (armed ? " sure" : "")} onClick={() => (armed ? onDelete() : setArmed(true))}>
            {armed ? "한 번 더 누르면 삭제" : "삭제"}
          </button>
        )}
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn p" onClick={submit}>저장</button>
      </div>
    </>
  );
}
