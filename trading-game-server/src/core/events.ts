import { 
  TICKERS, 
  TickerId, 
  INIT_PRICE, 
  SIGMA, 
  EVENTS 
} from "./constants";

// ---------- 型定義 ----------
type PriceState = Record<TickerId, number[]>;
type EventData = { name: string; ticker: TickerId; a: number; k: number; tick: number };
type NewsLog = { time: string; name: string; ticker: TickerId };

// ---------- ゲーム状態 ----------
export const state: {
  prices: PriceState;
  activeEvents: EventData[];
  popup: (EventData & { tick: 0 }) | null;
  newsLog: NewsLog[];
  running: boolean;
} = {
  prices: Object.fromEntries(
    TICKERS.map(id => [id, [INIT_PRICE[id]]])
  ) as PriceState,
  activeEvents: [],
  popup: null,
  newsLog: [],
  running: false
};

// ---------- 正規乱数 ----------
const randn = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// ---------- イベント影響 ----------
const eventEffect = (a: number, k: number, x: number) =>
  x > 10 ? 0 : k * (x / a) * Math.exp(-x / a);

// ---------- 価格更新ロジック ----------
export function updatePrices(): void {
  const p = state.prices;

  // ランダムノイズ
  const rand: Record<TickerId, number> = {} as any;
  for (const t of TICKERS) {
    rand[t] = randn() * SIGMA[t];
  }

  // イベント発生
  const event_r: Record<TickerId, number> = Object.fromEntries(
    TICKERS.map(id => [id, 0])
  ) as Record<TickerId, number>;

  if (Math.random() < 0.1) {
    const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    if (randomEvent) {
      const e: EventData = { ...randomEvent, tick: 0 };
      state.popup = e;
      state.activeEvents.push(e);

      state.newsLog.push({
        time: new Date().toLocaleTimeString("ja-JP", { hour12: false }),
        name: e.name,
        ticker: e.ticker
      });
    }
  }

  // イベントの時間経過
  for (let i = state.activeEvents.length - 1; i >= 0; i--) {
    const ev = state.activeEvents[i];
    ev.tick++;
    if (ev.tick > 10) {
      state.activeEvents.splice(i, 1);
      continue;
    }
    event_r[ev.ticker] += eventEffect(ev.a, ev.k, ev.tick);
  }

  // 相互依存の計算用（USDJPY → 為替影響）
  const fxChange = rand["USDJPY"] + event_r["USDJPY"];

  // 各ティッカーの変化率
  const r_total: Record<TickerId, number> = {} as any;
  for (const t of TICKERS) {
    let base = rand[t] + event_r[t];

    if (t === "BANK") {
      r_total[t] = base;
    } 
    else if (["AUTO","SEMI","NITORI","NINTENDO","ENEOS"].includes(t)) {
      const weight: Record<TickerId, number> = {
        AUTO: 0.6, SEMI: 0.4, NITORI: -0.2, NINTENDO: 0.3, ENEOS: 0.2,
        BANK:0,PHARMA:0,UTIL:0,AIR:0,GOLD:0,USDJPY:0,NIKKEI:0
      };
      r_total[t] = base + fxChange * weight[t];
    } 
    else if (t === "AIR" || t === "UTIL") {
      const ene = rand["ENEOS"] + event_r["ENEOS"];
      r_total[t] = base + ene * (t === "AIR" ? -0.6 : -0.3);
    } 
    else {
      r_total[t] = base;
    }
  }

  // 日経平均（他ティッカーの単純平均とする）
  const idxTargets: TickerId[] = ["BANK","SEMI","AUTO","PHARMA","NITORI","UTIL","AIR","NINTENDO","ENEOS"];
  r_total["NIKKEI"] =
    idxTargets.reduce((s, t) => s + r_total[t], 0) / idxTargets.length;

  // 価格反映
  for (const t of TICKERS) {
    const arr = p[t];
    const last = arr[arr.length - 1];
    const next = last * (1 + r_total[t]);
    arr.push(Math.max(0.001, next));
  }
}
