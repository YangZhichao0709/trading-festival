// ✅ 1. 内部ID（変わらないキー）
export const TICKERS = [
  "BANK",
  "SEMI",
  "AUTO",
  "PHARMA",
  "NITORI",
  "UTIL",
  "AIR",
  "NINTENDO",
  "ENEOS",
  "GOLD",
  "USDJPY",
  "NIKKEI",
] as const;

export type TickerId = typeof TICKERS[number];

// ✅ 2. 初期価格（IDベース）
export const INIT_PRICE: Record<TickerId, number> = {
  BANK: 2300,
  SEMI: 12000,
  AUTO: 2600,
  PHARMA: 4500,
  NITORI: 5000,
  UTIL: 600,
  AIR: 3200,
  NINTENDO: 6000,
  ENEOS: 1200,
  GOLD: 20000,
  USDJPY: 150,
  NIKKEI: 40000,
};

// ✅ 3. ボラティリティ（IDベース）
export const SIGMA: Record<TickerId, number> = {
  BANK: 0.02,
  SEMI: 0.02,
  AUTO: 0.02,
  PHARMA: 0.015,
  NITORI: 0.015,
  UTIL: 0.012,
  AIR: 0.025,
  NINTENDO: 0.018,
  ENEOS: 0.02,
  GOLD: 0.03,
  USDJPY: 0.003,
  NIKKEI: 0.015,
};

// ✅ 4. UI表示用（日本語＋絵文字）
export const TICKER_DISPLAY_NAME: Record<TickerId, string> = {
  BANK: "🏦 四井為友銀行",
  SEMI: "🖥️ 東亰エレクトロン",
  AUTO: "🚗 トヨダ自動車",
  PHARMA: "💊 大正製薬",
  NITORI: "🛋️ ニトリ",
  UTIL: "⚡️ 関西電力",
  AIR: "✈️ JAL/ANA",
  NINTENDO: "🎮 任天堂",
  ENEOS: "🛢️ ENEOS",
  GOLD: "🪙 ゴールド",
  USDJPY: "💱 為替(USD/JPY)",
  NIKKEI: "📈 日経平均",
};

// ✅ 5. ★ 修正: EVENTS をここ (constants.ts) に移動
export const EVENTS = [
  { 
    name: "パンデミック発生", 
    ticker: "AIR", 
    a: 2, k: 0.25, 
    description: "世界的なパンデミック発生。航空業界に甚大な被害。" 
  },
  { 
    name: "AIブーム到来！", 
    ticker: "SEMI", 
    a: 4, k: 0.15, 
    description: "新型AIチップの発表を受け、半導体需要が世界的に急増。" 
  },
  { 
    name: "歴史的な円安", 
    ticker: "USDJPY", 
    a: 3, k: 0.10, 
    description: "為替が大きく変動。輸出関連企業に強い追い風。" 
  },
  { 
    name: "日銀、金利引き上げ", 
    ticker: "BANK", 
    a: 3, k: 0.08, 
    description: "金融政策の変更が発表され、銀行株の利ざや改善期待が高まる。" 
  },
  { 
    name: "インバウンド絶好調", 
    ticker: "AIR", 
    a: 3, k: 0.12, 
    description: "訪日観光客数が過去最高を記録。航空株が買われている。" 
  },
  { 
    name: "中東情勢、悪化", 
    ticker: "ENEOS", 
    a: 2, k: 0.10, 
    description: "地政学的リスクの高まりを受け、原油価格が急騰。" 
  }
] as const;

// --- これ以降の型定義は、フロントエンド側で追加定義します ---

// ✅ 6. ニュースイベントの型定義 (フロントエンド用)
// (description を含む constants.ts の EVENTS から型を推論)
type EventConst = typeof EVENTS[number];
export type NewsEvent = EventConst & { tick: number };

// ✅ 7. プレイヤーの型定義 (フロントエンド用)
export type Position = { qty: number; avgPrice: number };
export type Player = { 
  cash: number; 
  holdings: Record<TickerId, Position>; // 内部IDがキー
  totalValue: number; 
  pnl: number;
};

// ✅ 8. ニュース画像のマッピング
export const NEWS_IMAGE_MAP: Record<string, string> = {
  "パンデミック発生": "/images/news/corona_shock.png",
  "AIブーム到来！": "/images/news/ai_boom.png",
  "歴史的な円安": "/images/news/yen_shock.png",
  "日銀、金利引き上げ": "/images/news/interest_rate.png",
  "インバウンド絶好調": "/images/news/tourism_boom.png",
  "中東情勢、悪化": "/images/news/oil_high.png",
};

// ✅ 9. デフォルト画像
export const DEFAULT_NEWS_IMAGE = "/images/news/default.png";

