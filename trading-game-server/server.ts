// server.ts (Complete, Reset-safe, Cloud Run ready)

import express, { Request, Response } from "express";
import * as http from "http";
import { Server } from "socket.io";
import cors from "cors";

// --- Core game logic ---
import { state, updatePrices } from "./src/core/events";
import { trade, getPlayerInfo, players } from "./src/core/trading";
import { INIT_PRICE, TICKER_ORDER } from "./src/core/constants";

// If your events.ts exports more fields later, adjust here.
// We assume: state = { prices: Record<string, number[]>, popup: any, newsLog: any[], running: boolean }
type GameState = typeof state;

// ------------------------------------
// Server bootstrap
// ------------------------------------
const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ------------------------------------
// Socket.IO
// ------------------------------------
io.on("connection", (socket) => {
  console.log(`[Socket.IO] connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] disconnected: ${socket.id}`);
  });
});

// Helper: push players snapshot (useful after trades/reset)
function broadcastPlayers() {
  io.emit("players:update", players);
}

// Helper: push game state/tick
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
      // 1) tick prices
      updatePrices();

      // 2) broadcast state
      broadcastTick();

      // 3) popup/news
      if ((state as GameState).popup) {
        const p = (state as GameState).popup;
        console.log(`[Game] News popup: ${p?.name ?? "(no name)"}`);
        io.emit("game:news", p);
        (state as GameState).popup = null; // consume once
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
// Reset helpers (the core of your issue)
// ------------------------------------
function resetPlayers() {
  console.log("[Reset] Clearing players.");
  for (const k of Object.keys(players)) delete players[k];
}

function resetState() {
  console.log("[Reset] Resetting all state with INIT_PRICE.");

  // すべての銘柄の初期価格を再セット
  state.prices = Object.fromEntries(
    TICKER_ORDER.map(t => [t, [INIT_PRICE[t as keyof typeof INIT_PRICE]]])
  );

  // イベント関連も初期化
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

  // Inform clients
  io.emit("game:reset");
  broadcastPlayers(); // now empty
  broadcastTick();    // now initial state
  console.log("[Reset] Completed.");
}

// ------------------------------------
// REST API
// ------------------------------------

// Health checks
app.get("/", (_req: Request, res: Response) => {
  res
    .status(200)
    .send(
      `<h1>Trading Festival Game Server</h1><p>Socket.IO running. PID=${process.pid}</p>`
    );
});

app.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, running: state.running, players: Object.keys(players).length });
});

// Game start
app.post("/game/start", (_req: Request, res: Response) => {
  console.log("[GameMaster] start requested");
  startGameLoop(3000); // adjust tick if you want
  io.emit("game:start");
  res.status(200).json({ message: "Game Started" });
});

// Game reset (stop loop + clear all)
app.post("/game/reset", (_req: Request, res: Response) => {
  console.log("[GameMaster] reset requested");
  resetAll();
  res.status(200).json({ message: "Game Reset" });
});

// Optional: explicit stop without clearing state
app.post("/game/stop", (_req: Request, res: Response) => {
  console.log("[GameMaster] stop requested");
  stopGameLoop();
  io.emit("game:stop");
  res.status(200).json({ message: "Game Stopped" });
});

// Admin: list all players (snapshot)
app.get("/game/players", (_req: Request, res: Response) => {
  try {
    const list = Object.entries(players).map(([id, p]) => ({
      id,
      name: id, // (MVP) If you later store displayName, swap it here.
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
app.post("/api/trade", (req: Request, res: Response) => {
  try {
    const { player_id, ticker, side, quantity } = req.body ?? {};
    if (!player_id || !ticker || !side || quantity == null) {
      return res.status(400).json({ error: "missing parameters" });
    }
    const updated = trade(String(player_id), String(ticker), side, Number(quantity));
    broadcastPlayers(); // push whole book so admin view updates instantly
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
