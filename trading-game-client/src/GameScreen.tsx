import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { socket } from "./App";
import { API_BASE } from "./apiConfig"; // ✅ 修正点①

// lightweight-charts（個別銘柄チャート用）⬇
import { createChart, CandlestickSeries } from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
} from "lightweight-charts";

// ✅ 資産グラフ用ライブラリ（Recharts）
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ★ 修正: 値と型を分けてインポート
import {
  TICKERS,
  TICKER_DISPLAY_NAME,
  NEWS_IMAGE_MAP,
  DEFAULT_NEWS_IMAGE
} from "./constants"; 
import type {
  TickerId,
  NewsEvent,
  Player,
  Position
} from "./constants"; 

// --- ローソク足に変換する関数 (変更なし) ---
function pricesToCandles(prices: number[]): CandlestickData[] {
  if (!prices?.length) return [];
  const arr = prices.length > 120 ? prices.slice(-120) : prices;
  return arr.map((p, i) => {
    const time = (Math.floor(Date.now() / 1000) - (arr.length - i)) as UTCTimestamp;
    const prev = i === 0 ? p : arr[i - 1];
    const open = prev, close = p;
    const high = Math.max(open, close) * 1.001;
    const low  = Math.min(open, close) * 0.999;
    return { time, open, high, low, close };
  });
}

// ========== ニュースモーダル ==========
function NewsModal({ ev, onClose }: { ev: NewsEvent; onClose: () => void }) {
  const imageUrl = NEWS_IMAGE_MAP[ev.name] || DEFAULT_NEWS_IMAGE;
  return createPortal(
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(128,128,128,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2147483647,
    }}>
      <div style={{
        background: "rgb(31, 41, 55)", color: "white",
        width: 500, borderRadius: "1rem",
        position: "relative",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        border: "1px solid rgb(75, 85, 99)",
        padding: "1.5rem",
        display: "flex", alignItems: "center",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "0.5rem", left: "0.5rem",
            width: 32, height: 32,
            borderRadius: "9999px",
            background: "rgb(75,85,99)",
            cursor: "pointer",
          }}
        >×</button>

        <div style={{
          width: 128, height: 128,
          borderRadius: "0.5rem", background: "rgb(55,65,81)",
          marginRight: "1.5rem",
        }}>
          <img
            src={imageUrl}
            alt={ev.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.5rem" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>📰 ニュース速報</h2>
          <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: "0.5rem" }}>{ev.name}</p>
          <p style={{ textAlign: "center", marginBottom: "0.5rem", lineHeight: 1.6 }}>
            {ev.description}
          </p>
          {/* ★ 修正: ev.ticker (ID) を表示名に変換 */}
          <p style={{ textAlign: "center", fontSize: "0.875rem" }}>影響銘柄：{TICKER_DISPLAY_NAME[ev.ticker]}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}




// ========== 1枚のタイル(銘柄チャート) ==========
function ChartTile({
  tickerId, // ★ 修正: ticker -> tickerId
  price, holdingQty,
  registerChart,
  onSelect, selected,
}: {
  tickerId: TickerId; // ★ 修正: string -> TickerId
  price?: number;
  holdingQty?: number;
  registerChart: (el: HTMLDivElement | null) => void;
  onSelect: () => void;
  selected: boolean;
}) {
  const baseStyle: React.CSSProperties = {
    background: "rgb(17,24,39)",
    borderRadius: "0.75rem",
    border: "1px solid rgb(55,65,81)",
    overflow: "hidden",
    cursor: "pointer",
    height: 194,
  };
  const selectedStyle: React.CSSProperties = {
    ...baseStyle,
    boxShadow: "0 0 0 2px #facc15",
  };

  return (
    <div onClick={onSelect} style={selected ? selectedStyle : baseStyle}>
      {/* ヘッダー */}
      <div style={{
        height: "1.75rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 0.5rem",
        background: "rgba(31,41,55,0.8)",
      }}>
        <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "rgb(134,239,172)" }}>
          {price?.toFixed(2)}
        </div>
        {/* ★ 修正: tickerId から表示名(日本語)を引く */}
        <div style={{ fontSize: "0.875rem", fontWeight: "bold", color: "white" }}>{TICKER_DISPLAY_NAME[tickerId]}</div>
      </div>

      {/* チャート描画領域 */}
      <div ref={registerChart} style={{ height: 142 }} />

      {/* フッター（保有数量） */}
      <div style={{
        height: "1.5rem",
        display: "flex", alignItems: "center",
        padding: "0 0.5rem",
        background: "rgba(31,41,55,0.7)",
        fontSize: "0.75rem", color: "rgb(209,213,219)",
      }}>
        {holdingQty ? `${holdingQty}株` : "\u00A0"}
      </div>
    </div>
  );
}




