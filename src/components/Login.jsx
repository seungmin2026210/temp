import { useState } from "react";
import { PinIcon } from "./Icons.jsx";
import { signIn } from "../auth.js";

const GoogleG = () => (
  <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const go = async () => {
    setBusy(true);
    setErr("");
    try {
      await signIn();
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request")
        setErr("로그인에 실패했어요. 팝업이 막혀 있지 않은지 확인하고 다시 시도해 주세요.");
    }
    setBusy(false);
  };

  return (
    <div className="login">
      <div className="hero">
        <div className="mark"><PinIcon /></div>
        <h1>스페인 여행</h1>
        <p>일정과 메모를 함께 확인해요</p>
      </div>
      <div className="lbox">
        <button className="gbtn" onClick={go} disabled={busy}>
          <GoogleG />
          {busy ? "로그인 중…" : "Google로 계속하기"}
        </button>
        <p className="err" role="alert">{err}</p>
        <p className="hint">허용된 Google 계정으로만 접속할 수 있어요.</p>
      </div>
    </div>
  );
}
