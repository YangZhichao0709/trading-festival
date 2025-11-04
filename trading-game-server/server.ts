import express, { Request, Response } from "express";
import * as http from "http";
import { Server } from "socket.io";
import cors from "cors";

// --- ★ リファクタリング: Core game logic ---
import { state, updatePrices } from "./src/core/events";
import { trade, getPlayerInfo, players } from "./src/core/trading";
// ★ リファクタリング: TICKERS, TickerId をインポート
import { INIT_PRICE, TICKERS, TickerId } from "./src/core/constants";

type GameState = typeof state;

// ------------------------------------
// ★ リファクタリング: CORS設定
// ------------------------------------
const allowedOrigins = [
  'https://trading-festival.web.app', // ★ あなたの本番フロントエンドURL
  'http://localhost:5173'             // ローカルテスト用
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
app.use(cors(corsOptions)); // ★ 修正: corsOptions を適用
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: allowedOrigins, // ★ 修正: Socket.IOにも適用
    methods: ['GET', 'POST'],
  } 
});

// ------------------------------------
// Socket.IO
// ------------------------------------
io.on("connection", (socket) => {
  console.log(`[Socket.IO] connected: ${socket.id}`);
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
// Game loop control
// ------------------------------------
let gameInterval: NodeJS.Timeout | null = null;

function startGameLoop(tickMs = 3000) {
  if (gameInterval) {
    console.log("[Game] Loop already running. Skip starting.");
    return;
  }
  console.log("[Game] Starting game loop.");
  state.running = true;

  gameInterval = setInterval(() => {
    try {
      updatePrices();
      broadcastTick();

      if ((state as GameState).popup) {
        const p = (state as GameState).popup;
        console.log(`[Game] News popup: ${p?.name ?? "(no name)"}`);
        io.emit("game:news", p);
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

// ------------------------------------
// ★ リファクタリング: Reset helpers
// ------------------------------------
function resetPlayers() {
  console.log("[Reset] Clearing players.");
  for (const k of Object.keys(players)) delete players[k];
}

function resetState() {
  console.log("[Reset] Resetting all state with INIT_PRICE.");

  // ★ リファクタリング: TICKER_ORDER -> TICKERS
  state.prices = Object.fromEntries(
    TICKERS.map(t => [t, [INIT_PRICE[t]]])
  ) as Record<TickerId, number[]>; // ★ 型アサーション

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

// ★ リファクタリング: Player: trade
// ------------------------------------
// TickerId 型ガード
const isValidTicker = (t: any): t is TickerId => TICKERS.includes(t);

app.post("/api/trade", (req: Request, res: Response) => {
  try {
    const { player_id, ticker, side, quantity } = req.body ?? {};
    
    // ★ 修正: ticker が TickerId であることを検証
    if (!player_id || !isValidTicker(ticker) || !side || quantity == null) {
      return res.status(400).json({ error: "missing or invalid parameters" });
    }
    
    // ★ 修正: trade 関数は TickerId を受け取る
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

