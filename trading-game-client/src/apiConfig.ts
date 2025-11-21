// client/src/apiConfig.ts

// 今が localhost ならローカル用URL、そうでなければCloud Run のURLを使う
export const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8080"
    : "https://trading-game-server-485205903923.asia-northeast1.run.app";

//configの使い方
//localhostかどうかで判別してるので、普通にデプロイするだけで通る
//server deploy: gcloud run deploy trading-game-server --source . --region asia-northeast1 --allow-unauthenticated --project=trading-festival
//client deploy 1)npm run build 2)firebase deploy --only hosting

//gitの手順
//git add .
//git commit -m "変更内容をここに書く"
//git push