import { useLayoutEffect, useRef } from "react";

/**
 * 제목을 한 줄에 맞춘다. 가용 폭보다 길면 글자 크기를 max → min 사이에서 줄이고,
 * min 으로도 안 들어가면 그때만 줄바꿈한다. (화면 폭, 글자 수가 바뀌면 다시 계산)
 */
export default function FitTitle({ children, max = 30, min = 18 }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.whiteSpace = "nowrap";
      el.style.fontSize = max + "px";
      const avail = el.clientWidth, need = el.scrollWidth;
      if (need <= avail) return;
      const fs = Math.floor(((max * avail) / need) * 10) / 10;
      if (fs >= min) el.style.fontSize = fs + "px";
      else {
        el.style.fontSize = min + "px";
        el.style.whiteSpace = "normal";
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [children, max, min]);

  return <h1 ref={ref} style={{ flex: "1 1 0", overflow: "hidden" }}>{children}</h1>;
}
