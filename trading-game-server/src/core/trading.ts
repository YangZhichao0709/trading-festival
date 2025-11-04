import { state } from "./events";
// ★ リファクタリング: TICKERS と TickerId をインポート
import { TICKERS, TickerId } from "./constants"; 

// --- 型定義 (より厳格化) ---
type Holding = { qty: number; avgPrice: number };
type Player = {
  cash: number;
  // ★ リファクタリング: 'string' から TickerId に変更
  holdings: Record<TickerId, Holding>;
  pnl: number;
  totalValue: number; 
};

// プレイヤー状態を格納
export const players: Record<string, Player> = {};

/**
 * 指定したIDのプレイヤーを取得（なければ初期化）
 */
function getPlayer(id: string): Player {
  if (!players[id]) {
    players[id] = {
      cash: 100_000_000, 
      // ★ リファクタリング: TICKER_ORDER -> TICKERS
      holdings: Object.fromEntries(
        TICKERS.map(ticker => [ticker, { qty: 0, avgPrice: 0 }])
      ) as Record<TickerId, Holding>, // 型アサーション
      pnl: 0,
      totalValue: 100_000_000,
    };
  }
  return players[id];
}

/**
 * プレイヤーの総資産と損益を更新する
 */
function updatePlayerPnl(player: Player): void {
  let equity = player.cash;
  
  // Object.entries はキーを string として返すため、型キャストが必要
  for (const [tk, h] of Object.entries(player.holdings)) {
    // ★ リファクタリング: tk を TickerId として state.prices を引く
    const priceList = state.prices[tk as TickerId];
    
    if (priceList && priceList.length > 0) {
      const px = priceList[priceList.length - 1];
      if (typeof px === 'number') {
        equity += h.qty * px; 
      }
    }
  }
  player.totalValue = equity;
  player.pnl = equity - 100_000_000;
}

/**
 * 売買処理
 */
export function trade(
  player_id: string,
  // ★ リファクタリング: ticker: string -> ticker: TickerId
  ticker: TickerId,
  side: "buy" | "sell",
  quantity: number
): Player {
  const player = getPlayer(player_id);
  // ★ ticker は TickerId なので、state.prices から安全に引ける
  const priceList = state.prices[ticker]; 
  
  if (!priceList || priceList.length === 0) {
    throw new Error("相場情報がありません。");
  }
  
  const price = priceList[priceList.length - 1]; 
  
  if (typeof price !== 'number') {
    throw new Error(`銘柄 ${ticker} の価格が取得できませんでした。`);
  }

  const q = Math.max(1, Math.floor(Number(quantity) || 1));

  // ★ ticker は TickerId なので、player.holdings から安全に引ける
  // (getPlayer で初期化が保証されているため `|| ...` は不要)
  const pos = player.holdings[ticker]; 

  if (side === "buy") {
    const cost = price * q;
    if (player.cash < cost) throw new Error("資金が不足しています。");
    player.cash -= cost;
    
    if (pos.qty >= 0) { 
      pos.avgPrice = (pos.avgPrice * pos.qty + price * q) / (pos.qty + q);
    } else { 
      if (pos.qty + q === 0) pos.avgPrice = 0;
    }
    pos.qty += q;

  } else if (side === "sell") {
    player.cash += price * q;

    if (pos.qty <= 0) { 
       pos.avgPrice = (pos.avgPrice * Math.abs(pos.qty) + price * q) / (Math.abs(pos.qty) + q);
    } else { 
      if (pos.qty - q === 0) pos.avgPrice = 0;
    }
    pos.qty -= q;
  }

  // player.holdings[ticker] = pos; // pos は参照なので、この行は不要
  updatePlayerPnl(player); 
  return player;
}

/**
 * プレイヤー情報を取得
 */
export function getPlayerInfo(id: string): Player {
  const player = getPlayer(id);
  updatePlayerPnl(player);
  return player;
}
