/*
 * 일정 데이터 형식 예시. (모두 가상의 값)
 * 실제 일정은 이 파일을 private/data.js 로 복사해서 채운 뒤
 *   node --env-file=.env.local scripts/seed.mjs
 * 로 Firestore 에 올린다. private/ 는 .gitignore 에 있어 git에 올라가지 않는다.
 */

/* 지도 장소: [이름, 검색어, 위도, 경도, 숙소(1)] */
export const P = {
  hotel: ["예시 호텔", "Example Hotel", 41.0, 2.0, 1],
  spotA: ["예시 장소 A", "Example Place A", 41.01, 2.01],
};

/* 일정: [시작, 끝, 이름, 설명, 분류(tour|rsv|meal|stay|move), 장소 키, 안(1|2|생략=공통)] */
export const D = [
  { id: "d0101", d: 1, w: "월", city: "예시 도시", items: [
    ["09:00", "10:00", "예시 이동", "", "move"],
    ["10:30", "12:00", "예시 장소 A 방문", "", "", "spotA"],
  ] },
];
