import sys
import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import matplotlib.ticker as mticker
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
import io
import os
import tempfile
from datetime import datetime

# ▼▼▼ 文字化け対策 (Windows用) ▼▼▼
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# --- 設定 ---
INITIAL_BALANCE = 100_000_000
PAGE_WIDTH, PAGE_HEIGHT = A4
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# パス設定
FONT_PATH = os.path.join(BASE_DIR, 'fonts', 'NotoSansJP-VariableFont_wght.ttf')
LOGO_PATH = os.path.join(BASE_DIR, 'komabasai_logo.png')

# --- 色定義 (Goldman Sachs Style) ---
COLOR_NAVY = colors.HexColor("#1E3350")     # GS Navy
COLOR_GS_BLUE = colors.HexColor("#7399C6")  # GS Light Blue (グラフ線など)
COLOR_GRAY_BG = colors.HexColor("#F6F7F8")  # 背景
COLOR_TEXT = colors.HexColor("#262626")     # 濃いグレー
COLOR_RED = colors.HexColor("#D32F2F")
COLOR_GREEN = colors.HexColor("#2E7D32")

# 銘柄対応表
TICKER_DISPLAY_NAME = {
    "BANK": "三井住友銀行",
    "SEMI": "東亰エレクトロン",
    "AUTO": "トヨタ自動車",
    "PHARMA": "武田製薬",
    "NITORI": "ニトリ",
    "UTIL": "関西電力",
    "AIR": "ANA",
    "GAME": "任天堂",
    "ENEOS": "ENEOS",
    "GOLD": "ゴールド",
    "USDJPY": "為替(USD/JPY)",
    "NIKKEI": "日経平均",
}

# --- フォント設定 ---
try:
    pdfmetrics.registerFont(TTFont('JPFont', FONT_PATH))
    FONT_NAME = 'JPFont'
    FONT_BOLD = 'JPFont' 
except Exception as e:
    sys.stderr.write(f"Font Loading Error: {e}\n")
    FONT_NAME = 'Helvetica'
    FONT_BOLD = 'Helvetica-Bold'

try:
    font_prop = fm.FontProperties(fname=FONT_PATH)
    plt.rcParams['font.family'] = font_prop.get_name()
except:
    pass

# --- 指標計算 ---
def calculate_metrics(user_history):
    df = pd.DataFrame(user_history)
    df['timestamp'] = pd.to_datetime(df['timestamp'], format='mixed', utc=True)
    df = df.sort_values('timestamp')

    if df.empty:
        return {"profit": 0, "return_pct": 0, "max_drawdown": 0, "sharpe": 0, "win_rate": 0, "trade_count": 0, "volumes": {}, "history_df": df, "graph_df": df}

    final_asset = df.iloc[-1]['total_asset']
    profit = final_asset - INITIAL_BALANCE
    return_pct = (profit / INITIAL_BALANCE) * 100

    trade_df = df[df['type'] == 'trade'].copy()
    trade_count = len(trade_df)
    closed_trades = trade_df[trade_df['pnl'] != 0]
    if len(closed_trades) > 0:
        win_rate = (len(closed_trades[closed_trades['pnl'] > 0]) / len(closed_trades)) * 100
    else:
        win_rate = 0.0

    if not trade_df.empty and {'price', 'quantity', 'ticker'}.issubset(trade_df.columns):
        trade_df['volume_amt'] = trade_df['price'] * trade_df['quantity'].abs()
        volume_by_ticker = trade_df.groupby('ticker')['volume_amt'].sum().to_dict()
    else:
        volume_by_ticker = {}

    asset_series = df['total_asset']
    rolling_max = asset_series.cummax()
    max_drawdown = ((asset_series - rolling_max) / rolling_max).min() * 100
    returns = asset_series.pct_change().dropna()
    sharpe = (returns.mean() / returns.std()) if (len(returns) > 1 and returns.std() != 0) else 0.0

    graph_df = df[df['timestamp'] >= pd.Timestamp("2026-01-01", tz="UTC")]
    if graph_df.empty: graph_df = df

    return {
        "profit": profit, "return_pct": return_pct, "max_drawdown": max_drawdown,
        "sharpe": sharpe, "win_rate": win_rate, "volumes": volume_by_ticker,
        "trade_count": trade_count, "history_df": df, "graph_df": graph_df
    }

