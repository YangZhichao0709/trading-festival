import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import App from './App.tsx'               // プレイヤー画面
import { GameMasterAdmin } from './GameMasterAdmin.tsx'; // 管理画面
import TradingBotPage from './tradingbot.tsx'; // AI画面！！


// ルート(URL)の定義
const router = createBrowserRouter([
  {
    path: "/",               // 通常のプレイヤー用
    element: <App />,
  },
  {
    path: "/admin",          // ゲームマスター用
    element: <GameMasterAdmin />,
  },
  {
    path: "/tradingbot",     // AIトレーダー用
    element: <TradingBotPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
