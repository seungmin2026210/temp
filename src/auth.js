import { useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebase.js";

/** 로그인 상태. Firebase 설정이 없으면(auth 없음) 로그인 없이 ready 로 취급한다. */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!auth);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);
  return { user, ready };
}

export const signIn = () => signInWithPopup(auth, new GoogleAuthProvider());
/** 로그아웃하면 이 브라우저에 캐시해 둔 일정·메모도 지운다. (공용 기기 대비) */
export const logOut = async () => {
  await signOut(auth);
  try {
    ["ses-schedule-docs", "ses-places-docs", "ses-items", "ses-memos"].forEach((k) => localStorage.removeItem(k));
  } catch {
    /* 저장소를 못 쓰는 환경이면 무시 */
  }
};
