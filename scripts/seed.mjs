/*
 * 로컬 일정 원본(private/data.js)을 Firestore 에 올린다.
 *   node --env-file=.env.local scripts/seed.mjs [원본파일경로]
 * - schedule/{날짜id} : 하루 일정
 * - places/{장소키}   : 지도 장소(좌표)
 * 같은 id 는 덮어쓰므로 여러 번 실행해도 중복되지 않는다.
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const src = resolve(process.argv[2] || "private/data.js");
const { D, P } = await import(pathToFileURL(src).href);

const e = process.env;
const db = getFirestore(initializeApp({
  apiKey: e.VITE_FIREBASE_API_KEY, authDomain: e.VITE_FIREBASE_AUTH_DOMAIN, projectId: e.VITE_FIREBASE_PROJECT_ID,
  storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: e.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: e.VITE_FIREBASE_APP_ID,
}));

const jobs = [
  ...Object.entries(P).map(([k, v]) => ["places", k, { name: v[0], query: v[1], lat: v[2], lng: v[3], hotel: !!v[4] }]),
  ...D.map((day) => ["schedule", day.id, {
    id: day.id, day: day.d, weekday: day.w, city: day.city,
    opt: day.opt || [], note: day.note || [],
    items: day.items.map((r) => ({
      start: r[0], end: r[1] || "", name: r[2], desc: r[3] || "", kind: r[4] || "",
      place: r[5] ? [].concat(r[5]) : [], opt: r[6] || 0,
    })),
  }]),
];

let ok = 0;
for (const [col, id, data] of jobs) {
  try { await setDoc(doc(db, col, id), data); ok++; }
  catch (x) { console.error(`FAIL ${col}/${id}: ${x.code}`); process.exit(1); }
}
console.log(`uploaded ${ok}/${jobs.length} (places ${Object.keys(P).length}, schedule ${D.length})`);
process.exit(0);
