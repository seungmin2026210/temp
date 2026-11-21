import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase.js";
import { usePersistent } from "./storage.js";

/*
 * 일정과 지도 장소는 코드가 아니라 Firestore 에서 읽는다.
 *   schedule/{날짜id} : 하루 일정      places/{장소키} : 지도 장소(좌표)
 * 마지막으로 받은 내용은 localStorage 에 캐시해 두어, 해외에서 데이터가 불안정해도 열린다.
 * (캐시는 이 브라우저에만 남고 git·배포물에는 포함되지 않는다.)
 */

/** schedule 문서들 → 화면에서 쓰는 날짜 배열. 항목은 [시작, 끝, 이름, 설명, 분류, 장소키[], 안] */
const toDays = (docs) =>
  Object.values(docs)
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((d) => ({
      id: d.id, d: d.day, w: d.weekday, city: d.city,
      ...(d.opt?.length ? { opt: d.opt, note: d.note || [] } : {}),
      items: (d.items || []).map((r) => [
        r.start, r.end || "", r.name, r.desc || "", r.kind || "",
        r.place?.length ? r.place : undefined, r.opt || undefined,
      ]),
    }));

/** places 문서들 → {장소키: [이름, 검색어, 위도, 경도, 숙소(1)]} */
const toPlaces = (docs) =>
  Object.fromEntries(Object.entries(docs).map(([k, v]) => [k, [v.name, v.query, v.lat, v.lng, v.hotel ? 1 : 0]]));

const snapshotMap = (snap) => Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));

/** status: "loading" | "ready" | "empty" | "error" | "nodb" */
export function useSchedule() {
  const [dayDocs, setDayDocs] = usePersistent("ses-schedule-docs", {});
  const [placeDocs, setPlaceDocs] = usePersistent("ses-places-docs", {});
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!db) return;
    let got = 0;
    const done = () => ++got === 2 && setSynced(true);
    const fail = () => setError(true);
    const un1 = onSnapshot(collection(db, "schedule"), (s) => { setError(false); setDayDocs(snapshotMap(s)); done(); }, fail);
    const un2 = onSnapshot(collection(db, "places"), (s) => { setError(false); setPlaceDocs(snapshotMap(s)); done(); }, fail);
    return () => { un1(); un2(); };
  }, [setDayDocs, setPlaceDocs]);

  const D = useMemo(() => toDays(dayDocs), [dayDocs]);
  const P = useMemo(() => toPlaces(placeDocs), [placeDocs]);

  let status = "ready";
  if (!D.length) status = !db ? "nodb" : error ? "error" : synced ? "empty" : "loading";
  return { D, P, status };
}
