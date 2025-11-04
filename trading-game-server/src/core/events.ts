// ★ 修正: EVENTS も constants からインポート
import { TICKERS, TickerId, SIGMA, INIT_PRICE, EVENTS } from "./constants";

// --- 型定義 (より厳格化) ---
type PriceState = Record<TickerId, number[]>;
// ★ 修正: Event型も constants の EVENTS から推論させる
type EventConst = typeof EVENTS[number];
type EventData = EventConst & { tick: number }; // イベントの実行時データ
type NewsLog = { time: string; name: string; ticker: TickerId };

// --- ゲームの全体状態 ---
export const state: {
  prices: PriceState;
  activeEvents: EventData[];
  popup: (EventConst & { tick: 0 }) | null; // ★ 型を修正
  newsLog: NewsLog[];
  running: boolean;
} = {
  prices: Object.fromEntries(
    TICKERS.map(t => [t, [INIT_PRICE[t]]])
  ) as PriceState,
  activeEvents: [],
  popup: null,
  newsLog: [],
  running: false 
};

/**
 * 正規乱数（Box-Muller法）
 */
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * イベント効果（指数関数的減衰）
 */
function eventEffect(a: number, k: number, x: number): number {
  return x > 10 ? 0 : k * (x / a) * Math.exp(-x / a);
}

/**
 * 価格を1ティック更新
 */
export function updatePrices(): void {
  const p = state.prices;

  // --- ランダムノイズ ---
  const rand: Record<string, number> = {};
  for (const t of TICKERS) {
    if (t !== "NIKKEI") {
      rand[t] = randn() * (SIGMA[t] || 0.02);
    }
  }

  // --- イベント発生 ---
  const event_r: Record<string, number> = Object.fromEntries(TICKERS.map(t => [t, 0]));
  if (Math.random() < 0.1) {
    const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    if (randomEvent) {
      const e: EventConst & { tick: 0 } = { ...randomEvent, tick: 0 as const };
      
      // ★ 修正: TS2322 (型推論) エラーの解決
      // `popup` (狭い型) への代入を *先* に行う
      state.popup = e;
      // `activeEvents` (広い型) への push を *後* に行う
      state.activeEvents.push(e); 

      const now = new Date().toLocaleTimeString("ja-JP", { hour12: false });
      state.newsLog.push({
        time: now,
        name: e.name,
        ticker: e.ticker
      });
    }
  }

  // --- イベント経過処理 ---
  for (let i = state.activeEvents.length - 1; i >= 0; i--) {
    // ★ 修正: 'ev' が undefined でないことを確認 (TS18048)
    const ev = state.activeEvents[i];
    if (!ev) continue; // ガード節

    ev.tick++; // TS18048 解消
    if (ev.tick > 10) { // TS18048 解消
      state.activeEvents.splice(i, 1);
      continue;
    }

    const eff = eventEffect(ev.a, ev.k, ev.tick); // TS18048 解消
    const ticker = ev.ticker;
    if (Object.prototype.hasOwnProperty.call(event_r, ticker)) {
      event_r[ticker] = (event_r[ticker] ?? 0) + eff;
    }
  }

  // --- 相互依存ロジック ---
  const fxChange = (rand["USDJPY"] ?? 0) + (event_r["USDJPY"] ?? 0);

  const r_total: Record<string, number> = {};
  for (const t of TICKERS) {
    if (t === "NIKKEI") continue;
    const base = (rand[t] ?? 0) + (event_r[t] ?? 0);

    if (t === "BANK") {
      r_total[t] = base;
    } else if (["AUTO", "SEMI", "NITORI", "NINTENDO", "ENEOS"].includes(t)) {
      const weight: Partial<Record<TickerId, number>> = {
        "AUTO": 0.6, "SEMI": 0.4, "NITORI": -0.2, "NINTENDO": 0.3, "ENEOS": 0.2
      };
      r_total[t] = base + fxChange * (weight[t] || 0);
    } else if (["AIR", "UTIL"].includes(t)) {
      const eneosChange = (rand["ENEOS"] ?? 0) + (event_r["ENEOS"] ?? 0);
      const w = t === "AIR" ? -0.6 : -0.3;
      r_total[t] = base + eneosChange * w;
    } else {
      r_total[t] = base;
    }
  }

  // --- 日経平均 ---
  const non_macro: TickerId[] = [
    "BANK", "SEMI", "AUTO", "PHARMA",
    "NITORI", "UTIL", "AIR", "NINTENDO", "ENEOS"
  ];
  r_total["NIKKEI"] =
    non_macro.reduce((sum, t) => sum + (r_total[t] ?? 0), 0) / non_macro.length;

  // --- 最終価格更新 ---
  for (const t of TICKERS) {
    const priceArray = p[t];
    if (!priceArray || priceArray.length === 0) continue;

    // ★ 修正: 'last' が undefined でないことを確認 (TS18048)
    const last = priceArray[priceArray.length - 1];
    if (typeof last !== 'number') continue; // 型ガード

    const next = last * (1 + (r_total[t] || 0));
    priceArray.push(Math.max(0.001, next));
  }
}

