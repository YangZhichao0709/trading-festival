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

// ✅ 2. 初期価格・ボラティリティなども ID ベースに変更
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

// ✅ 3. UI用：表示名（日本語+絵文字）をここで定義すればOK
export const TICKER_DISPLAY_NAME: Record<TickerId, string> = {
  BANK: "🏦 四井為友銀行",
  SEMI: "🖥️ 半導体株",
  AUTO: "🚗 自動車株",
  PHARMA: "💊 製薬株",
  NITORI: "🛋️ ニトリ株",
  UTIL: "⚡ 電力株",
  AIR: "✈️ 航空株",
  NINTENDO: "🎮 任天堂株",
  ENEOS: "🛢️ ENEOS株",
  GOLD: "🪙 ゴールド",
  USDJPY: "💱 為替(USD/JPY)",
  NIKKEI: "📈 日経平均",
};
