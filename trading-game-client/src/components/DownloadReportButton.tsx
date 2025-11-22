import { useState } from 'react';
import { API_BASE } from "../apiConfig"; // パスは配置場所に合わせて調整してください

export default function DownloadReportButton() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // サーバーのエンドポイントを叩く (Expressサーバー用)
      const response = await fetch(`${API_BASE}/admin/export-pdf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('ダウンロードに失敗しました');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trading_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      alert('レポート生成中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        padding: "15px 30px",
        fontSize: "1.1rem",
        fontWeight: "bold",
        color: "white",
        backgroundColor: loading ? "#a0aec0" : "#2b6cb0", // 青色
        border: "none",
        borderRadius: "8px",
        cursor: loading ? "not-allowed" : "pointer",
        marginLeft: "10px", // 左のボタンとの隙間
        marginTop: "10px"
      }}
    >
      {loading ? "PDF生成中..." : "📊 成績PDF出力"}
    </button>
  );
}