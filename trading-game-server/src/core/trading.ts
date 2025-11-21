import { state } from "./events";
import { TICKERS, TickerId } from "./constants";

// --- 型定義 ---
type Holding = { qty: number; avgPrice: number };
type Player = {
  cash: number;
  holdings: Record<TickerId, Holding>;
  pnl: number;
  totalValue: number;
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
    };
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

// --- ★ 売買ロジック（証拠金ベースで修正済） ---
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

  // === BUY ===
  if (side === "buy") {
    if (pos.qty >= 0) {
      const cost = price * q;
      if (cost > player.cash) throw new Error(`資金不足: ${cost.toLocaleString()}円必要`);
      player.cash -= cost;
      pos.avgPrice = (pos.avgPrice * pos.qty + price * q) / (pos.qty + q);
      pos.qty += q;
    } else {
      // 空売りの買い戻し
      const buyBackQty = Math.min(absQty, q);
      const entry = pos.avgPrice;
      const marginFreed = entry * buyBackQty;
      const realizedPnl = (entry - price) * buyBackQty;
      player.cash += marginFreed + realizedPnl;
      pos.qty += buyBackQty;
      if (pos.qty === 0) pos.avgPrice = 0;
    }
  }

  // === SELL ===
  if (side === "sell") {
    if (pos.qty > 0) {
      // ロングの売却
      const sellQty = Math.min(pos.qty, q);
      player.cash += price * sellQty;
      pos.qty -= sellQty;
      if (pos.qty === 0) pos.avgPrice = 0;
    } else {
      // 新規空売り
      const marginNeed = price * q;
      if (marginNeed > player.cash) throw new Error(`証拠金不足: ${marginNeed.toLocaleString()}円必要`);
      player.cash -= marginNeed;
      const absBefore = Math.abs(pos.qty);
      pos.avgPrice = (pos.avgPrice * absBefore + price * q) / (absBefore + q);
      pos.qty -= q;
    }
  }

  updatePlayerPnl(player);
  return player;
}

// --- プレイヤー情報返却 ---
export function getPlayerInfo(id: string): Player {
  const player = getPlayer(id);
  updatePlayerPnl(player);
  return player;
}
