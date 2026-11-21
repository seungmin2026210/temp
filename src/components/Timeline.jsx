import { NoteIcon } from "./Icons.jsx";
import { K, du, fm } from "../utils.js";

export default function Timeline({ list, memos, editing, highlight, onSelect, onNumber }) {
  const s0 = Math.floor(Math.min(...list.map((x) => x.st)) / 30) * 30;
  const s1 = Math.ceil(Math.max(...list.map((x) => x.en)) / 30) * 30;
  const rows = (s1 - s0) / 30;

  const cells = [];
  for (let r = 0; r < rows; r++) {
    const m = s0 + r * 30, hr = m % 60 === 0;
    cells.push(
      <div key={"r" + r} className={"rc" + (hr ? " hr" : "")} style={{ gridRow: r + 1 }}>{fm(m)}</div>,
      <div key={"l" + r} className={"lc" + (hr ? " hr" : "")} style={{ gridRow: r + 1 }} />
    );
  }

  return (
    <div className={"tl" + (editing ? " editing" : "")}>
      {cells}
      {list.map((it, j) => {
        const a = (it.st - s0) / 30 + 1, b = (it.en - s0) / 30 + 1;
        const memo = memos[it.key];
        return (
          <button
            key={it.key}
            data-blk={j}
            className={"blk" + (it.k ? " k-" + it.k : "") + (highlight === j ? " hl" : "")}
            style={{ gridRow: `${a} / ${b}` }}
            aria-label={`${fm(it.st)}부터 ${fm(it.en)}까지 ${it.n}`}
            onClick={(e) => {
              const num = e.target.closest(".no i");
              if (num && !editing) return onNumber(num.dataset.k);
              onSelect(it);
            }}
          >
            <div className="bt">
              {it.nums.length > 0 && (
                <span className="no">
                  {it.nums.map((x) => (
                    <i key={x.k} className={x.v === "H" ? "h" : ""} data-k={x.k}>{x.v}</i>
                  ))}
                </span>
              )}
              <span className="nm">{it.n}</span>
            </div>
            {it.s && <div className="bs">{it.s}</div>}
            {memo && (
              <div className="bmemo">
                <span className="mk"><NoteIcon /></span>
                <span>{memo}</span>
              </div>
            )}
            {b - a >= 3 && (
              <div className="bm">
                <span className="tg">{it.k ? K[it.k] : ""}</span>
                <span>{du(it.en - it.st)}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
