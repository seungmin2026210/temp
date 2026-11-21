import { useEffect, useRef, useState } from "react";
import { PenIcon } from "./Icons.jsx";

export default function DayMemo({ memo, onSave }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const ta = useRef(null);
  useEffect(() => { if (open) ta.current?.focus(); }, [open]);

  const start = () => {
    setText(memo || "");
    setOpen((o) => !o);
  };

  return (
    <section className="memo">
      <div className="ti">
        <div className="nm">오늘의 메모</div>
        <button className="pen" onClick={start} aria-label="오늘의 메모 수정"><PenIcon /></button>
      </div>
      {open ? (
        <>
          <textarea
            ref={ta} aria-label="메모 입력" value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          />
          <div className="rowb">
            <button className="btn" onClick={() => setOpen(false)}>취소</button>
            <button className="btn p" onClick={() => { onSave(text); setOpen(false); }}>저장</button>
          </div>
        </>
      ) : memo ? (
        <div className="note">{memo}</div>
      ) : (
        <div className="empty">아직 메모가 없어요. 연필을 눌러 적어 두세요.</div>
      )}
    </section>
  );
}
