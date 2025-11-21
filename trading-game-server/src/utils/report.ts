// src/utils/report.ts
import { execFile } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

type Stats = {
  return_pct: number;
  return_jpy: number;
  win_rate: number;
  max_dd: number;
};

type ReportInput = {
  username: string;
  equity_curve: number[];
  stats: Stats;
  volume_by_ticker: Record<string, number>;
};

export async function generateReportPdf(data: ReportInput): Promise<Buffer> {
  // 一時ファイルパス
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "trading-report-"));
  const inputPath = path.join(tmpDir, "input.json");
  const outputPath = path.join(tmpDir, "output.pdf");

  await fs.writeFile(inputPath, JSON.stringify(data), "utf-8");

  // Python 実行
  await new Promise<void>((resolve, reject) => {
    const py = execFile(
      "python", // or "python3" 環境に合わせて
      ["reports/generate_report.py", inputPath, outputPath],
      { cwd: process.cwd() },
      (error) => {
        if (error) return reject(error);
        resolve();
      }
    );
  });

  const pdfBuffer = await fs.readFile(outputPath);
  return pdfBuffer;
}
