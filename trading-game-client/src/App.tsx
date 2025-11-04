import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { UserNameModal } from './UserNameModal';
import { WaitingRoom } from './WaitingRoom'; 
import GameScreen from './GameScreen'; 
import { API_BASE } from "./apiConfig"; //これが8080と開発用サーバを分ける

const SERVER_URL = API_BASE; //ここも

export const socket = io(SERVER_URL, {
  transports: ['websocket'], 
});

function App() {
  // プレイヤー名が入力されたか (初期値: null)
  const [playerName, setPlayerName] = useState<string | null>(null);
  
  // マスターがゲームを開始したか (初期値: false)
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);

  // --- Socketイベントの待機 ---
  useEffect(() => {
    // マスターが「開始」を押したら
    socket.on('game:start', () => {
      console.log('[Socket.IO] "game:start" を受信しました');
      setIsGameStarted(true); // ★ ゲーム開始フラグを立てる
    });

    // マスターが「リセット」を押したら
    socket.on('game:reset', () => {
      console.log('[Socket.IO] "game:reset" を受信しました');
      setIsGameStarted(false); // ★ フラグを倒す
      setPlayerName(null);     // ★ 名前もリセットする
    });
    
    socket.on('connect', () => console.log('[Socket.IO] サーバーに接続しました:', socket.id));
    socket.on('disconnect', () => console.log('[Socket.IO] サーバーから切断されました'));

    // 最初に1回だけ実行
    return () => {
      socket.off('game:start');
      socket.off('game:reset');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []); 

  // --- 画面の分岐ロジック (このロジックは正しいです) ---

  // 1. プレイヤー名がまだ入力されていない場合
  if (playerName === null) {
    return (
      <UserNameModal 
        onConfirm={(name) => setPlayerName(name)} 
      />
    );
  }

  // 2. プレイヤー名は入力済みだが、ゲームはまだ開始していない場合
  if (playerName !== null && isGameStarted === false) {
    return (
      <WaitingRoom playerName={playerName} />
    );
  }

  // 3. プレイヤー名が入力済み AND ゲームが開始している場合
  if (playerName !== null && isGameStarted === true) {
    return (
      <GameScreen playerName={playerName} />
    );
  }

  return <div>読み込み中...</div>;
}

export default App;