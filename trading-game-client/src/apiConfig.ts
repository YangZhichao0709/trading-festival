// client/src/apiConfig.ts

// 今が localhost ならローカル用URL、そうでなければCloud Run のURLを使う
export const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8080"
    : "https://trading-game-server-485205903923.asia-northeast1.run.app";