export default function GameScreen({ playerName }: { playerName: string }) {
  // プレイヤー全体状態
  const [player, setPlayer] = useState<Player>({
    cash: 100_000_000,
    totalValue: 100_000_000,
    pnl: 0,
    holdings: Object.fromEntries(TICKERS.map(t => [t, { qty: 0, avgPrice: 0 }])) as Record<TickerId, Position>,
  });

  const [selectedTicker, setSelectedTicker] = useState<TickerId>(TICKERS[0]);
  const [qty, setQty] = useState("");
  const [latestPrices, setLatestPrices] = useState<Partial<Record<TickerId, number>>>({});
  const [partialQty, setPartialQty] = useState("");
  const [closeModal, setCloseModal] = useState<{ ticker: TickerId; qty: number } | null>(null);
  const [newsPopup, setNewsPopup] = useState<NewsEvent | null>(null);

  const [avgOthersHistory, setAvgOthersHistory] = useState<Array<{ time: number; value: number }>>([]); //他プレイヤーの平均用

  // --- 資産履歴（Recharts用） ---
  const [assetHistory, setAssetHistory] = useState<Array<{ time: number; value: number }>>([]);
  const INITIAL_CAPITAL = 100_000_000;

  // --- チャート管理（左の12個用） ---
  const chartsRef = useRef<Record<string, IChartApi | undefined>>({})
  const seriesRef = useRef<Record<string, ISeriesApi<"Candlestick"> | undefined>>({})

  /** 各銘柄タイルのDOMに軽量チャートを作成 */
  const makeRegisterChart = (ticker: TickerId) => (el: HTMLDivElement | null) => {
    if (!el || chartsRef.current[ticker]) return;
    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: { background: { color: "#0f172a" }, textColor: "#e2e8f0" },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      rightPriceScale: { borderColor: "#485c7b" },
      timeScale: { borderColor: "#485c7b", visible: false },
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartsRef.current[ticker] = chart;
    seriesRef.current[ticker] = candleSeries;
  };



  // ✅ カスタムツールチップ（資産＋損益の2行表示）
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const currentValue = Math.round(Number(payload[0].value));
    const pnl = currentValue - INITIAL_CAPITAL;
    const isPlus = pnl >= 0;

    return (
      <div
        style={{
          background: "#1f2937",
          border: "1px solid #374151",
          color: "white",
          padding: "0.5rem 0.75rem",
          borderRadius: 6,
        }}
      >
        <div>
          {new Date(label * 1000).toLocaleTimeString("ja-JP", { hour12: false })}
        </div>
        <div style={{ color: "white" }}>
          資産：¥{currentValue.toLocaleString()}
        </div>
        <div>
          <span style={{ color: "white" }}>損益：</span>
          <span style={{ color: isPlus ? "#22c55e" : "#ef4444" }}>
            {isPlus ? "+" : "-"}
            {Math.abs(pnl).toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log("✅ avgOthersHistory =", avgOthersHistory);
  }, [avgOthersHistory]);


  // --- 画面リサイズへの反応 ---
  useEffect(() => {
    const onResize = () => {
      // ★ 修正: TickerId を使う
      for (const ticker of TICKERS) {
        const chart = chartsRef.current[ticker];
        if (!chart) continue;
        const container = (chart as any).container as HTMLElement;
        if (container) {
          chart.resize(container.clientWidth, container.clientHeight);
        }
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- サーバーからの状態受信（価格・プレイヤー・ニュース） ---
  useEffect(() => {
    const handleGameTick = (serverState: any) => {
      // ★ 修正: TickerId をキーにする
      const latest: Partial<Record<TickerId, number>> = {};
      // ★ 修正: TickerId を使う
      for (const t of TICKERS) {
        const prices = serverState?.prices?.[t]; // t は "BANK" など
        if (!prices?.length) continue;
        latest[t] = prices[prices.length - 1];

        const s = seriesRef.current[t];
        if (s) s.setData(pricesToCandles(prices));
      }
      setLatestPrices(latest);
    };

    const handleGameNews = (ev: NewsEvent) => setNewsPopup(ev);

    const handlePlayersUpdate = (all: Record<string, Player>) => {
      const me = all[playerName];
      if (me) {
        const recalculatedTotal =
          me.cash +
          Object.entries(me.holdings).reduce((sum, [ticker, pos]) => {
            if (!pos.qty) return sum;
            // ★ 修正: TickerId を使う
            const px = latestPrices[ticker as TickerId] ?? pos.avgPrice;
            return sum + px * pos.qty;
          }, 0);

        setPlayer({ ...me, totalValue: recalculatedTotal });
      }

      const otherPlayers = Object.entries(all).filter(([name]) => name !== playerName);

      if (otherPlayers.length > 0) {
        const t = Math.floor(Date.now() / 1000);
        const avgValue =
          otherPlayers.reduce((sum, [_, pl]) => {
            return sum + (pl.totalValue ?? pl.cash);
          }, 0) / otherPlayers.length;

        setAvgOthersHistory(prev => {
          if (prev.length && prev[prev.length - 1].time === t) return prev;
          return [...prev, { time: t, value: avgValue }];
        });
      }
    };

    socket.on("game:tick", handleGameTick);
    socket.on("game:news", handleGameNews);
    socket.on("players:update", handlePlayersUpdate);

    // 初期ロード
    fetch(`${API_BASE}/api/state`)
      .then(r => r.json())
      .then(d => handleGameTick(d))
      .catch(() => { /* noop */ });

    return () => {
      socket.off("game:tick", handleGameTick);
      socket.off("game:news", handleGameNews);
      socket.off("players:update", handlePlayersUpdate);
    };
  }, [playerName]);




  // --- クライアント側でも、価格/保有が変わったら総資産を再計算して履歴に追記（補完用） ---
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);

    const totalValue =
      (player?.cash ?? 0) +
      Object.entries(player.holdings).reduce((sum, [ticker, pos]) => {
        if (!pos.qty) return sum;
        // ★ 修正: TickerId を使う
        const px = latestPrices[ticker as TickerId] ?? pos.avgPrice ?? 0;
        return sum + px * pos.qty;
      }, 0);

    setAssetHistory(prev => {
      if (prev.length && prev[prev.length - 1].time === now) return prev;
      return [
        ...prev,
        {
          time: now,
          value: totalValue,
          profit: Math.max(totalValue, INITIAL_CAPITAL), // 基準線より上だけ
          loss:   Math.min(totalValue, INITIAL_CAPITAL), // 基準線より下だけ
        },
      ];
    });
  }, [latestPrices, player]);




  
  // --- 注文まわり ---
  // ★ 修正: TickerId を使う
  const order = async (side: "buy" | "sell", customTicker?: TickerId, customQty?: number) => {
    const ticker = customTicker || selectedTicker;
    const quantity = customQty ?? Number(qty);
    if (!ticker) return alert("銘柄を選択してください。");
    if (!quantity || quantity <= 0) return alert("数量を入力してください。");
    try {
      const res = await fetch(`${API_BASE}/api/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ★ 修正: TickerId を送信
        body: JSON.stringify({ player_id: playerName, ticker, side, quantity }),
      });
      const data = await res.json();
      if (data.error) return alert(data.error);
      setQty("");
    } catch {
      alert("通信エラーが発生しました。");
    }
  };

  const handleClose = async (qtyToClose: number) => {
    if (!closeModal) return;
    const pos = player.holdings[closeModal.ticker];
    if (!pos) return;
    const side = pos.qty > 0 ? "sell" : "buy";
    await order(side, closeModal.ticker, qtyToClose);
    setCloseModal(null);
  };

  // ★ 修正: TickerId を使う
  //const currentPosition = player.holdings[selectedTicker] || { qty: 0, avgPrice: 0 };

  // --- 画面 ---
  return (
    <div
      className="flex h-screen bg-black text-white"
      style={{ fontFamily: "sans-serif", overflow: "hidden" }}
    >
      {/* 左：3列グリッド（固定表示・スクロールなし） */}
      <div
        className="grid gap-3 p-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          flex: 3,
          overflow: "hidden",
        }}
      >
        {TICKERS.map((t) => (
          <ChartTile
            key={t}
            tickerId={t}
            price={latestPrices[t]}
            holdingQty={player.holdings[t]?.qty}
            registerChart={makeRegisterChart(t)}
            onSelect={() => setSelectedTicker(t)}
            selected={selectedTicker === t}
          />
        ))}
      </div>

      {/* 右：操作パネル（右カラム全体のみスクロール） */}
      <div
        style={{
          flex: 1,
          minWidth: 350,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          background: "rgb(17,24,39)", // ← ✅白→ダークに変更
          color: "white",
        }}
      >
        <div
          style={{
            padding: "1rem",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* === 資産パネル === */}
          <div style={{ marginBottom: "1rem", flexShrink: 0 }}>
            <h2 className="text-lg font-semibold mb-1">💰 {playerName} の資産</h2>
            {(() => {
              const fmt0 = { maximumFractionDigits: 0 } as const;

              const totalValue =
                (player?.cash ?? 0) +
                Object.entries(player?.holdings ?? {}).reduce((sum, [ticker, pos]) => {
                  if (!pos?.qty) return sum;
                  const px = latestPrices[ticker as TickerId] ?? pos.avgPrice ?? 0;
                  return sum + px * pos.qty;
                }, 0);

              const capitalDelta = totalValue - INITIAL_CAPITAL;

              const holdingsValue = Object.entries(player.holdings).reduce(
                (sum, [ticker, pos]) => {
                  if (!pos.qty) return sum;
                  const px = latestPrices[ticker as TickerId] ?? pos.avgPrice ?? 0;
                  return sum + px * pos.qty;
                },
                0
              );

              const totalPnl = Object.entries(player.holdings).reduce((acc, [ticker, pos]) => {
                if (!pos.qty) return acc;
                const px = latestPrices[ticker as TickerId] ?? pos.avgPrice ?? 0;
                return acc + (px - pos.avgPrice) * pos.qty;
              }, 0);

              const pnlRate =
                holdingsValue > 0 ? (totalPnl / holdingsValue) * 100 : 0;

              return (
                <>
                  <p style={{ fontSize: "1.125rem" }}>
                    総資産: ¥{totalValue.toLocaleString(undefined, fmt0)}
                    <span
                      style={{
                        marginLeft: "0.75rem",
                        fontWeight: "bold",
                        color: capitalDelta >= 0 ? "rgb(74,222,128)" : "rgb(248,113,113)",
                      }}
                    >
                      ({capitalDelta >= 0 ? "+" : ""}
                      {capitalDelta.toLocaleString(undefined, fmt0)})
                    </span>
                  </p>

                  <p>現金: ¥{(player.cash ?? 0).toLocaleString(undefined, fmt0)}</p>

                  <p>
                    評価損益:{" "}
                    <span className={totalPnl >= 0 ? "text-green-400" : "text-red-400"}>
                      ¥{totalPnl.toLocaleString(undefined, fmt0)}
                    </span>
                    {holdingsValue > 0 && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontWeight: "bold",
                          color: totalPnl >= 0 ? "rgb(74,222,128)" : "rgb(248,113,113)",
                        }}
                      >
                        ({totalPnl >= 0 ? "+" : ""}
                        {pnlRate.toFixed(2)}%)
                      </span>
                    )}
                  </p>
                </>
              );
            })()}
          </div>



          {/* === 資産グラフ === */}
          <div
            style={{
              width: "100%",
              height: 180,
              border: "1px solid rgb(55, 65, 81)",
              borderRadius: 8,
              background: "#1f2937",
              padding: "0.25rem 0.5rem",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={assetHistory}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <ReferenceLine
                  y={INITIAL_CAPITAL}
                  stroke="#6b7280"       // ←少し濃いグレー
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#d1d5db"       // ←ニュートラルな灰色
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="none"
                  fill="#22c55e"
                  fillOpacity={0.25}
                  isAnimationActive={false}
                  baseValue={INITIAL_CAPITAL}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="none"
                  fill="#ef4444"
                  fillOpacity={0.25}
                  isAnimationActive={false}
                  baseValue={INITIAL_CAPITAL}
                />
                <Tooltip content={<CustomTooltip />} />
              </AreaChart>
            </ResponsiveContainer>
          </div>




          {/* === 注文パネル === */}
          <div
            style={{
              marginTop: "0.5rem",
              borderTop: "1px solid rgb(55, 65, 81)",
              paddingTop: "1rem",
              flexShrink: 0,
            }}
          >
            <h2 className="text-lg font-semibold mb-2">🛒 注文パネル</h2>
            <p className="mb-2">
              対象:{" "}
              <span className="font-bold text-yellow-300 text-xl">
                {TICKER_DISPLAY_NAME[selectedTicker]}
              </span>
            </p>

            {(() => {
              const currentPrice = latestPrices[selectedTicker];
              const maxTradableQty =
                currentPrice && currentPrice > 0
                  ? Math.floor((player?.cash ?? 0) / currentPrice)
                  : 0;
              const fmt0 = { maximumFractionDigits: 0 } as const;
              const pos = player.holdings[selectedTicker];
              return (
                <>
                  <p className="text-sm text-gray-400">
                    保有: {pos.qty}株 @ {pos.avgPrice.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-400">
                    最大 (新規):{" "}
                    {maxTradableQty.toLocaleString(undefined, fmt0)} 株まで
                  </p>
                </>
              );
            })()}

            <input
              type="number"
              placeholder="数量"
              className="rounded w-full mb-2 mt-2"
              style={{
                color: "white",
                background: "rgb(55, 65, 81)",
                border: "1px solid rgb(75, 85, 99)",
                padding: "0.5rem",
              }}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => order("buy")}
                className="flex-1 bg-green-600 hover:bg-green-700 rounded py-2 font-bold"
              >
                買い (LONG)
              </button>
              <button
                onClick={() => order("sell")}
                className="flex-1 bg-red-600 hover:bg-red-700 rounded py-2 font-bold"
              >
                売り (SHORT)
              </button>
            </div>
          </div>

          {/* === 保有銘柄一覧（右全体スクロールに合わせて overflow は付けない） === */}
          <div
            style={{
              marginTop: "1rem",
              borderTop: "1px solid rgb(55, 65, 81)",
              paddingTop: "1rem",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <h2 className="text-lg font-semibold mb-2">📦 保有銘柄</h2>
            {Object.entries(player.holdings)
              .filter(([_, pos]) => !!pos.qty)
              .map(([ticker, pos]) => {
                const tickerId = ticker as TickerId;
                const px = latestPrices[tickerId] ?? 0;
                const pnl = (px - pos.avgPrice) * pos.qty;
                const fmt0 = { maximumFractionDigits: 0 } as const;

                return (
                  <div
                    key={tickerId}
                    style={{
                      background: "rgb(55, 65, 81)",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgb(75, 85, 99)",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span className="font-bold text-lg text-yellow-300">
                        {TICKER_DISPLAY_NAME[tickerId]}
                      </span>
                      <button
                        onClick={() => {
                          setCloseModal({ ticker: tickerId, qty: pos.qty });
                          setPartialQty("");
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-black text-sm font-bold px-3 py-1 rounded"
                      >
                        決済
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span
                        className={pos.qty > 0 ? "text-green-400" : "text-red-400"}
                      >
                        {pos.qty > 0 ? "ロング" : "ショート"}:{" "}
                        {Math.abs(pos.qty)}株
                      </span>
                      <span>@ {pos.avgPrice.toFixed(1)}</span>
                    </div>

                    <div style={{ textAlign: "right", marginTop: "0.25rem" }}>
                      <span className="text-sm">評価損益: </span>
                      <span
                        className={pnl >= 0 ? "text-green-400" : "text-red-400"}
                        style={{ fontWeight: "bold" }}
                      >
                        ¥{pnl.toLocaleString(undefined, fmt0)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      
      {/* --- 決済モーダル --- */}
      {closeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "rgb(31, 41, 55)",
              color: "white",
              padding: "1.5rem",
              borderRadius: "0.75rem",
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
              width: "400px",
              border: "1px solid rgb(75, 85, 99)",
            }}
          >
            {/* タイトル */}
            <h2 className="text-xl font-bold mb-3">
              {TICKER_DISPLAY_NAME[closeModal.ticker]} のポジションを決済
            </h2>

            {/* 現在ポジション */}
            <div className="text-lg mb-4">
              現在：
              <span
                className={closeModal.qty > 0 ? "text-green-400" : "text-red-400"}
              >
                {closeModal.qty > 0 ? "LONG " : "SHORT "}
                {Math.abs(closeModal.qty)}株
              </span>
            </div>

            {/* ✅ すべて決済（数量入力不要） */}
            <button
              onClick={() => {
                handleClose(Math.abs(closeModal.qty));
                setCloseModal(null);
                setPartialQty("");
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-lg mb-4"
            >
              すべて決済
            </button>

            {/* ✅ 一部決済 */}
            <div style={{ borderTop: "1px solid rgb(55, 65, 81)", paddingTop: "1rem" }}>
              <p className="text-sm mb-2">一部決済する数量を入力 (最大: {Math.abs(closeModal.qty)})</p>
              <input
                type="number"
                placeholder="数量"
                value={partialQty}
                onChange={(e) => setPartialQty(e.target.value)}
                min={1}
                max={Math.abs(closeModal.qty)}
                className="rounded w-full mb-3"
                style={{
                  color: "white",
                  background: "rgb(55, 65, 81)",
                  border: "1px solid rgb(75, 85, 99)",
                  padding: "0.5rem",
                }}
              />

              {/* ボタン類 */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  onClick={() => {
                    setCloseModal(null);
                    setPartialQty("");
                  }}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    const qtyToClose = Number(partialQty);
                    if (qtyToClose > 0 && qtyToClose <= Math.abs(closeModal.qty)) {
                      handleClose(qtyToClose);
                      setCloseModal(null);
                      setPartialQty("");
                    } else {
                      alert("数量が正しくありません。");
                    }
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg font-bold"
                >
                  一部決済
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ✅ ← ここを忘れるとニュースが出ない */}
      {newsPopup && (
        <NewsModal
          ev={newsPopup}
          onClose={() => setNewsPopup(null)}
        />
      )}
    </div>
  );
}

