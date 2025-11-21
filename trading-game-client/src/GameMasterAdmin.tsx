import { useState, useEffect } from "react";
import { socket } from "./App"; 
import { API_BASE } from "./apiConfig"; 

const SERVER_URL = API_BASE; 

// === 型定義 ===
type Position = { qty: number; avgPrice: number };
type Player = {
  cash: number;
  holdings: Record<string, Position>; 
  totalValue: number; 
  pnl: number;     
};

type AllPlayers = Record<string, Player>; 

// === コンポーネント本体 ===
export function GameMasterAdmin() {
  const [players, setPlayers] = useState<AllPlayers>({});
  const [message, setMessage] = useState("接続待機中...");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // --- Socket.IO 初期化 ---
  useEffect(() => {
    // 🔸 プレイヤー情報更新 (player:join, trade, game loop でブロードキャスト)
    const handlePlayersUpdate = (allPlayers: AllPlayers) => {
      setPlayers(allPlayers);
      if (error) setError("");
    };

    // 🔸 ゲーム開始
    const handleGameStart = () => {
      setMessage("🎮 ゲームが開始されました！");
      setIsRunning(true);
    };

    // 🔸 ゲームリセット
    const handleGameReset = () => {
      setMessage("🧹 ゲームがリセットされました。待機中です。");
      setPlayers({});
      setIsRunning(false);
    };

    // 🔸 接続系
    const handleConnect = () => {
      setError("");
      setMessage("✅ サーバーに接続しました。");
    };
    const handleConnectError = () => {
      setError("⚠️ WebSocketサーバーに接続できません。");
      setMessage("❌ 接続エラー");
    };

    // --- イベント登録 ---
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("players:update", handlePlayersUpdate);
    socket.on("game:start", handleGameStart);
    socket.on("game:reset", handleGameReset);

    // --- クリーンアップ ---
    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("players:update", handlePlayersUpdate);
      socket.off("game:start", handleGameStart);
      socket.off("game:reset", handleGameReset);
    };
  }, [error]);

  // --- API 呼び出し ---
  const handleStart = async () => {
    try {
      await fetch(`${SERVER_URL}/game/start`, { method: "POST" });
      setMessage("🎯 「ゲーム開始」コマンドを送信しました。");
    } catch {
      setMessage("❌ サーバーに接続できません。");
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${SERVER_URL}/game/reset`, { method: "POST" });
      setMessage("🧹 「リセット」コマンドを送信しました。");
    } catch {
      setMessage("❌ サーバーに接続できません。");
    }
  };

  // --- ★ 修正: プレイヤーリストを総資産(totalValue)で並び替え ---
  const sortedPlayerEntries = Object.entries(players).sort(
    // a がプレイヤーデータ, b がプレイヤーデータ
    // b.totalValue - a.totalValue で「降順」（多い順）
    ([_nameA, playerA], [_nameB, playerB]) => {
      return playerB.totalValue - playerA.totalValue;
    }
  );


  // --- 表示 ---
  return (
    <div
      style={{
        padding: "30px",
        backgroundColor: "#f7fafc",
        minHeight: "100vh",
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <h1 style={{ color: "#1a202c", fontSize: "2.25rem", fontWeight: "bold" }}>
        ★★★ ゲームマスター管理画面 ★★★
      </h1>

      {/* 操作パネル*/}
      <div
        style={{
          margin: "30px 0",
          padding: "20px",
          backgroundColor: "#fff0f0",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        <button
          onClick={handleStart}
          disabled={isRunning}
          style={{
            padding: "15px 30px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: "white",
            backgroundColor: isRunning ? "#9ae6b4" : "#38a169",
            border: "none",
            borderRadius: "8px",
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
        >
          {isRunning ? "ゲーム実行中..." : "ゲーム開始"}
        </button>

        <button
          onClick={handleReset}
          style={{
            padding: "15px 30px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: "white",
            backgroundColor: "#c53030",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginLeft: "10px",
          }}
        >
          リセット（待機画面に戻す）
        </button>

        {message && (
          <p
            style={{
              color: "#2b6cb0",
              marginTop: "15px",
              fontWeight: "bold",
              whiteSpace: "pre-line",
            }}
          >
            {message}
          </p>
        )}
      </div>

      {/* プレイヤー一覧 */}
      <div style={{ margin: "30px 0" }}>
        <h2 style={{ color: "#2d3748" }}>プレイヤー状況（リアルタイム更新）</h2>

        {error && (
          <p
            style={{
              color: "#c53030",
              backgroundColor: "#fed7d7",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            {error}
          </p>
        )}

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
          }}
        >
          <thead style={{ backgroundColor: "#4a5568", color: "white" }}>
            <tr>
              <th style={{ padding: "12px 15px", textAlign: "left" }}>ランク</th>
              <th style={{ padding: "12px 15px", textAlign: "left" }}>プレイヤー名</th>
              <th style={{ padding: "12px 15px", textAlign: "right" }}>総資産</th>
              <th style={{ padding: "12px 15px", textAlign: "right" }}>評価損益 (PnL)</th>
              <th style={{ padding: "12px 15px", textAlign: "right" }}>所持現金</th>
              <th style={{ padding: "12px 15px", textAlign: "left" }}>保有株式</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayerEntries.length > 0 ? (
              sortedPlayerEntries.map(([playerName, player], index) => (
                <tr 
                  key={playerName} 
                  style={{ 
                    borderBottom: "1px solid #e2e8f0",
                    // 1位の行を目立たせる (例: 背景色を薄い黄色に)
                    backgroundColor: index === 0 ? "#fffbeb" : "transparent"
                  }}
                >
                  {/* ★ 修正: ランク表示セル を追加 */}
                  <td style={{ 
                    padding: "12px 15px", 
                    fontWeight: "bold", 
                    textAlign: "center",
                    color: index === 0 ? "#d69e2e" : (index === 1 ? "#718096" : (index === 2 ? "#b7791f" : "#4a5568"))
                  }}>
                    {/* 1位, 2位, 3位にメダルを付ける (絵文字) */}
                    {index === 0 ? "🥇" : (index === 1 ? "🥈" : (index === 2 ? "🥉" : index + 1))}
                  </td>

                  <td style={{ padding: "12px 15px", fontWeight: "bold" }}>{playerName}</td>
                  
                  {/* ★ 修正: 「総資産」セル */}
                  <td
                    style={{
                      padding: "12px 15px",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: "bold", // 1番重要な指標なので太字
                      fontSize: "1.05rem", // 少し大きく
                    }}
                  >
                    {player.totalValue.toLocaleString()} 円
                  </td>

                  {/* ★ 修正: 「PnL」セル */}
                  <td
                    style={{
                      padding: "12px 15px",
                      textAlign: "right",
                      fontFamily: "monospace",
                    // PnL がマイナスなら赤、プラスなら緑
                      color: player.pnl < 0 ? "#c53030" : (player.pnl > 0 ? "#38a169" : "#4a5568"),
                    }}
                  >
                  {/* プラスの場合も + を表示 */}
                    {player.pnl >= 0 ? "+" : ""}{player.pnl.toLocaleString()} 円
                  </td>

                  {/* ★ 修正: 「所持現金」セル (PnLの後ろに移動) */}
                  <td
                    style={{
                      padding: "12px 15px",
                      textAlign: "right",
                      fontFamily: "monospace",
                    }}
                  >
                    {player.cash.toLocaleString()} 円
                  </td>

                  <td style={{ padding: "12px 15px" }}>
                    {Object.entries(player.holdings)
                      .filter(([_, h]) => h.qty !== 0) // 0株のものは表示しない
                      .map(([name, h]) => `${name}: ${h.qty}株`)
                      .join(", ") || "なし"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6} // ★ 修正: 列が増えたので 6
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#718096",
                  }}
                >
                  {error ? "データを取得できませんでした。" : "待機中のプレイヤーはいません。"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}