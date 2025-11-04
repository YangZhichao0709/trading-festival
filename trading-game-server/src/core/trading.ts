import { state } from "./events";
// ✅ 1. constants.ts から TICKERS と TickerId 型をインポート
import { TICKERS } from "./constants";
import type { TickerId } from "./constants";

// 型定義
type Holding = { qty: number; avgPrice: number };
type Player = {
  cash: number;
  // ✅ 2. holdings のキーを TickerId に変更
  holdings: Record<TickerId, Holding>;
  pnl: number;
  totalValue: number; 
};

// プレイヤー状態を格納
export const players: Record<string, Player> = {};

// 指定したIDのプレイヤーを取得（なければ初期化）
function getPlayer(id: string): Player {
  if (!players[id]) {
    players[id] = {
      cash: 100_000_000, 
      holdings: Object.fromEntries(
        // ✅ 3. TICKER_ORDER -> TICKERS に変更
        TICKERS.map(ticker => [ticker, { qty: 0, avgPrice: 0 }])
      ),
      pnl: 0,
      totalValue: 100_000_000,
    };
  }
  return players[id];
}

// プレイヤーの総資産と損益を更新する
function updatePlayerPnl(player: Player): void {
  let equity = player.cash;
  // ✅ 4. tk は TickerId になる
  for (const [tk, h] of Object.entries(player.holdings)) {
    // tk (TickerId) をキーとして state.prices を引く
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

// 売買処理
export function trade(
  player_id: string,
  // ✅ 5. ticker の型を string -> TickerId に変更
  ticker: TickerId,
  side: "buy" | "sell",
  quantity: number
): Player {
  const player = getPlayer(player_id);
  // ✅ 6. ticker (TickerId) で prices を引く
  const priceList = state.prices[ticker];
  if (!priceList || priceList.length === 0) {
    throw new Error("相場情報がありません。");
  }
  
  const price = priceList[priceList.length - 1];
  
  if (typeof price !== 'number') {
    throw new Error(`銘柄 ${ticker} の価格が取得できませんでした。`);
  }

  const q = Math.max(1, Math.floor(Number(quantity) || 1));

  // ✅ 7. getPlayer で初期化済みのため、pos は必ず存在する
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

  // player.holdings[ticker] = pos; // pos は参照なので再代入不要
  updatePlayerPnl(player); 
  return player;
}

// プレイヤー情報を取得
export function getPlayerInfo(id: string): Player {
  const player = getPlayer(id);
  updatePlayerPnl(player); // 取得時にも最新の損益を計算
  return player;
}