def calculate_market_metrics(market_data):
    nikkei_data = market_data.get('nikkei', [])
    if not nikkei_data: return {"return_pct": 0.0, "sharpe": 0.0}
    df = pd.DataFrame(nikkei_data)
    start_price = df.iloc[0]['price']
    end_price = df.iloc[-1]['price']
    return_pct = ((end_price - start_price) / start_price) * 100
    returns = df['price'].pct_change().dropna()
    sharpe = (returns.mean() / returns.std()) if (len(returns) > 1 and returns.std() != 0) else 0.0
    return {"return_pct": return_pct, "sharpe": sharpe}

# --- 描画 ---
def create_indexed_graph(df):
    if df.empty: return None
    plt.figure(figsize=(8, 2.8))
    plt.rcParams['axes.facecolor'] = '#F6F7F8' # GS Gray Background
    ax = plt.gca()
    indexed_asset = (df['total_asset'] / INITIAL_BALANCE) * 100
    
    # GS Blue Line
    ax.plot(df['timestamp'], indexed_asset, color='#7399C6', linewidth=2, label='Your Asset')
    ax.axhline(y=100, color='#e53e3e', linestyle='--', alpha=0.5, linewidth=1, label='Base (100)')
    ax.yaxis.set_major_formatter(mticker.FormatStrFormatter('%.0f'))
    plt.gcf().autofmt_xdate()
    plt.title('Asset History (Index: 100M JPY = 100)', fontproperties=font_prop, color='#1E3350', fontsize=10)
    plt.grid(True, linestyle='-', alpha=0.5, color='#d1d5db')
    plt.legend(loc='upper left', prop=font_prop, fontsize=8)
    plt.tight_layout()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, facecolor='#F6F7F8')
    buf.seek(0)
    plt.close()
    return buf

def draw_header(c):
    c.setFillColor(COLOR_NAVY)
    c.rect(0, PAGE_HEIGHT - 80, PAGE_WIDTH, 80, fill=1, stroke=0)
    if os.path.exists(LOGO_PATH):
        try:
            img = ImageReader(LOGO_PATH)
            iw, ih = img.getSize()
            aspect = iw / ih
            display_h = 60
            display_w = display_h * aspect
            c.drawImage(img, PAGE_WIDTH - display_w - 20, PAGE_HEIGHT - 70, width=display_w, height=display_h, mask='auto')
        except: pass
    c.setFillColor(colors.white)
    c.setFont(FONT_BOLD, 22)
    c.drawString(40, PAGE_HEIGHT - 45, "Trading Performance Report")
    c.setFont(FONT_NAME, 12)
    c.drawString(40, PAGE_HEIGHT - 65, "東京大学トレード研究会 - 2025年度駒場祭")

def draw_stat_item(c, x, y, label, value, color=COLOR_TEXT, is_market=False):
    c.setFont(FONT_NAME, 9)
    c.setFillColor(colors.gray)
    c.drawString(x, y, label)
    val_y = y - 15
    c.setFont(FONT_BOLD, 14)
    c.setFillColor(color)
    c.drawString(x, val_y, value)
    if is_market:
        c.setFillColor(COLOR_NAVY)
        c.rect(x - 8, y, 4, 8, fill=1, stroke=0)

