import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { socket } from "./App";
import { API_BASE } from "./apiConfig";
import { BUSINESS_DAYS_2026 } from "./constants";

// lightweight-charts(個別銘柄チャート用)
import { createChart, CandlestickSeries } from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
} from "lightweight-charts";

// 資産グラフ用ライブラリ(Recharts)
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,    
  Cell, 
  Legend   
} from "recharts";

// 値と型を分けてインポート
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

import GameEndModal from "./GameEndModal";

const COMPANY_DESCRIPTIONS: Record<string, string> = {
  "BANK": "【三井住友フィナンシャルグループ】\n日本の3大メガバンクの一角。企業の資金調達支援や個人の資産運用、海外展開など幅広い金融サービスを手掛ける。",
  "SEMI": "【東京エレクトロン】\n半導体製造装置で世界トップクラスのシェアを持つ。スマホやPC、AIに使われる半導体の進化を支える技術集団。",
  "AUTO": "【トヨタ自動車】\n日本が誇る世界最大級の自動車メーカー。ハイブリッド車技術に強みを持ち、EVや水素エンジンなどの次世代モビリティも開発。",
  "PHARMA": "【武田薬品工業】\n国内製薬トップ。グローバルな研究開発体制を持ち、がん、消化器系疾患、希少疾患などの新薬開発に注力している。",
  "NITORI": "【ニトリホールディングス】\n「お、ねだん以上。」で有名な家具・インテリア製造小売り最大手。円安が逆風となるが、海外展開も加速中。",
  "UTIL": "【関西電力】\n近畿地方を地盤とする電力会社。原子力発電所の再稼働実績があり、電力供給の安定性と脱炭素への取り組みを進める。",
  "AIR": "【ANAホールディングス】\n国内線・国際線ともに国内最大規模の航空会社。インバウンド需要の回復や貨物事業が業績の鍵を握る。",
  "GAME": "【任天堂】\n『マリオ』『ゼルダ』『ポケモン』など世界的人気IPを多数抱えるゲーム機・ソフトメーカー。円安は海外売上にとって追い風。",
  "ENEOS": "【ENEOSホールディングス】\n国内石油元売り最大手。ガソリンスタンドの運営のほか、水素エネルギーや再生可能エネルギー事業も育成中。",
  "GOLD": "【ゴールド (金)】\n「有事の金」として知られる安全資産。インフレヘッジや地政学的リスクが高まった際に買われやすい。",
  "USDJPY": "【ドル円 (為替)】\n日本円と米ドルの交換レート。日米の金利差や貿易収支によって変動し、輸出入企業の業績に大きく影響する。",
  "NIKKEI": "【日経平均株価】\n日本を代表する225社の株価の平均指数。日本経済全体の動向を示すバロメーターとして世界中が注目する。半導体に大きく影響を受ける。",
};

function CompanyModal({ ticker, onClose }: { ticker: TickerId; onClose: () => void }) {
  const desc = COMPANY_DESCRIPTIONS[ticker] || "説明情報がありません。";
  const name = TICKER_DISPLAY_NAME[ticker];

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "rgb(31, 41, 55)", border: "1px solid rgb(75, 85, 99)",
        borderRadius: "0.75rem", padding: "1.5rem", width: "400px",
        color: "white", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        maxWidth: "90vw"
      }} onClick={e => e.stopPropagation()}>
        
        <h3 className="text-xl font-bold text-yellow-400 mb-4 border-b border-gray-600 pb-2">
          🏢 {name}
        </h3>
        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "0.95rem" }}>
          {desc}
        </p>
        
        <div className="mt-6 text-right">
          <button 
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-sm"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- ローソク足に変換する関数 ---
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
  
  const affectedTickers = ev.tickers
    .map(t => TICKER_DISPLAY_NAME[t.ticker as TickerId] || t.ticker)
    .join('、 '); // 「、」で連結

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
        {/* ... (閉じるボタン) ... */}
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
        
        {/* ... (画像) ... */}
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
        
        {/* ... (テキスト) ... */}
        <div style={{ flex: 1 }}>
          <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>📰 ニュース速報</h2>
          <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: "0.5rem" }}>{ev.name}</p>
          <p style={{ textAlign: "center", marginBottom: "0.5rem", lineHeight: 1.6 }}>
            {ev.description}
          </p>
          <p style={{ textAlign: "center", fontSize: "0.875rem" }}>
            影響銘柄：{affectedTickers}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ========== 1枚のタイル(銘柄チャート) ==========
