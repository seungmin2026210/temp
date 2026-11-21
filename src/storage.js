import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장소를 못 쓰는 환경에서는 메모리에만 유지 */
  }
};

/** localStorage에 자동 저장되는 state. */
export function usePersistent(key, initial) {
  const [value, setValue] = useState(() => read(key, initial));
  useEffect(() => write(key, value), [key, value]);
  return [value, setValue];
}

/** 안 선택(1안/2안). 13일 선택은 14일로, 17일은 18일로 이어진다. */
export const OPT_LINK = { d0113: "d0114", d0117: "d0118" };

/**
 * Firestore 컬렉션과 실시간 동기화되는 {id: 문서} 맵.
 * 로컬에도 캐시해 두어 오프라인이나 Firebase 미설정 상태에서도 동작한다.
 * put(id, null)은 문서를 삭제한다.
 */
export function useSyncedMap(name) {
  const [map, setMap] = usePersistent("ses-" + name, {});
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      collection(db, name),
      (snap) => {
        setError(false);
        setMap((m) => {
          const next = { ...m };
          snap.docChanges().forEach((c) => {
            if (c.type === "removed") delete next[c.doc.id];
            else next[c.doc.id] = c.doc.data();
          });
          return next;
        });
      },
      () => setError(true)
    );
  }, [name, setMap]);

  const put = useCallback(
    (id, value) => {
      setMap((m) => {
        const next = { ...m };
        if (value) next[id] = value;
        else delete next[id];
        return next;
      });
      if (!db) return;
      const ref = doc(db, name, id);
      (value ? setDoc(ref, value) : deleteDoc(ref)).catch(() => setError(true));
    },
    [name, setMap]
  );

  return [map, put, error];
}