def draw_left_column(c, x, y, width, volumes):
    """左側: 出来高テーブル(全銘柄) + 銘柄対応表"""
    
    # --- 1. 出来高テーブル ---
    c.setFillColor(COLOR_NAVY)
    c.setFont(FONT_BOLD, 10)
    c.drawString(x, y, "■ 銘柄別取引データ (Volume)")
    
    y_table = y - 20
    c.setFillColor(COLOR_GRAY_BG)
    c.rect(x, y_table - 12, width, 16, fill=1, stroke=0)
    c.setFillColor(COLOR_TEXT)
    c.setFont(FONT_BOLD, 8)
    c.drawString(x + 5, y_table - 8, "Ticker")
    c.drawRightString(x + width - 5, y_table - 8, "Volume (JPY)")
    
    y_table -= 25
    sorted_vols = sorted(volumes.items(), key=lambda x: x[1], reverse=True)
    
    # ★修正1: 制限を12銘柄（全銘柄）に拡大
    limit = 12 
    
    if not sorted_vols:
        c.setFont(FONT_NAME, 8)
        c.drawString(x + 5, y_table, "No Data")
        y_table -= 15
    else:
        for i, (ticker, vol) in enumerate(sorted_vols):
            if i >= limit: break
            c.setFont(FONT_NAME, 8)
            c.drawString(x + 5, y_table, ticker)
            c.drawRightString(x + width - 5, y_table, f"¥ {vol:,.0f}")
            c.setStrokeColor(colors.lightgrey)
            c.line(x, y_table - 3, x + width, y_table - 3)
            
            # ★修正2: 行間を少し詰める (15 -> 13)
            y_table -= 13 

    # --- 2. 銘柄対応表 ---
    # ★修正3: テーブルの終わった位置(y_table)を基準に開始位置を決める
    y_legend = y_table - 20 
    
    c.setFillColor(COLOR_NAVY)
    c.setFont(FONT_BOLD, 9)
    c.drawString(x, y_legend, "■ 銘柄コード一覧")
    
    y_legend -= 15
    c.setFillColor(COLOR_TEXT)
    
    row_count = 0
    for ticker, name in TICKER_DISPLAY_NAME.items():
        col_offset = 0 if row_count % 2 == 0 else width / 2 + 5
        # 行間も少し詰める (10 -> 9)
        draw_y = y_legend - (row_count // 2) * 9 
        
        c.setFont(FONT_BOLD, 7)
        c.drawString(x + col_offset, draw_y, f"{ticker}:")
        c.setFont(FONT_NAME, 7)
        # 名称が長い場合に備えて少し右にずらす
        c.drawString(x + col_offset + 30, draw_y, name)
        
        row_count += 1

def draw_right_column(c, x, y):
    """右側: 用語解説 (サイズ戻し) + コラム"""
    
    # --- 1. 用語解説 (文字サイズ9ptに戻す) ---
    c.setFillColor(COLOR_NAVY)
    c.setFont(FONT_BOLD, 11)
    c.drawString(x, y, "■ 指標の解説 (Glossary)")
    c.setFillColor(COLOR_TEXT)
    start_y = y - 20
    
    # (項目名, 説明文リスト)
    glossary_items = [
        ("Sharpe Ratio", [
            "(リターン - 無リスク金利) ÷ リスクで計算される値。",
            "リスクに対するリターンの効率性を表し、値が高いほど、",
            "少ないリスクで高い利益を上げたことを示します。",
        ]),
        ("Return", ["初期資産(1億円)に対する利益率。"]),
        ("Win Rate", ["利益が出たトレードの割合。"]),
        ("Max DD", ["資産がピーク時から最大で何％下落したか。"]),
    ]
    
    for title, lines in glossary_items:
        c.setFont(FONT_BOLD, 9)
        c.drawString(x, start_y, f"・{title}")
        start_y -= 14 # タイトル下の間隔を広げる
        
        c.setFont(FONT_NAME, 9) # ★文字サイズを8→9に戻す
        c.setFillColor(colors.gray)
        for line in lines:
            c.drawString(x + 10, start_y, line)
            start_y -= 12 # ★行間を10→14に戻す
        
        c.setFillColor(COLOR_TEXT)
        start_y -= 2 # 項目間の隙間
        
    # --- 2. コラム ---
    col_y = start_y - 20
    c.setFillColor(COLOR_NAVY)
    c.setFont(FONT_BOLD, 11)
    c.drawString(x, col_y, "■ 市場平均に勝つ難しさ")
    
    col_y -= 20
    c.setFillColor(COLOR_TEXT)
    c.setFont(FONT_NAME, 9) # ★コラムも9ptに戻す
    
    column_text = [
        "「アクティブ運用はインデックス(市場平均)に",
        "勝てない」という有名な経験則があります。",
        "プロの機関投資家でさえ、日経平均などの",
        "指数を一貫して上回ることは困難です。",
        "",
        "指数を上回る利益「アルファ(α)」こそが",
        "トレーダーの実力の証です。あなたの成績は、",
        "日経平均を超えられましたか？"
    ]
    
    for line in column_text:
        c.drawString(x, col_y, line)
        col_y -= 12 # ★行間を10→14に戻す

def draw_footer(c):
    c.setFillColor(COLOR_NAVY)
    c.setFont(FONT_BOLD, 10)
    c.drawRightString(PAGE_WIDTH - 40, 30, "Thank you for playing!")
    c.setFont(FONT_NAME, 8)
    c.drawRightString(PAGE_WIDTH - 40, 18, "東京大学トレード研究会 - 第76回駒場祭")

def generate_pdf(input_data):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        output_filename = tmp.name

    c = canvas.Canvas(output_filename, pagesize=A4)
    players = input_data.get('players', [])
    market_data = input_data.get('market', {})
    m_metrics = calculate_market_metrics(market_data)

    for user in players:
        metrics = calculate_metrics(user['history'])
        
        draw_header(c)
        c.setFillColor(COLOR_TEXT)
        c.setFont(FONT_BOLD, 18) 
        c.drawString(40, PAGE_HEIGHT - 110, f"{user['name']} 様")
        
        c.setFont(FONT_NAME, 9)
        c.setFillColor(colors.gray)
        date_str = datetime.now().strftime("%Y/%m/%d %H:%M")
        c.drawRightString(PAGE_WIDTH - 40, PAGE_HEIGHT - 110, f"Generated: {date_str}")
        
        y_stats_1 = PAGE_HEIGHT - 160
        p_color = COLOR_GREEN if metrics['profit'] >= 0 else COLOR_RED
        draw_stat_item(c, 40, y_stats_1, "Total Profit", f"¥ {metrics['profit']:,.0f}", p_color)
        draw_stat_item(c, 180, y_stats_1, "Return", f"{metrics['return_pct']:+.2f}%", p_color)
        draw_stat_item(c, 290, y_stats_1, "Win Rate", f"{metrics['win_rate']:.1f}%")
        draw_stat_item(c, 380, y_stats_1, "Sharpe", f"{metrics['sharpe']:.2f}")
        draw_stat_item(c, 470, y_stats_1, "Trades", f"{metrics['trade_count']}回")

        y_stats_2 = y_stats_1 - 45
        m_color = COLOR_GREEN if m_metrics['return_pct'] >= 0 else COLOR_RED
        draw_stat_item(c, 40, y_stats_2, "N225 Return", f"{m_metrics['return_pct']:+.2f}%", m_color, is_market=True)
        draw_stat_item(c, 180, y_stats_2, "N225 Sharpe", f"{m_metrics['sharpe']:.2f}", COLOR_TEXT, is_market=True)

        y_graph = y_stats_2 - 30
        graph_buf = create_indexed_graph(metrics['graph_df'])
        if graph_buf:
            img = ImageReader(graph_buf)
            c.drawImage(img, 30, y_graph - 190, width=535, height=190)
            c.setFont(FONT_NAME, 8)
            c.setFillColor(colors.gray)
            c.drawCentredString(PAGE_WIDTH/2, y_graph - 200, "※ 縦軸は初期資産1億円を100とした指数表示です。")

        y_split_top = y_graph - 240
        col_width = (PAGE_WIDTH - 80 - 40) / 2
        
        draw_left_column(c, 40, y_split_top, col_width, metrics['volumes'])
        draw_right_column(c, 40 + col_width + 40, y_split_top)
        
        draw_footer(c)
        c.showPage()

    c.save()
    print(output_filename)

if __name__ == "__main__":
    try:
        input_str = sys.stdin.read()
        if not input_str: sys.exit(1)
        data = json.loads(input_str)
        generate_pdf(data)
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)