# reports/generate_report.py
import io
import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib import colors


def generate_player_report(username, equity_curve, stats, volume_by_ticker, output_path: str):
    # --- グラフ作成 ---
    fig, ax = plt.subplots(figsize=(6, 2))
    ax.plot(equity_curve)
    ax.set_title("Equity Curve")
    ax.set_xlabel("Step")
    ax.set_ylabel("Asset (JPY)")

    img_buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(img_buf, format="png", dpi=200)
    img_buf.seek(0)
    plt.close(fig)

    # --- PDF 本体 ---
    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(A4),
        topMargin=1 * cm,
        bottomMargin=1 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ロゴ + タイトル
    logo_path = Path(__file__).parent / "template" / "todai_logo.png"
    if logo_path.exists():
        story.append(Image(str(logo_path), width=3 * cm, height=3 * cm))

    story.append(Paragraph("<b>東大トレード研究会</b>", styles["Title"]))
    story.append(Spacer(1, 0.3 * cm))

    # ユーザー名
    story.append(Paragraph(f"<b>{username} 殿</b>", styles["Heading2"]))
    story.append(Spacer(1, 0.5 * cm))

    # 指標テーブル
    stats_table = [
        ["項目", "値"],
        ["総合リターン", f"{stats['return_pct']:.2f}% （{stats['return_jpy']:,} 円）"],
        ["勝率", f"{stats['win_rate']:.2f}%"],
        ["最大ドローダウン", f"{stats['max_dd']:.2f}%"],
    ]

    tbl = Table(stats_table, colWidths=[4 * cm, 10 * cm])
    tbl.setStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    )
    story.append(tbl)
    story.append(Spacer(1, 0.7 * cm))

    # 出来高テーブル
    vol_sorted = sorted(volume_by_ticker.items(), key=lambda x: -x[1])
    vol_table = [["ティッカー", "金額出来高"]]
    for t, v in vol_sorted:
        vol_table.append([t, f"{v:,} 円"])

    vol_tbl = Table(vol_table, colWidths=[5 * cm, 6 * cm])
    vol_tbl.setStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]
    )
    story.append(Paragraph("<b>取引出来高（ショート含む）</b>", styles["Heading3"]))
    story.append(vol_tbl)
    story.append(Spacer(1, 0.7 * cm))

    # 資産推移グラフ
    story.append(Paragraph("<b>資産推移グラフ</b>", styles["Heading3"]))
    story.append(Image(img_buf, width=18 * cm, height=6 * cm))
    story.append(Spacer(1, 0.5 * cm))

    # 指標の簡単解説
    explanation = """
    <b>リターン:</b> 初期資金1億円に対してどれだけ増減したか。<br/>
    <b>勝率:</b> トレードのうち何％が利益になったか。<br/>
    <b>最大ドローダウン:</b> 資産のピークから何％下落したか。リスク指標。<br/>
    <b>出来高:</b> 注文金額の合計（ショートも絶対値で加算）。流動性への貢献度。<br/>
    """
    story.append(Paragraph(explanation, styles["Normal"]))

    doc.build(story)


def main():
    """
    使い方:
      python reports/generate_report.py input.json output.pdf
    input.json のフォーマット:
    {
      "username": "...",
      "equity_curve": [100000000, ...],
      "stats": {...},
      "volume_by_ticker": {...}
    }
    """
    if len(sys.argv) != 3:
        print("Usage: python generate_report.py input.json output.pdf")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    with input_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    generate_player_report(
        username=data["username"],
        equity_curve=data["equity_curve"],
        stats=data["stats"],
        volume_by_ticker=data["volume_by_ticker"],
        output_path=str(output_path),
    )


if __name__ == "__main__":
    main()
