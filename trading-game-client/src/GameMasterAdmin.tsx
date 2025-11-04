import { useState, useEffect } from "react";
import { socket } from "./App"; // Socket.IO インスタンス
import { API_BASE } from "./apiConfig"; //これが8080と開発用サーバを分ける

const SERVER_URL = API_BASE; //ここも

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
    // 🔸 プレイヤー情報更新
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
      setIsRunning(true);
    } catch {
      setMessage("❌ サーバーに接続できません。");
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${SERVER_URL}/game/reset`, { method: "POST" });
      setMessage("🧹 「リセット」コマンドを送信しました。");
      setPlayers({});
      setIsRunning(false);
    } catch {
      setMessage("❌ サーバーに接続できません。");
    }
  };

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

      {/* 操作パネル */}
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
              <th style={{ padding: "12px 15px", textAlign: "left" }}>プレイヤー名 (ID)</th>
              <th style={{ padding: "12px 15px", textAlign: "right" }}>所持現金</th>
              <th style={{ padding: "12px 15px", textAlign: "left" }}>保有株式</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(players).length > 0 ? (
              Object.entries(players).map(([playerName, player]) => (
                <tr key={playerName} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 15px", fontWeight: "bold" }}>{playerName}</td>
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
                      .filter(([_, h]) => h.qty !== 0)
                      .map(([name, h]) => `${name}: ${h.qty}株`)
                      .join(", ") || "なし"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
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
