export const K = { tour: "투어", rsv: "예약 필요", meal: "식사", stay: "숙소", move: "이동" };
export const keyOf = (a, b) => "ses-" + a + (b ? "-" + b : "");

export const toMin = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m + (h < 5 ? 1440 : 0);
};
export const fm = (m) => {
  m = ((m % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
};
export const du = (m) => {
  const h = Math.floor(m / 60), r = m % 60;
  return (h ? h + "시간" : "") + (h && r ? " " : "") + (r ? r + "분" : "");
};

/** 하루 일정에 사용자의 수정/추가/삭제를 반영해 시간순 목록으로 만든다. */
export function itemsFor(day, opt, items) {
  const out = [];
  day.items.forEach((r, i) => {
    if (r[6] && r[6] !== opt) return;
    const key = keyOf(day.id, "i" + i + (r[6] ? "o" + r[6] : ""));
    const v = items[key] || {};
    if (v.del) return;
    out.push({
      key, base: true,
      t: v.t || r[0],
      e: v.t || v.e != null ? (v.e || "") : r[1],
      n: v.n != null ? v.n : r[2],
      s: v.s != null ? v.s : r[3],
      k: v.k != null ? v.k : r[4] || "",
      p: r[5] ? [].concat(r[5]) : [],
      o: r[6],
    });
  });
  Object.keys(items).forEach((k) => {
    const v = items[k];
    if (v.type === "add" && v.day === day.id && !v.del && (!v.o || v.o === opt))
      out.push({ key: k, t: v.t, e: v.e || "", n: v.n, s: v.s || "", k: v.k || "", p: [], o: v.o });
  });
  out.sort((a, b) => toMin(a.t) - toMin(b.t));
  out.forEach((it, j) => {
    const st = toMin(it.t), nx = out[j + 1] ? toMin(out[j + 1].t) : null;
    let en = it.e ? toMin(it.e) : null;
    if (en != null && en <= st) en = null;
    if (en == null)
      en = st + (it.k === "stay" ? 30 : Math.max(30, Math.min(60, nx == null || nx <= st ? 60 : nx - st)));
    it.st = st;
    it.en = en;
  });
  return out;
}

const cityOf = (P, k) => (P[k][2] > 41 ? "바르셀로나" : P[k][2] > 39 ? "마드리드" : "세비야");

/** 방문 번호와 도시별 동선을 계산한다. (list의 각 항목에 nums를 채운다) P에 없는 장소 키는 건너뛴다. */
export function stopsFor(list, P) {
  const num = {};
  let n = 0;
  const groups = [];
  list.forEach((it) => {
    it.nums = [];
    it.p.filter((k) => P[k]).forEach((k) => {
      const c = cityOf(P, k);
      let g = groups.find((x) => x.city === c);
      if (!g) { g = { city: c, seq: [] }; groups.push(g); }
      if (!(k in num)) num[k] = P[k][4] ? "H" : String(++n);
      it.nums.push({ k, v: num[k] });
      if (g.seq[g.seq.length - 1] !== k) g.seq.push(k);
    });
  });
  return { groups, num };
}

export function googleUrl(seq, P) {
  const q = seq.map((k) => P[k][1]);
  if (q.length === 1) return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q[0]);
  const w = q.slice(1, -1).slice(0, 9);
  return (
    "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(q[0]) +
    "&destination=" + encodeURIComponent(q[q.length - 1]) +
    (w.length ? "&waypoints=" + encodeURIComponent(w.join("|")) : "")
  );
}

/** 위경도 → SVG 좌표. 가까운 점끼리는 서로 밀어낸다. */
export function layoutMap(W, H, g, P) {
  const pts = g.seq.map((k) => ({ k, la: P[k][2], lo: P[k][3] }));
  const lat0 = pts.reduce((a, p) => a + p.la, 0) / pts.length;
  const cx = Math.cos((lat0 * Math.PI) / 180);
  const xs = pts.map((p) => p.lo * cx), ys = pts.map((p) => -p.la);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = 30, sw = Math.max(x1 - x0, 1e-4), sh = Math.max(y1 - y0, 1e-4);
  const sc = Math.min((W - 2 * pad) / sw, (H - 2 * pad) / sh);
  const ox = (W - sw * sc) / 2, oy = (H - sh * sc) / 2;
  const pos = {};
  pts.forEach((p, i) => { if (!pos[p.k]) pos[p.k] = [ox + (xs[i] - x0) * sc, oy + (ys[i] - y0) * sc]; });
  const ks = Object.keys(pos);
  for (let it = 0; it < 40; it++)
    for (let a = 0; a < ks.length; a++)
      for (let b = a + 1; b < ks.length; b++) {
        const A = pos[ks[a]], B = pos[ks[b]];
        let dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
        if (d < 28) {
          if (d < 0.01) { dx = 1; dy = 0; d = 1; }
          const m = (28 - d) / 2;
          A[0] -= (dx / d) * m; A[1] -= (dy / d) * m;
          B[0] += (dx / d) * m; B[1] += (dy / d) * m;
        }
      }
  ks.forEach((k) => {
    pos[k][0] = Math.min(W - 16, Math.max(16, pos[k][0]));
    pos[k][1] = Math.min(H - 16, Math.max(16, pos[k][1]));
  });
  return { pts, pos };
}
