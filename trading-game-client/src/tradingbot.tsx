import { useState } from "react";

export default function TradingBotPage() {
  const [actions] = useState([
    "SEMI を 30株 BUY",
    "USDJPY を 15% SHORT",
    "AUTO を 20株 SELL",
  ]);

  const [aiComment] = useState("市場の勢いが強いので、短期的にSEMIを買い増しします！");

  return (
    <div
      style={{
        background: "#0f172a",
        color: "white",
        width: "100vw",
        height: "100vh",
        padding: "1.5rem 2rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "0.58fr 0.42fr",
          gap: "1.8rem",
          height: "100%",
        }}
      >

        {/* ------------------------------- */}
        {/* 上段左：行動ログ（大きめ） */}
        {/* ------------------------------- */}
        <div
          style={{
            border: "2px solid #334155",
            borderRadius: "12px",
            padding: "1.2rem",
            overflow: "auto",
            fontSize: "1.15rem",
          }}
        >
          <h2 className="text-2xl font-bold mb-4">📘 AI の行動ログ</h2>

          <div style={{ lineHeight: "2rem" }}>
            {actions.map((a, i) => (
              <div key={i}>・{a}</div>
            ))}
          </div>
        </div>

        {/* ------------------------------- */}
        {/* 上段右：吹き出し + ロボット（大きく表示） */}
        {/* ------------------------------- */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {/* 吹き出し */}
          <div
            style={{
              position: "absolute",
              top: "5%",
              right: "18%",
              background: "white",
              color: "black",
              borderRadius: "12px",
              padding: "1.2rem",
              width: "300px",
              fontSize: "1.1rem",
              border: "3px solid #475569",
            }}
          >
            {aiComment}
          </div>

          {/* ロボット */}
          <div style={{ position: "absolute", bottom: "5%", right: "15%" }}>
            <img
              src="/images/robot.jpg"
              width={230}
              height={230}
              alt="AI robot"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>

        {/* ------------------------------- */}
        {/* 下段左：AI資産推移（小さめ） */}
        {/* ------------------------------- */}
        <div
          style={{
            border: "2px solid #334155",
            borderRadius: "12px",
            padding: "1rem",
          }}
        >
          <h2 className="text-xl font-bold mb-3">📈 AI資産推移</h2>
          <div style={{ height: "80%", color: "#38bdf8", fontSize: "14px", opacity: 0.8 }}>
            （ここに資産グラフが入る）
          </div>
        </div>

        {/* ------------------------------- */}
        {/* 下段右：ポートフォリオ円グラフ（小さめ） */}
        {/* ------------------------------- */}
        <div
          style={{
            border: "2px solid #334155",
            borderRadius: "12px",
            padding: "1rem",
          }}
        >
          <h2 className="text-xl font-bold mb-3">💼 ポートフォリオ</h2>
          <div style={{ height: "80%", color: "#38bdf8", fontSize: "14px", opacity: 0.8 }}>
            （ここに円グラフが入る）
          </div>
        </div>

      </div>
    </div>
  );
}

