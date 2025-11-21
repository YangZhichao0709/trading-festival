import { createPortal } from "react-dom";
import type { Player } from "./constants";

export default function GameEndModal({
  reason,
  player,
  onClose,
}: {
  reason: "end" | "bankrupt";
  player: Player;
  onClose: () => void;
}) {
  const imageUrl =
    reason === "end"
      ? "/images/success.png"
      : "/images/fail.png";

  const title =
    reason === "end"
      ? "🎉 ゲーム終了！おつかれさま！"
      : "💥 破産してしまいました…";

  const subtitle =
    reason === "end"
      ? "最終営業日まで完走しました！"
      : "資産が 0 を下回ったためゲーム終了です。";

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483647,
      }}
    >
      <div
        style={{
          background: "rgb(31,41,55)",
          color: "white",
          width: 520,
          borderRadius: "1rem",
          position: "relative",
          border: "1px solid rgb(75,85,99)",
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
        }}
      >
        {/* × ボタン */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "0.5rem",
            left: "0.5rem",
            width: 32,
            height: 32,
            borderRadius: "9999px",
            background: "rgb(75,85,99)",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        {/* 画像 */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "0.5rem",
            background: "rgb(55,65,81)",
            marginRight: "1.5rem",
            flexShrink: 0,
          }}
        >
          <img
            src={imageUrl}
            alt={reason}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "0.5rem",
            }}
          />
        </div>

        {/* テキスト */}
        <div style={{ flex: 1 }}>
          <h2 style={{ textAlign: "center", marginBottom: "0.5rem", fontSize: "1.25rem" }}>
            {title}
          </h2>

          <p
            style={{
              textAlign: "center",
              marginBottom: "1rem",
              color: "rgb(209,213,219)",
            }}
          >
            {subtitle}
          </p>

          {/* プレイヤー情報 */}
          <div style={{ textAlign: "center", lineHeight: 1.6 }}>
            <div>最終資産：¥{player.totalValue.toLocaleString()}</div>
            <div>
              最終損益：
              <span
                style={{
                  color: player.pnl >= 0 ? "#22c55e" : "#ef4444",
                  fontWeight: "bold",
                }}
              >
                {player.pnl >= 0 ? "+" : "-"}
                {Math.abs(player.pnl).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
