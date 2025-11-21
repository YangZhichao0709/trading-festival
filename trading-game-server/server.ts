import express, { Request, Response } from "express";
import * as http from "http";
import { Server } from "socket.io";
import cors from "cors";

import { state, updatePrices, triggerEventById } from "./src/core/events";
import { trade, getPlayerInfo, players } from "./src/core/trading";
import {
  INIT_PRICE,
  TICKERS,
  TickerId,
  BUSINESS_DAYS_2026,
  STORY_ROUTES,
  RANDOM_EVENT_PROB,
  EVENTS,
} from "./src/core/constants";

type GameState = typeof state;

// ------------------------------------
// CORS設定
// ------------------------------------
const allowedOrigins = [
  'https://trading-festival.web.app', // 本番フロントエンド
  'http://localhost:5173'             // ローカル開発用
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  }
});

// ------------------------------------
// Socket.IO
// ------------------------------------
io.on("connection", (socket) => {
  console.log(`[Socket.IO] connected: ${socket.id}`);

  socket.on("player:join", (name: string) => {
    try {
      if (!name || typeof name !== 'string' || name.trim() === '') {
        console.warn(`[Socket.IO] "player:join" への不正な名前です: ${name}`);
        return;
      }

      const playerName = name.trim();
      console.log(`[Socket.IO] "player:join" を受信しました: ${playerName}`);
      getPlayerInfo(playerName);
      broadcastPlayers();

    } catch (e: any) {
      console.error(`[Socket.IO] "player:join" ( ${name} ) の処理中にエラー:`, e?.message ?? e);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] disconnected: ${socket.id}`);
  });
});

function broadcastPlayers() {
  io.emit("players:update", players);
}
function broadcastTick() {
  io.emit("game:tick", state);
}

// ------------------------------------
// Game loop control (ストーリーモード対応)
// ------------------------------------
let gameInterval: NodeJS.Timeout | null = null;
let currentBusinessDayIndex = 0; // 営業日計算用

// ★ ストーリーモード管理用変数
let currentStoryRoute: (typeof STORY_ROUTES[keyof typeof STORY_ROUTES]) | null = null;
let randomEventIds: string[] = []; // ランダムイベント専用のIDリスト

/**
 * ストーリーとランダムイベントリストを選択・初期化する関数
 */
function selectStoryRoute() {
  // 1. ストーリーをランダムに選択
  const routeKeys = Object.keys(STORY_ROUTES) as (keyof typeof STORY_ROUTES)[];
  
  // ★ 修正: 末尾に ! を追加 (配列アクセスが undefined にならないことを明示)
  const randomKey = routeKeys[Math.floor(Math.random() * routeKeys.length)]!;
  
  currentStoryRoute = STORY_ROUTES[randomKey];
  console.log(`[Game] Story route selected: ${randomKey}`);

  // 2. ランダムイベント候補をフィルタリング
  const randomStartIndex = EVENTS.findIndex(e => e.id === "rating_bank_up");
  
  if (randomStartIndex === -1) {
    console.warn("[Game] Could not find start of random events ('rating_bank_up'). Using fallback.");
    randomEventIds = [];
  } else {
    randomEventIds = EVENTS.slice(randomStartIndex).map(e => e.id);
  }
  console.log(`[Game] ${randomEventIds.length} random-only events loaded.`);
}

function startGameLoop(tickMs = 3000) {
  if (gameInterval) {
    console.log("[Game] Loop already running. Skip starting.");
    return;
  }

  // ★ ゲーム開始時にストーリーが未選択なら選択する
  if (!currentStoryRoute) {
    selectStoryRoute();
  }

  console.log("[Game] Starting game loop.");
  state.running = true;

  gameInterval = setInterval(() => {
    try {
      currentBusinessDayIndex++; // 営業日進行

      // ゲーム終了判定
      if (currentBusinessDayIndex >= BUSINESS_DAYS_2026.length) {
        console.log("[Game] Final business day reached. Ending game.");
        stopGameLoop();
        io.emit("game:end");   // フロントへ終了通知
        return;
      }

      // 現在の日付を通知
      broadcastGameDate();

      // ★★★ イベント発生ロジック (ストーリー優先) ★★★
      if (currentStoryRoute) {
        // 1. 今日の日付に設定されているストーリーイベントを探す
        const storyEvent = currentStoryRoute.find(
          (e) => e.dayIndex === currentBusinessDayIndex
        );

        if (storyEvent) {
          // ストーリーイベントがあれば発生させる
          console.log(`[Story] Day ${currentBusinessDayIndex}: Triggering ${storyEvent.eventId}`);
          triggerEventById(storyEvent.eventId);
        } else {
          // 2. ストーリーが無い日 → ランダムイベントの抽選
          if (Math.random() < RANDOM_EVENT_PROB && randomEventIds.length > 0) {
            // ★ 修正: 末尾に ! を追加
            const randomId = randomEventIds[Math.floor(Math.random() * randomEventIds.length)]!;
            
            console.log(`[Random] Day ${currentBusinessDayIndex}: Triggering ${randomId}`);
            triggerEventById(randomId);
          }
        }
      }

      // 価格更新 (ノイズ計算 + 発生中イベントの消化)
      updatePrices();

      // プレイヤー情報の更新
      for (const name of Object.keys(players)) {
        getPlayerInfo(name);
      }

      broadcastPlayers();
      broadcastTick();

      // ニュース処理: triggerEventById で state.popup がセットされていれば配信
      const popup = (state as GameState).popup;
      if (popup && popup.eventDefinition) {
        // クライアントへ送信 (eventDefinition は k が数値解決済み)
        io.emit("game:news", popup.eventDefinition);
        (state as GameState).popup = null;
      }

    } catch (e: any) {
      console.error("[Game Loop Error] Stopping loop due to error:", e?.message ?? e);
      stopGameLoop();
    }
  }, tickMs);
}

function stopGameLoop() {
  if (gameInterval) {
    console.log("[Game] Stopping game loop.");
    clearInterval(gameInterval);
    gameInterval = null;
  }
  state.running = false;
}


function broadcastGameDate() {
  const dateString = BUSINESS_DAYS_2026[currentBusinessDayIndex];

  // JST 9時固定の UNIX 秒に変換
  const unixSec = Math.floor(
    new Date(dateString + "T09:00:00+09:00").getTime() / 1000
  );

  io.emit("game:date", {
    unix: unixSec,
    index: currentBusinessDayIndex,
    remaining: BUSINESS_DAYS_2026.length - currentBusinessDayIndex - 1,
  });
}


function resetPlayers() {
  console.log("[Reset] Clearing players.");
  for (const k of Object.keys(players)) delete players[k];
}

function resetState() {
  console.log("[Reset] Resetting all state with INIT_PRICE.");

  state.prices = Object.fromEntries(
    TICKERS.map(t => [t, [INIT_PRICE[t]]])
  ) as Record<TickerId, number[]>;

  state.activeEvents = [];
  state.newsLog = [];
  state.popup = null;
  state.running = false;

  console.log("[Reset] State successfully reinitialized.");
}

function resetAll() {
  stopGameLoop();
  resetPlayers();
  resetState();
  currentBusinessDayIndex = 0;

  // ★ ストーリーとランダムイベントリストをリセット (次回start時に再抽選)
  currentStoryRoute = null;
  randomEventIds = [];

  io.emit("game:reset");
  broadcastPlayers();
  broadcastTick();
  console.log("[Reset] Completed.");
}

// ------------------------------------
// REST API
// ------------------------------------

app.get("/", (_req: Request, res: Response) => {
  res.status(200).send(`<h1>Trading Festival Game Server</h1><p>Socket.IO running. PID=${process.pid}</p>`);
});

app.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, running: state.running, players: Object.keys(players).length });
});

app.post("/game/start", (_req: Request, res: Response) => {
  console.log("[GameMaster] start requested");
  startGameLoop(3000);
  io.emit("game:start");
  res.status(200).json({ message: "Game Started" });
});

app.post("/game/reset", (_req: Request, res: Response) => {
  console.log("[GameMaster] reset requested");
  resetAll();
  res.status(200).json({ message: "Game Reset" });
});

app.post("/game/stop", (_req: Request, res: Response) => {
  console.log("[GameMaster] stop requested");
  stopGameLoop();
  io.emit("game:stop");
  res.status(200).json({ message: "Game Stopped" });
});

// Admin: list all players
app.get("/game/players", (_req: Request, res: Response) => {
  try {
    const list = Object.entries(players).map(([id, p]) => ({
      id,
      name: id,
      cash: p.cash,
      holdings: p.holdings,
      pnl: p.pnl,
      totalValue: p.totalValue,
    }));
    res.status(200).json(list);
  } catch (e: any) {
    console.error("[Admin API] /game/players error:", e?.message ?? e);
    res.status(500).json({ error: "failed to get players" });
  }
});

// Player: my info
app.get("/api/player/:id", (req: Request, res: Response) => {
  try {
    const playerId = req.params.id;
    if (!playerId) return res.status(400).json({ error: "player id required" });
    const info = getPlayerInfo(playerId);
    res.status(200).json(info);
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? "failed to get player" });
  }
});

// Player: trade
// TickerId 型ガード
const isValidTicker = (t: any): t is TickerId => TICKERS.includes(t);

app.post("/api/trade", (req: Request, res: Response) => {
  try {
    const { player_id, ticker, side, quantity } = req.body ?? {};

    if (!player_id || !isValidTicker(ticker) || !side || quantity == null) {
      return res.status(400).json({ error: "missing or invalid parameters" });
    }

    const updated = trade(String(player_id), ticker, side, Number(quantity));

    broadcastPlayers();
    res.status(200).json(updated);
  } catch (e: any) {
    console.error("[Trade API] error:", e?.message ?? e);
    res.status(400).json({ error: e?.message ?? "trade failed" });
  }
});

// Initial state for clients
app.get("/api/state", (_req: Request, res: Response) => {
  res.status(200).json(state);
});

// ------------------------------------
// Start server
// ------------------------------------
const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, () => {
  console.log(`>>> Server listening on http://localhost:${PORT} (pid=${process.pid}) <<<`);
});

// Graceful shutdown (Cloud Run sends SIGTERM)
process.on("SIGTERM", () => {
  console.log("[SYS] SIGTERM received. Shutting down gracefully...");
  stopGameLoop();
  server.close(() => {
    console.log("[SYS] HTTP server closed. Bye!");
    process.exit(0);
  });
});

//強化学習用
// ==============================
// RL API
// ==============================

// RL: reset environment
app.post("/api/rl/reset", (_req, res) => {
  try {
    // ゲームを一旦止める
    stopGameLoop();
    resetAll();

    // RL としての初期状態は「全てデフォルト」
    const observation = {
      tick: 0,
      prices: state.prices,
      events: [],
    };

    res.json({ ok: true, observation });
  } catch (e: any) {
    console.error("[RL Reset Error]", e);
    res.status(500).json({ ok: false });
  }
});

// RL: step
app.post("/api/rl/step", (req, res) => {
  try {
    const { ticker, side, qty } = req.body;

    // 価格を1ステップ進める
    updatePrices();

    // プレイヤーIDは固定（"RL_AGENT"）
    const player = trade("RL_AGENT", ticker, side, qty);

    // 学習用 reward（資産増加）
    const reward = player.totalValue - 100_000_000;

    // 次の観測
    const observation = {
      tick: state.prices["BANK"].length - 1,
      prices: state.prices,
      events: state.activeEvents.map(e => e.eventDefinition.id),
    };

    res.json({
      ok: true,
      observation,
      reward,
      done: false
    });
  } catch (e: any) {
    console.error("[RL Step Error]", e);
    res.status(500).json({ ok: false });
  }
});

// RL: get state
app.get("/api/rl/state", (_req, res) => {
  res.json({
    ok: true,
    state,
  });
});
