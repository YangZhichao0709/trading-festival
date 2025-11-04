import React, { useState } from 'react';

// ---------------------------------
// 共通設定
// ---------------------------------

// 背景画像へのパス（public/images/trading-bg.jpg に配置した場合）
// アップロードされた 'エクセル_株価チャート01.jpg' を
// 'trading-bg.jpg' のような英数字の名前に変更して public/images に配置することを推奨します。
const BACKGROUND_IMAGE_URL = '/images/trading-bg.jpg'; 

// ---------------------------------
// 1. ユーザー名入力画面 (UserNameModal)
// ---------------------------------

type UserNameModalProps = {
  onConfirm: (name: string) => void;
};

export function UserNameModal({ onConfirm }: UserNameModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onConfirm(trimmedName);
    } else {
      // alert() の代わりにエラーメッセージを表示
      setError('ユーザー名を入力してください。');
    }
  };

  // 背景画像スタイル
  const backgroundStyle: React.CSSProperties = {
    backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Inter", sans-serif', // モダンなフォントを指定
  };

  // コンテンツエリアのスタイル（半透明の背景で読みやすくする）
  const contentStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 少し透明度を下げて読みやすく
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    width: '90%',
    maxWidth: '500px',
  };

  return (
    <div style={backgroundStyle}>
      <div style={contentStyle}>
        <h1 style={{ fontSize: '2rem', color: '#1a202c', marginBottom: '1rem' }}>
          トレーディングゲームへようこそ
        </h1>
        <p style={{ color: '#4a5568', marginBottom: '1.5rem' }}>
          ゲームマスターの開始をお待ちください...
        </p>
        <div style={{ display: 'flex', marginBottom: '0.5rem' }}> {/* エラーメッセージ用にマージン調整 */}
          <input
            type="text"
            placeholder="ユーザー名を入力"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(''); // 入力開始したらエラーを消す
            }}
            style={{
              padding: '12px',
              marginRight: '8px',
              flexGrow: 1,
              borderRadius: '8px',
              border: `1px solid ${error ? '#e53e3e' : '#cbd5e0'}`, // エラー時赤枠
              fontSize: '1rem',
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
          />
          <button
            onClick={handleConfirm}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4299e1', // Tailwind Blue 500
              color: 'white',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            決定
          </button>
        </div>
        {/* エラーメッセージ表示エリア */}
        {error && <p style={{ color: '#e53e3e', fontSize: '0.9rem', textAlign: 'left', margin: '0 0 1rem 0' }}>{error}</p>}
        <p style={{ color: '#718096', fontSize: '0.9rem' }}>(現在は待機画面です)</p>
      </div>
    </div>
  );
}
