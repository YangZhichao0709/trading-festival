import { state } from "./events";
import { TICKERS, TickerId } from "./constants";

// --- 型定義 ---
type Holding = { qty: number; avgPrice: number };

export type HistoryRecord = { // トレード記録・PDF出力用
  timestamp: string;
  total_asset: number;
  pnl: number;       // ? を外して必須にしました
  price: number;     // ? を外して必須にしました
  quantity: number;  // ? を外して必須にしました
  ticker: string;    // ? を外して必須にしました
  type: 'trade' | 'daily';
};

type Player = {
  cash: number;
  holdings: Record<TickerId, Holding>;
  pnl: number;
  totalValue: number;
  history: HistoryRecord[];
};

export const players: Record<string, Player> = {};

// --- プレイヤー初期化 ---
function getPlayer(id: string): Player {
  if (!players[id]) {
    players[id] = {
      cash: 100_000_000,
      holdings: Object.fromEntries(
        TICKERS.map((t) => [t, { qty: 0, avgPrice: 0 }])
      ) as Record<TickerId, Holding>,
      pnl: 0,
      totalValue: 100_000_000,
      history: []
    };
    // 念のため
    if (!players[id].history) {
      players[id].history = [];
    }
  }
  return players[id];
}

// --- ★ 総資産（Equity / 証拠金ベース）を更新する ---
function updatePlayerPnl(player: Player): void {
  let equity = player.cash;

  for (const [tk, h] of Object.entries(player.holdings)) {
    const ticker = tk as TickerId;
    if (h.qty === 0) continue;

    const priceList = state.prices[ticker];
    if (!priceList || priceList.length === 0) continue;

    const px = priceList[priceList.length - 1];
    if (typeof px !== "number") continue;

    if (h.qty > 0) {
      // ✅ ロングポジ → 評価額加算
      equity += h.qty * px;
    } else {
      // ✅ 空売りポジ → 拘束証拠金 + 評価損益
      const absQty = Math.abs(h.qty);
      const entryPrice = h.avgPrice;

      const margin = entryPrice * absQty;
      const unrealizedPnl = (entryPrice - px) * absQty;

      equity += margin + unrealizedPnl;
    }
  }

  player.totalValue = equity;
  player.pnl = equity - 100_000_000;
}

// --- ★ 売買ロジック（履歴記録機能を追加） ---
export function trade(
  player_id: string,
  ticker: TickerId,
  side: "buy" | "sell",
  quantity: number
): Player {
  const player = getPlayer(player_id);
  const priceList = state.prices[ticker];

  if (!priceList?.length) throw new Error("相場情報がありません。");
  const price = priceList.at(-1);
  if (typeof price !== "number") throw new Error(`銘柄 ${ticker} の価格が取得できません。`);

  const q = Math.floor(Number(quantity));
  if (!Number.isFinite(q) || q <= 0) throw new Error("数量が不正です。");

  const pos = player.holdings[ticker];
  const absQty = Math.abs(pos.qty);

  // 履歴記録用の変数
  let executedQty = 0;     // 実際に約定した数量
  let tradeRealizedPnl = 0; // 今回の取引での確定損益

  // === BUY ===
  if (side === "buy") {
    if (pos.qty >= 0) {
      // ロング新規・買い増し
      const cost = price * q;
      if (cost > player.cash) throw new Error(`資金不足: ${cost.toLocaleString()}円必要`);
      
      player.cash -= cost;
      pos.avgPrice = (pos.avgPrice * pos.qty + price * q) / (pos.qty + q);
      pos.qty += q;

      executedQty = q;
      tradeRealizedPnl = 0; // 新規建てなので確定損益なし

    } else {
      // 空売りの買い戻し (決済)
      const buyBackQty = Math.min(absQty, q); // 保有数以上に注文しても、保有分だけ決済する仕様
      
      const entry = pos.avgPrice;
      const marginFreed = entry * buyBackQty;
      const realizedPnl = (entry - price) * buyBackQty; // (売り値 - 買い戻し値) * 数量
      
      player.cash += marginFreed + realizedPnl;
      pos.qty += buyBackQty;
      if (pos.qty === 0) pos.avgPrice = 0;

      executedQty = buyBackQty;
      tradeRealizedPnl = realizedPnl;
    }
  }

  // === SELL ===
  if (side === "sell") {
    if (pos.qty > 0) {
      // ロングの売却 (決済)
      const sellQty = Math.min(pos.qty, q); // 保有数以上に売れない仕様
      
      // 確定損益計算: (現在値 - 取得単価) * 数量
      const realizedPnl = (price - pos.avgPrice) * sellQty;

      player.cash += price * sellQty;
      pos.qty -= sellQty;
      if (pos.qty === 0) pos.avgPrice = 0;

      executedQty = sellQty;
      tradeRealizedPnl = realizedPnl;

    } else {
      // 新規空売り
      const marginNeed = price * q;
      if (marginNeed > player.cash) throw new Error(`証拠金不足: ${marginNeed.toLocaleString()}円必要`);
      
      player.cash -= marginNeed;
      const absBefore = Math.abs(pos.qty);
      pos.avgPrice = (pos.avgPrice * absBefore + price * q) / (absBefore + q);
      pos.qty -= q;

      executedQty = q;
      tradeRealizedPnl = 0; // 新規建てなので確定損益なし
    }
  }

  // 資産状況を再計算
  updatePlayerPnl(player);

  // ▼▼▼ 履歴に追加 (PDF出力用) ▼▼▼
  if (!player.history) player.history = [];
  
  player.history.push({
    timestamp: new Date().toISOString(),
    total_asset: player.totalValue,
    pnl: tradeRealizedPnl,
    price: price,
    quantity: executedQty, // 注文数量(q)ではなく、実際の約定数量を記録
    ticker: ticker,
    type: 'trade'
  });
  // ▲▲▲▲▲▲

  return player;
}

// --- プレイヤー情報返却 ---
export function getPlayerInfo(id: string): Player {
  const player = getPlayer(id);
  updatePlayerPnl(player);
  return player;
}