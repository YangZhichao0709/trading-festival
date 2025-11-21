// src/core/events.ts

import { TICKERS, TickerId, SIGMA, INIT_PRICE, EVENTS } from "./constants";

// --- 型定義 (より厳格化) ---
type PriceState = Record<TickerId, number[]>;

// ★ 変更: k が「関数 | number」であることを EventConst で定義
type EventConst = typeof EVENTS[number];

// ★ 変更: activeEvents に格納する型。k は「数値」に解決済みとする
type ResolvedEventConst = Omit<EventConst, 'tickers'> & {
  tickers: (Omit<EventConst['tickers'][number], 'k'> & { k: number })[];
};

// ★ 変更: eventDefinition の型を ResolvedEventConst に変更
type ActiveEventData = {
  tick: number;
  eventDefinition: ResolvedEventConst; // kが解決済みの定義
};

type NewsLog = { time: string; name: string };

// --- ゲームの全体状態 ---
export const state: {
  prices: PriceState;
  activeEvents: ActiveEventData[];
  popup: ActiveEventData | null; // ★ 型が ActiveEventData に変更
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
 * イベントIDに基づいてイベントを発生させ、state に登録する
 * @param eventId constants.ts の EVENTS に定義された id
 **/
export function triggerEventById(eventId: string): void {
  const eventDef = EVENTS.find(e => e.id === eventId);
  if (!eventDef) {
    console.warn(`[Event] triggerEventById: ID "${eventId}" not found.`);
    return;
  }

  // kの値を解決 (kが関数なら実行し、数値ならそのまま使用)
  const resolvedTickers = eventDef.tickers.map(tickerEffect => ({
    ...tickerEffect,
    k: typeof tickerEffect.k === 'function' ? tickerEffect.k() : tickerEffect.k,
  }));

  // k が解決済みのイベント定義 (ActiveEventData 用)
  const resolvedEventDef: ResolvedEventConst = {
    ...eventDef,
    tickers: resolvedTickers,
  };

  const e: ActiveEventData = {
    eventDefinition: resolvedEventDef,
    tick: 0,
  };

  state.popup = e;
  state.activeEvents.push(e);

  const now = new Date().toLocaleTimeString("ja-JP", { hour12: false });
  state.newsLog.push({
    time: now,
    name: e.eventDefinition.name,
  });

  console.log(`[Event] Triggered (Story/Random): ${e.eventDefinition.name}`);
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

  // --- イベント経過処理 ---
  const event_r: Record<string, number> = Object.fromEntries(TICKERS.map(t => [t, 0]));

  for (let i = state.activeEvents.length - 1; i >= 0; i--) {
    const ev = state.activeEvents[i];
    if (!ev) {
      state.activeEvents.splice(i, 1);
      continue;
    }

    ev.tick++;

    if (ev.tick > 10) { // イベント終了
      state.activeEvents.splice(i, 1);
      continue;
    }

    // ev.eventDefinition は k が解決済みの ResolvedEventConst
    const definition = ev.eventDefinition;

    for (const tickerEffect of definition.tickers) {
      // ★ k はここで「必ず number」になっている
      const { ticker, a, k } = tickerEffect;
      
      const eff = eventEffect(a, k, ev.tick);
      
      if (Object.prototype.hasOwnProperty.call(event_r, ticker)) {
        event_r[ticker] = (event_r[ticker] ?? 0) + eff;
      }
    }
  }

  // --- ドル円の「固定上昇率」を計算 ---
  const usdjpyPrices = p["USDJPY"];
  let fixedUsdJpyPctChange = 0; 
  if (usdjpyPrices && usdjpyPrices.length > 0) {
    const lastUsdJpy = usdjpyPrices[usdjpyPrices.length - 1];
    if (typeof lastUsdJpy === 'number' && lastUsdJpy > 0) {
      const fixedUsdJpyIncrease = 0.10; 
      fixedUsdJpyPctChange = fixedUsdJpyIncrease / lastUsdJpy;
    }
  }
  
  const fxChange = (rand["USDJPY"] ?? 0) + (event_r["USDJPY"] ?? 0) + fixedUsdJpyPctChange;

  // --- 各銘柄の変動率計算 (r_total) ---
  const r_total: Record<string, number> = {};
  for (const t of TICKERS) {
    if (t === "NIKKEI") continue;
    if (t === "USDJPY") {
      r_total[t] = fxChange;
      continue; 
    }
    const base = (rand[t] ?? 0) + (event_r[t] ?? 0);
    if (t === "BANK") {
      r_total[t] = base;
    } else if (["AUTO", "SEMI", "NITORI", "GAME", "ENEOS"].includes(t)) {
      const weight: Partial<Record<TickerId, number>> = {
        "AUTO": 2.4, "SEMI": 1.6, "NITORI": -1, "GAME": 1.2, "ENEOS": 1
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
  const NIKKEI_WEIGHTS: Partial<Record<TickerId, number>> = {
    "SEMI": 3.0, "AUTO": 2.5, "BANK": 2.0, "PHARMA": 1.5, "GAME": 1.0, "ENEOS": 1.0, "NITORI": 0.5, "UTIL": 0.5, "AIR": 0.5
  };
  const nikkeiTickers = Object.keys(NIKKEI_WEIGHTS) as TickerId[];
  const totalWeight = nikkeiTickers.reduce((sum, t) => sum + (NIKKEI_WEIGHTS[t] ?? 0), 0);
  const weightedSum = nikkeiTickers.reduce((sum, t) => {
    const weight = NIKKEI_WEIGHTS[t] ?? 0;
    const change = r_total[t] ?? 0;
    return sum + (change * weight);
  }, 0);
  if (totalWeight > 0) {
    r_total["NIKKEI"] = weightedSum / totalWeight;
  } else {
    r_total["NIKKEI"] = 0;
  }

  // --- 最終価格更新 ---
  for (const t of TICKERS) {
    const priceArray = p[t];
    if (!priceArray || priceArray.length === 0) continue;
    const last = priceArray[priceArray.length - 1];
    if (typeof last !== 'number') continue; 
    const next = last * (1 + (r_total[t] || 0));
    priceArray.push(Math.max(0.001, next));
  }
}