function ChartTile({
  tickerId, 
  price, holdingQty,
  registerChart,
  onSelect, 
  onInfoClick, // ★追加: 説明ボタン用ハンドラ
  selected,
}: {
  tickerId: TickerId;
  price?: number;
  holdingQty?: number;
  registerChart: (el: HTMLDivElement | null) => void;
  onSelect: () => void;
  onInfoClick: () => void; // ★追加
  selected: boolean;
}) {
  const baseStyle: React.CSSProperties = {
    background: "rgb(17,24,39)",
    borderRadius: "0.5rem", // 少し角丸を小さくしてキッチリ感を出す
    border: "1px solid rgb(55,65,81)",
    overflow: "hidden",
    cursor: "pointer",
    width: "100%",
    height: "100%", 
    display: "flex", flexDirection: "column",
  };
  const selectedStyle: React.CSSProperties = {
    ...baseStyle,
    boxShadow: "0 0 0 2px #facc15",
    borderColor: "#facc15",
  };

  return (
    <div onClick={onSelect} style={selected ? selectedStyle : baseStyle}>
      {/* ヘッダー */}
      <div style={{
        height: "1.75rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 0.5rem",
        background: "rgba(31,41,55,0.9)", // 少し濃く
        flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "rgb(134,239,172)" }}>
          {price?.toFixed(2)}
        </div>
        
        {/* ★修正: 企業名をクリック可能に */}
        <div 
          onClick={(e) => {
            e.stopPropagation(); // 親の「選択」イベントを止める
            onInfoClick();       // 説明モーダルを開く
          }}
          className="hover:text-yellow-300 hover:underline" // ホバー時のスタイル
          style={{ 
            fontSize: "0.8rem", fontWeight: "bold", color: "white", 
            cursor: "help", // カーソルを「？」にする
            marginLeft: "auto" // 右寄せ気味に
          }}
          title="クリックして企業情報を表示"
        >
          {TICKER_DISPLAY_NAME[tickerId]} <span style={{fontSize: "0.7em"}}>ℹ️</span>
        </div>
      </div>

      {/* チャート */}
      <div ref={registerChart} style={{ flex: 1, width: "100%", minHeight: 0 }} />

      {/* フッター */}
      <div style={{
        height: "1.5rem",
        display: "flex", alignItems: "center",
        padding: "0 0.5rem",
        background: "rgba(31,41,55,0.8)",
        fontSize: "0.75rem", color: "rgb(209,213,219)",
        flexShrink: 0,
      }}>
        {holdingQty ? `${holdingQty}株` : "\u00A0"}
      </div>
    </div>
  );
}

