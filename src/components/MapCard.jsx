import { useEffect, useMemo, useRef, useState } from "react";
import { PinIcon } from "./Icons.jsx";
import { googleUrl, layoutMap } from "../utils.js";

export default function MapCard({ group, num, P, onPoint }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ W: 0, H: 0 });

  useEffect(() => {
    const el = ref.current;
    const update = () => setSize({ W: el.clientWidth, H: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { W, H } = size;
  const layout = useMemo(() => (W ? layoutMap(W, H, group, P) : null), [W, H, group, P]);
  const uniq = group.seq.filter((k, i, a) => a.indexOf(k) === i);

  return (
    <section className="map">
      <div className="cap">
        {group.city} 동선<small>{group.seq.filter((k) => !P[k][4]).length}곳</small>
      </div>
      <div className="fig">
        <svg ref={ref} role="img" aria-label={`${group.city} 방문 순서 지도`}>
          {layout && <MapDrawing W={W} H={H} layout={layout} num={num} P={P} onPoint={onPoint} />}
        </svg>
      </div>
      <p className="lg">
        {uniq.map((k) => (
          <span key={k}>
            <i className={num[k] === "H" ? "h" : ""}>{num[k]}</i>
            {P[k][0]}
          </span>
        ))}
      </p>
      <a className="gl" href={googleUrl(group.seq, P)} target="_blank" rel="noopener noreferrer">
        <PinIcon />Google 지도에서 순서대로 보기
      </a>
    </section>
  );
}

function MapDrawing({ W, H, layout, num, P, onPoint }) {
  const { pts, pos } = layout;
  const xy = pts.map((p) => pos[p.k]);
  const grid = [];
  for (let i = 24; i < W; i += 40) grid.push(<line key={"x" + i} x1={i} y1={0} x2={i} y2={H} stroke="var(--line)" strokeWidth="1" />);
  for (let j = 24; j < H; j += 40) grid.push(<line key={"y" + j} x1={0} y1={j} x2={W} y2={j} stroke="var(--line)" strokeWidth="1" />);
  const seen = {};
  return (
    <>
      {grid}
      {xy.length > 1 && (
        <polyline
          points={xy.map((p) => p.join(",")).join(" ")}
          fill="none" stroke="var(--acc)" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 5"
        />
      )}
      {pts.map((p, i) => {
        if (seen[p.k]) return null;
        seen[p.k] = true;
        const [x, y] = xy[i];
        const v = num[p.k];
        return (
          <g
            key={p.k} className="pt" tabIndex={0} style={{ cursor: "pointer" }}
            onClick={() => onPoint(p.k)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPoint(p.k); }
            }}
          >
            <title>{P[p.k][0]}</title>
            {v === "H" ? (
              <rect x={x - 12} y={y - 12} width="24" height="24" rx="6" fill="var(--stay-i)" stroke="var(--bg)" strokeWidth="2" />
            ) : (
              <circle cx={x} cy={y} r="13" fill="var(--ink)" stroke="var(--bg)" strokeWidth="2" />
            )}
            <text x={x} y={y + 4.5} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--bg)" fontFamily="Noto Sans KR,sans-serif">
              {v}
            </text>
          </g>
        );
      })}
      <text x={W - 14} y={22} textAnchor="end" fontSize="12" fontWeight="700" fill="var(--mute)">N ↑</text>
    </>
  );
}
