import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
// react-router-dom から必要なものをインポート
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import App from './App.tsx' // プレイヤー画面
import { GameMasterAdmin } from './GameMasterAdmin.tsx'; // 管理画面

// ルート(URL)の定義
const router = createBrowserRouter([
  {
    path: "/", // プレイヤーがアクセスするURL (ルート)
    element: <App />,
  },
  {
    path: "/admin", // ゲームマスターがアクセスするURL
    element: <GameMasterAdmin />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 以前の <App /> の代わりに、RouterProvider をレンダリング */}
    <RouterProvider router={router} />
  </React.StrictMode>,
)