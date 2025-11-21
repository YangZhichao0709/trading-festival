// src/routes/adminReport.ts
import express from "express";
import { generateReportPdf } from "../utils/report";

const router = express.Router();

router.get("/report", async (req, res) => {
  try {
    const gameId = req.query.gameId as string;
    const playerId = req.query.playerId as string;

    // ここで gameId, playerId からデータを引いてくる
    // TODO: 実際の実装に合わせて書き換え
    const gameResult = await getGameResultFromYourDB(gameId, playerId);
    // gameResult から equity_curve, stats, volume_by_ticker を組み立てる

    const data = {
      username: gameResult.username,        // "○○"
      equity_curve: gameResult.equityCurve, // number[]
      stats: {
        return_pct: gameResult.returnPct,
        return_jpy: gameResult.returnJpy,
        win_rate: gameResult.winRate,
        max_dd: gameResult.maxDrawdown
      },
      volume_by_ticker: gameResult.volumeByTicker // { [ticker]: number }
    };

    const pdf = await generateReportPdf(data);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report_${playerId}.pdf`
    );
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;