type ActiveEventData = {
  tick: number;
  eventDefinition: NewsEvent; // この中にニュース本体 (NewsEvent) が入っている
};


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
  const [investPct, setInvestPct] = useState(0); // 0〜100 (%)
  const [newsLog, setNewsLog] = useState<NewsEvent[]>([]); // これはニュース履歴用
  const [closePct, setClosePct] = useState(0); // 決済割合（0〜100）
  // ★追加: 企業説明モーダル用のstate
  const [companyInfoTarget, setCompanyInfoTarget] = useState<TickerId | null>(null);

  // --- 資産履歴（Recharts用） ---
  const [assetHistory, setAssetHistory] = useState<Array<{ time: number; value: number }>>([]);
  const INITIAL_CAPITAL = 100_000_000;

  const COLORS = [ //円グラフ用
    '#0088FE', // 現金 (青)
    '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d',
    '#ffc658', '#a4de6c', '#d0ed57', '#83a6ed', '#b15928', '#fdbf6f',
  ];

  // --- チャート管理（左の12個用） ---
  const chartsRef = useRef<Record<string, IChartApi | undefined>>({})
  const seriesRef = useRef<Record<string, ISeriesApi<"Candlestick"> | undefined>>({})

  // 音を鳴らす用の関数
  const playSound = (type: "action" | "news") => {
    const paths = {
      action: "/sounds/action.wav", // 注文・決済
      news: "/sounds/news.wav",     // ニュース速報
    };
    
    const audio = new Audio(paths[type]);
    audio.volume = 0.5; 
    audio.currentTime = 0; // 連打対応
    audio.play().catch((e) => console.error("Audio play failed", e));
  };

  const updateQtyBasedOnPct = (newPct: number, targetTicker: TickerId) => {
    // 1. 割合(%)を 10% 刻みのスナップされた値に正規化
    const snappedPct = Math.round(newPct / 10) * 10;
    
    // 2. 割合(%)の state を更新（バーの表示に反映）
    setInvestPct(snappedPct);
    
    // 3. 数量(qty)を計算して更新
    const currentPrice = latestPrices[targetTicker] ?? 0;
    
    if (currentPrice > 0) {
      // 現金 (player.cash) × 割合 (snappedPct / 100) で買える量を計算
      const targetValue = (player.cash * snappedPct) / 100;
      const newQty = Math.floor(targetValue / currentPrice);
      
      // 数量が0より大きい場合のみセット（0の場合は空欄にする）
      setQty(newQty > 0 ? newQty.toString() : "");
    } else {
      // 価格が取れない場合は数量をクリア
      setQty("");
    }
  };

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


  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: number;
  }) => {
    if (!active || !payload?.length) return null;

    // ★ time(label) → index 逆引き
    const idx = assetHistory.findIndex((d) => d.time === label);
    if (idx === -1) return null;

    const dateStr = BUSINESS_DAYS_2026[idx] ?? "";

    const value = Math.round(payload[0].value);
    const pnl = value - INITIAL_CAPITAL;
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
        <div>{dateStr}</div>
        <div>資産：¥{value.toLocaleString()}</div>
        <div style={{ color: isPlus ? "#22c55e" : "#ef4444" }}>
          損益：{isPlus ? "+" : "-"}{Math.abs(pnl).toLocaleString()}
        </div>
      </div>
    );
  };





  //日付表示用
  const [gameDate, setGameDate] = useState<number | null>(null);
  const [remainingDays, setRemainingDays] = useState<number>(0);

  useEffect(() => {
  socket.on("game:date", ({ unix, remaining }) => {
    setGameDate(unix);
    setRemainingDays(remaining);
  });

  return () => {
    socket.off("game:date");
  };
}, []);

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
      const latest: Partial<Record<TickerId, number>> = {};

      for (const t of TICKERS) {
        const prices = serverState?.prices?.[t];
        if (!prices?.length) continue;

        latest[t] = prices[prices.length - 1];

        const s = seriesRef.current[t];
        if (s) s.setData(pricesToCandles(prices));
      }
      setLatestPrices(latest);
    };



    const handleGameNews = (data: ActiveEventData) => {
      console.log("Received game:news", data); // デバッグ用
      playSound("news");
      if (data && data.eventDefinition) {
        setNewsPopup(data.eventDefinition);
      }
    };

    const handlePlayersUpdate = (all: Record<string, Player>) => {
      const me = all[playerName];
      if (me) {
        setPlayer(me);

        const now = Math.floor(Date.now() / 1000);
        const pv = me.totalValue; // ←100%最新の資産

        setAssetHistory(prev => {
          if (prev.length && prev[prev.length - 1].time === now) return prev;

          return [
            ...prev,
            {
              time: now,
              value: pv,
              profit: Math.max(pv, INITIAL_CAPITAL),
              loss: Math.min(pv, INITIAL_CAPITAL)
            }
          ];
        });
      }

      // --- 他プレイヤー平均もここで計算すべき ---
      const otherPlayers = Object.entries(all).filter(
        ([name]) => name !== playerName
      );

      if (otherPlayers.length > 0) {
        const avgValue =
          otherPlayers.reduce((sum, [_, pl]) => {
            return sum + (pl.totalValue ?? pl.cash);
          }, 0) / otherPlayers.length;

        const now = Math.floor(Date.now() / 1000);

        setAvgOthersHistory(prev => {
          if (prev.length && prev[prev.length - 1].time === now) return prev;
          return [...prev, { time: now, value: avgValue }];
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

  // ゲーム終了判定
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<"end" | "bankrupt" | null>(null);
  
// ニュース履歴用
  useEffect(() => {
    const handler = (ev: NewsEvent) => {
      // ★ 破産 or ゲーム終了中はニュース無視
      if (gameOver) return;

      setNewsPopup(ev);
      setNewsLog(prev => [ev, ...prev].slice(0, 30));
    };

    socket.on("game:news", handler);

    return () => {
      socket.off("game:news", handler);
    };
  }, [gameOver]);


  useEffect(() => {
    const handler = () => {
      setGameOver(true);
      setGameOverReason("end");
    };

    socket.on("game:end", handler);

    return () => {
      socket.off("game:end", handler);
    };
  }, []);
  
  useEffect(() => {
  if (!gameOver && player.totalValue <= 0) {
    setGameOver(true);
    setGameOverReason("bankrupt");
  }
}, [player.totalValue]);




  
  // --- 注文まわり ---
  const order = async (side: "buy" | "sell", customTicker?: TickerId, customQty?: number) => {
    const ticker = customTicker || selectedTicker;
    const quantity = customQty ?? Number(qty);
    if (!ticker) return alert("銘柄を選択してください。");
    if (!quantity || quantity <= 0) return alert("数量を入力してください。");
    try {
      const res = await fetch(`${API_BASE}/api/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerName, ticker, side, quantity }),
      });
      const data = await res.json();
      if (data.error) return alert(data.error);
      setQty("");
      playSound("action");
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

  const pieData = [
    // 1. 現金
    {
      name: "現金",
      value: Math.round(player.cash), // 整数に丸める
    },
    // 2. 保有銘柄 (ロング・ショートの区別なく、評価額の絶対値)
    ...Object.entries(player.holdings)
      .filter(([_, pos]) => pos.qty !== 0) // 数量0は除外
      .map(([ticker, pos]) => {
        const tickerId = ticker as TickerId;
        const price = latestPrices[tickerId] ?? pos.avgPrice;
        // Math.abs() でロング/ショートの区別をなくす
        const value = Math.abs(pos.qty) * price; 
        
        return {
          name: TICKER_DISPLAY_NAME[tickerId] || tickerId,
          value: Math.round(value), // 整数に丸める
        };
      })
      // 価値が0より大きいもののみ（念のため）
      .filter(item => item.value > 0), 
  ];

  // --- 画面 ---
  return (
    <div
      className="flex h-screen bg-black text-white"
      style={{ 
        fontFamily: "sans-serif", 
        overflow: "hidden", 
        width: "100vw",
        height: "100vh" // 念のため明示
      }}
    >
      {/* 左：3列グリッド (レイアウト修正版) */}
      <div
        style={{
          flex: 3,
          height: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)", 
          // ★修正: 余白(padding/gap)を極小にして画面いっぱいに使う
          gap: "4px",     
          padding: "4px", 
          boxSizing: "border-box",
        }}
      >
        {TICKERS.map((t) => (
          <ChartTile
            key={t}
            tickerId={t}
            price={latestPrices[t]}
            holdingQty={player.holdings[t]?.qty}
            registerChart={makeRegisterChart(t)}
            onSelect={() => {
              setSelectedTicker(t);
              updateQtyBasedOnPct(investPct, t);
            }}
            // ★追加: 説明クリック時
            onInfoClick={() => setCompanyInfoTarget(t)}
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
          background: "rgb(17,24,39)", // ← 白→ダークに変更
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
          {/* === 日付パネル（右カラムのヘッダー） === */}
          {gameDate && (
            <div
              style={{
                background: "rgba(31, 41, 55, 0.75)",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid rgb(75, 85, 99)",
                color: "white",
                fontSize: "0.9rem",
                width: "100%",
                boxSizing: "border-box",
                backdropFilter: "blur(4px)",
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "1rem", textAlign: "center" }}>
                {(() => {
                  const d = new Date(gameDate * 1000);
                  return d.toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  });
                })()}
                {" "}
                ({new Date(gameDate * 1000).toLocaleDateString("ja-JP", {
                  weekday: "short",
                })})
              </div>

              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#d1d5db",
                  textAlign: "center",
                  marginTop: "0.25rem",
                }}
              >
                ゲーム終了まであと <b>{remainingDays}</b> 日
              </div>
            </div>
          )}


          {/* === 資産パネル === */}
          <div style={{ marginBottom: "1rem", flexShrink: 0 }}>
            <h2 className="text-lg font-semibold mb-1">💰 {playerName} の資産</h2>
            {(() => {
              const fmt0 = { maximumFractionDigits: 0 } as const;

              const totalValue = player.totalValue; 
              const capitalDelta = player.pnl;        

              const unrealizedPnl = Object.entries(player.holdings).reduce(
                (sum, [ticker, pos]) => {
                  if (pos.qty === 0) return sum;
                  const px = latestPrices[ticker as TickerId] ?? pos.avgPrice ?? 0;
                  const entry = pos.avgPrice;
                  return sum + (px - entry) * pos.qty;
                },
                0
              );

              const entryValue = Object.values(player.holdings)
                .filter(h => h.qty !== 0)
                .reduce((sum, h) => sum + Math.abs(h.avgPrice * h.qty), 0);

              const currentValue = Object.entries(player.holdings)
                .filter(([_, h]) => h.qty !== 0)
                .reduce((sum, [ticker, h]) => {
                  const px = latestPrices[ticker as TickerId] ?? h.avgPrice;
                  return sum + Math.abs(px * h.qty);
                }, 0);

              const pnlRate = entryValue > 0 ? ((currentValue - entryValue) / entryValue) * 100 : 0;


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
                    <span className={unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}>
                      ¥{unrealizedPnl.toLocaleString(undefined, fmt0)}
                    </span>
                    {entryValue > 0 && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontWeight: "bold",
                          color: unrealizedPnl >= 0 ? "rgb(74,222,128)" : "rgb(248,113,113)",
                        }}
                      >
                        ({unrealizedPnl >= 0 ? "+" : "-"}
                        {Math.abs(pnlRate).toFixed(2)}%)
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
              <AreaChart data={assetHistory.map(d => ({
                ...d,
                others: avgOthersHistory.find(o => o.time === d.time)?.value
              }))}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <ReferenceLine y={INITIAL_CAPITAL} stroke="#6b7280" strokeDasharray="4 4" />

                {/* 自分の資産ライン */}
                <Line dataKey="value" stroke="#d1d5db" strokeWidth={2} dot={false} isAnimationActive={false} />

                {/* 他プレイヤー平均（灰色点線） */}
                <Line
                  dataKey="others"
                  stroke="#9ca3af"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 4"
                  isAnimationActive={false}
                />

                {/* 上昇エリア */}
                <Area dataKey="value" stroke="none" fill="#22c55e" fillOpacity={0.25} baseValue={INITIAL_CAPITAL} />

                {/* 下落エリア */}
                <Area dataKey="value" stroke="none" fill="#ef4444" fillOpacity={0.25} baseValue={INITIAL_CAPITAL} />

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

            {/* --- スライダー（投資割合） --- */}
            <div style={{ marginBottom: "1.25rem" }}>   {/* ←ここで全体の距離を空ける */}
              <label style={{ fontSize: "0.9rem", display: "block", marginBottom: "0.3rem" }}>
                💹 投じる現金の割合(%)（{investPct}%）
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={investPct}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const snapped = Math.round(raw / 10) * 10;
                  setInvestPct(snapped);

                  const currentPrice = latestPrices[selectedTicker] ?? 0;
                  if (currentPrice > 0) {
                    // ✅ 現金ベースに変更 (cash × %)
                    const targetValue = (player.cash * snapped) / 100;
                    setQty(Math.floor(targetValue / currentPrice).toString());
                  }
                }}
                style={{
                  width: "100%",
                  cursor: "pointer",
                  appearance: "none",
                  height: "6px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #22c55e ${investPct}%, #4b5563 ${investPct}%)`,
                }}
              />
            </div>

            {/* --- 数量入力欄（バーの下に余白付き） --- */}
            <input
              type="number"
              placeholder="数量"
              className="rounded w-full mb-3"
              style={{
                color: "white",
                background: "rgb(55, 65, 81)",
                border: "1px solid rgb(75, 85, 99)",
                padding: "0.5rem",
              }}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />

            {/* --- 買い・売りボタン --- */}
            <div className="flex gap-2">
              {/* === BUY === */}
              <button
                className="flex-1 bg-green-600 hover:bg-green-700 rounded py-2 font-bold"
                onClick={() => {
                  const currentPrice = latestPrices[selectedTicker] ?? 0;
                  if (currentPrice <= 0) {
                    alert("現在の価格が取得できないため、発注できません。");
                    return;
                  }

                  // ★修正2: 注文直前に再計算するロジック
                  let finalQty = 0;

                  // スライダー(%)が設定されている場合は、スライダーの値を優先して「現在の価格」で再計算
                  if (investPct > 0) {
                    const targetValue = (player.cash * investPct) / 100;
                    finalQty = Math.floor(targetValue / currentPrice);
                    
                    // 計算結果が0になってしまった場合のケア（資金不足など）
                    if (finalQty <= 0 && investPct > 0) {
                       // 1株も買えない場合はアラートを出すか、あるいは0のまま弾く
                    }
                  } else {
                    // スライダーが0なら手入力欄(qty)の値を信用する
                    finalQty = Number(qty);
                  }

                  if (finalQty <= 0) {
                    alert("数量が0です。バーを動かすか、数量を入力してください。");
                    return;
                  }

                  // 再計算した数量でセットし直して発注
                  // (表示上のqtyも更新しておくと親切)
                  setQty(finalQty.toString());
                  
                  order("buy", undefined, finalQty);
                }}
              >
                買い (LONG)
              </button>


              {/* === SELL === */}
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 rounded py-2 font-bold"
                onClick={() => {
                  const currentPrice = latestPrices[selectedTicker] ?? 0;
                  if (currentPrice <= 0) {
                    alert("現在の価格が取得できないため、発注できません。");
                    return;
                  }

                  // ★修正2: 売りも同様に再計算
                  let finalQty = 0;
                  
                  // ショート可能な最大数量（現金ベース）
                  const maxShortQty = Math.floor(player.cash / currentPrice);
                  const posQty = player.holdings[selectedTicker]?.qty ?? 0;
                  // 既にショートしている分があれば、さらに売れる枠は減る（またはロングの解消分）
                  // ここではシンプルに「現金枠で新規に売れる限界 + 現在のポジション解消」などは考慮せず
                  // 元のロジック「現金全額分までショート可」に準拠します
                  const remainingShortQty = maxShortQty - (posQty < 0 ? Math.abs(posQty) : 0); 
                  // ※注: 元コードのロジックに従い、ロング保有時は単純に現金枠で計算

                  if (investPct > 0) {
                    // スライダー%に基づいて「売りたい金額」を算出
                    const investAmount = (player.cash * investPct) / 100;
                    const desiredQty = Math.floor(investAmount / currentPrice);
                    
                    // 許容範囲内に丸める
                    finalQty = Math.min(desiredQty, remainingShortQty);
                  } else {
                    // 手入力
                    const manualQty = Number(qty);
                    finalQty = Math.min(manualQty, remainingShortQty);
                  }

                  if (finalQty <= 0) {
                    alert("これ以上売れません。（現金の範囲を超えます）");
                    return;
                  }

                  setQty(finalQty.toString());
                  order("sell", undefined, finalQty);
                }}

              >
                売り (SHORT)
              </button>
            </div>
          </div>


          {/* === 保有銘柄一覧 === */}
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
            {Object.entries(player.holdings).filter(([_, pos]) => pos.qty !== 0).length === 0 ? (
              <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem" }}>
                今持っている銘柄はありません
              </p>
            ) : (
            Object.entries(player.holdings)
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
              }))}
          </div>

          <div style={{ width: "100%", height: 220, flexShrink: 0, marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            <h3 className="text-lg font-semibold mb-1" style={{ textAlign: 'center' }}>📊 ポートフォリオ</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65} // 円グラフのサイズ
                  fill="#8884d8"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                {/* ホバーした時のツールチップ */}
                <Tooltip
                  formatter={(value: number) => `¥${value.toLocaleString()}`}
                  contentStyle={{ 
                    background: "#1f2937", 
                    border: "1px solid #374151", 
                    borderRadius: "6px" 
                  }}
                  itemStyle={{ color: "white" }}
                />
                {/* 凡例 (右側に表示) */}
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: "12px", paddingLeft: "10px" }}
                  formatter={(value, _) => (
                    <span style={{ color: 'white' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* === 過去ニュース一覧 === */}
          <div
            style={{
              marginTop: "1rem",
              borderTop: "1px solid rgb(55, 65, 81)",
              paddingTop: "1rem",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <h2 className="text-lg font-semibold mb-2">📰 過去ニュース</h2>

            {newsLog.length === 0 ? (
              <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem" }}>
                まだニュースはありません
              </p>
            ) : (
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "1px solid rgb(55, 65, 81)",
                  borderRadius: "0.5rem",
                  background: "rgb(31, 41, 55)",
                  padding: "0.5rem 0.75rem",
                }}
              >
                {newsLog.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      borderBottom: "1px solid rgb(55, 65, 81)",
                      padding: "0.25rem 0",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                    onClick={() => setNewsPopup(ev)} // ← クリックで再表示もできる
                  >
                    {i + 1}. {ev.name}
                  </div>
                ))}
              </div>
            )}
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
              width: "420px",
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
              <span className={closeModal.qty > 0 ? "text-green-400" : "text-red-400"}>
                {closeModal.qty > 0 ? "LONG " : "SHORT "}
                {Math.abs(closeModal.qty)}株
              </span>
            </div>

            {/* --- 全決済の損益表示 --- */}
            {(() => {
              const posQty = closeModal.qty;
              const maxQty = Math.abs(posQty);
              const holding = player.holdings[closeModal.ticker];
              const avgPrice = holding?.avgPrice ?? 0;
              const currentPrice = latestPrices[closeModal.ticker] ?? 0;

              const pnl =
                posQty > 0
                  ? (currentPrice - avgPrice) * maxQty
                  : (avgPrice - currentPrice) * maxQty;

              return (
                <div className="text-sm mb-2">
                  全て決済した場合の損益：{" "}
                  <span
                    style={{
                      color: pnl >= 0 ? "#22c55e" : "#ef4444",
                      fontWeight: "bold",
                    }}
                  >
                    {pnl >= 0 ? "+" : ""}
                    {Math.floor(pnl).toLocaleString()} 円
                  </span>
                </div>
              );
            })()}

            {/* --- 全決済ボタン --- */}
            <button
              onClick={() => {
                handleClose(Math.abs(closeModal.qty));
                setCloseModal(null);
                setPartialQty("");
                setClosePct(0);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-lg mb-4"
            >
              すべて決済
            </button>

            {/* --- スライダー決済 --- */}
            <div style={{ borderTop: "1px solid rgb(55, 65, 81)", paddingTop: "1rem" }}>
              <p className="text-sm mb-2">
                🔧 決済割合 (%) を選択（{closePct}%）
              </p>

              {/* スナップ付きスライダー（吸い付く） */}
              <input
                type="range"
                min={0}
                max={100}
                step={10}  // ★10%刻みで吸い付く
                value={closePct}
                onChange={(e) => {
                  const raw = Number(e.target.value);

                  // ★吸い付く処理（最近の10%に丸める）
                  const snapped = Math.round(raw / 10) * 10;
                  setClosePct(snapped);

                  const maxQty = Math.abs(closeModal.qty);
                  const qty = Math.floor((maxQty * snapped) / 100);
                  setPartialQty(qty.toString());
                }}
                style={{
                  width: "100%",
                  cursor: "pointer",
                  appearance: "none",
                  height: "6px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #22c55e ${closePct}%, #4b5563 ${closePct}%)`,
                  marginBottom: "0.5rem",
                }}
              />

              {/* 決済数量表示 */}
              {partialQty && Number(partialQty) > 0 && (
                <div className="mb-2 text-sm">
                  決済数量：<span className="font-bold">{partialQty} 株</span>
                </div>
              )}

              {/* 損益計算 */}
              {partialQty && Number(partialQty) > 0 && (
                <div className="text-sm mb-3">
                  {(() => {
                    const qtyToClose = Number(partialQty);
                    const currentPrice = latestPrices[closeModal.ticker] ?? 0;

                    const holding = player.holdings[closeModal.ticker];
                    const avgPrice = holding?.avgPrice ?? 0;
                    const posQty = holding?.qty ?? 0;

                    const pnl =
                      posQty > 0
                        ? (currentPrice - avgPrice) * qtyToClose
                        : (avgPrice - currentPrice) * qtyToClose;

                    return (
                      <div>
                        今この数量を決済した場合の損益：{" "}
                        <span
                          style={{
                            color: pnl >= 0 ? "#22c55e" : "#ef4444",
                            fontWeight: "bold",
                          }}
                        >
                          {pnl >= 0 ? "+" : ""}
                          {Math.floor(pnl).toLocaleString()} 円
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* --- 手入力欄 --- */}
              <p className="text-sm mb-2">
                数量を入力 (最大: {Math.abs(closeModal.qty)})
              </p>

              <input
                type="number"
                placeholder="数量"
                value={partialQty}
                min={1}
                max={Math.abs(closeModal.qty)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPartialQty(e.target.value);

                  const maxQty = Math.abs(closeModal.qty);
                  const pct = Math.round((val / maxQty) * 100);

                  // 手入力も10%に吸い付く
                  setClosePct(Math.min(100, Math.max(0, Math.round(pct / 10) * 10)));
                }}
                className="rounded w-full mb-3"
                style={{
                  color: "white",
                  background: "rgb(55, 65, 81)",
                  border: "1px solid rgb(75, 85, 99)",
                  padding: "0.5rem",
                }}
              />

              {/* ボタン群 */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  onClick={() => {
                    setCloseModal(null);
                    setPartialQty("");
                    setClosePct(0);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  キャンセル
                </button>

                <button
                  onClick={() => {
                    const qty = Number(partialQty);
                    const maxQty = Math.abs(closeModal.qty);
                    if (qty > 0 && qty <= maxQty) {
                      handleClose(qty);
                      setCloseModal(null);
                      setPartialQty("");
                      setClosePct(0);
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


      {/* ★追加: 企業説明モーダル表示 */}
      {companyInfoTarget && (
        <CompanyModal 
          ticker={companyInfoTarget} 
          onClose={() => setCompanyInfoTarget(null)} 
        />
      )}


      {/* ここを忘れるとニュースが出ない */}
      {newsPopup && (
        <NewsModal
          ev={newsPopup}
          onClose={() => setNewsPopup(null)}
        />
      )}

      {/* ゲーム終了モーダル */}
      {gameOver && (
        <GameEndModal
          reason={gameOverReason!}
          player={player}
          onClose={() => window.location.reload()}
        />
      )}
    </div>
  );
}

