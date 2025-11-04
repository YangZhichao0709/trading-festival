import React from 'react';

// ---------------------------------
// 共通設定
// ---------------------------------

// 背景画像へのパス（UserNameModal.jsx と同じパスを想定）
const BACKGROUND_IMAGE_URL = '/images/trading-bg.jpg'; 

// ---------------------------------
// 2. 待機室 (WaitingRoom)
// ---------------------------------

type WaitingRoomProps = {
  playerName: string;
};

export function WaitingRoom({ playerName }: WaitingRoomProps) {
  // 背景画像スタイル
  const backgroundStyle: React.CSSProperties = {
    backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Inter", sans-serif',
  };

  // コンテンツエリアのスタイル
  const contentStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    width: '90%',
    maxWidth: '600px',
  };

  return (
    <div style={backgroundStyle}>
      {/* CSSアニメーション用のstyleタグ（Reactではこのように埋め込めます） */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={contentStyle}>
        <h1 style={{ fontSize: '2.2rem', color: '#1a202c', marginBottom: '1rem' }}>
          ようこそ、<span style={{ color: '#4299e1' }}>{playerName}</span> さん
        </h1>
        <p style={{ color: '#4a5568', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          ゲームマスターがゲームを開始するまで、もうしばらくお待ちください...
        </p>
        
        {/* ローディングスピナー */}
        <div style={{ margin: '20px 0' }}>
          <div
            style={{
              display: 'inline-block',
              border: '4px solid rgba(0, 0, 0, 0.1)',
              borderLeftColor: '#4299e1',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
        </div>

        <p style={{ color: '#2f855a', fontWeight: 'bold' }}>
          (この画面が表示されていれば、サーバーとの接続は正常です)
        </p>
      </div>
    </div>
  );
}
