# rlEnvs.py ----------------------------------------------------
import numpy as np
import gymnasium as gym
import requests
from gymnasium.spaces import Box
from typing import Dict, Any, List, Tuple
from trading_logic import get_action_data_from_allocation, INITIAL_VALUE # 新規追加

API_BASE = "http://localhost:8080/api/rl"

# サーバーの constants.ts から銘柄リストをハードコード
TICKERS = [
    "BANK", "SEMI", "AUTO", "PHARMA", "NITORI",
    "UTIL", "AIR", "GAME", "ENEOS", "GOLD",
    "USDJPY", "NIKKEI"
]
HISTORY_LEN = 10 # 過去10ステップの履歴

class TradingFestEnv(gym.Env):
    """
    連続行動空間（ポートフォリオ配分）に対応した RL 環境。
    """
    metadata = {"render_modes": []}

    def __init__(self, history_len: int = HISTORY_LEN, max_leverage: float = 1.0):
        super().__init__()

        self.tickers = TICKERS
        self.num_tickers = len(self.tickers)
        self.history_len = history_len
        self.max_leverage = max_leverage
        
        # --- 行動空間 (Action Space): 連続値 ---
        # 12銘柄の目標配分比率 [-1.0 (100%ショート), 1.0 (100%ロング)]
        action_dim = self.num_tickers # 12
        self.action_space = Box(
            low=-self.max_leverage, 
            high=self.max_leverage, 
            shape=(action_dim,), 
            dtype=np.float32
        )

        # --- 観測空間 (Observation Space): 連続値 ---
        # 1. 価格履歴 (12 * 10 = 120)
        # 2. イベント効果 (12 * 10 = 120)
        # 3. 自己状態 (14) = 現在保有比率(12) + 現金比率(1) + レバレッジ(1)
        obs_dim = (self.num_tickers * self.history_len * 2) + (self.num_tickers + 2) # 120 + 120 + 14 = 254
        
        self.observation_space = Box(
            low=-np.inf, high=np.inf,
            shape=(obs_dim,), dtype=np.float32
        )
        self.state_history: Dict[str, List[Any]] = self._init_state_history()
        self.prev_total_value = INITIAL_VALUE
        self.tick = 0
        
    def _init_state_history(self) -> Dict[str, List[Any]]:
        """観測履歴を初期化（価格とイベント効果）"""
        # prices: {TICKER: [P_t-9, ..., P_t]}
        # events: {TICKER: [E_t-9, ..., E_t]}
        return {
            'prices': {t: [1.0] * self.history_len for t in self.tickers},
            'events': {t: [0.0] * self.history_len for t in self.tickers}
        }
        
    # ----------------------------------------------------
    #  観測のベクトル化（価格履歴254次元）
    # ----------------------------------------------------
    def _obs_from_state(self, server_state: Dict[str, Any], player_state: Dict[str, Any]) -> np.ndarray:
        """
        サーバー状態とプレイヤー状態から254次元の観測ベクトルを生成する。
        """
        obs_vec = []
        
        # 1. 価格・イベント履歴 (240次元)
        latest_prices = server_state.get('prices', {})
        latest_events = server_state.get('activeEvents', []) # 'activeEvents'から当期の効果を取得
        
        # 当期のイベント効果を計算 (サーバー側ロジックがないため、ここでは単純化)
        current_event_effects: Dict[str, float] = {t: 0.0 for t in self.tickers}
        # ★ 実際のサーバー側ロジックに基づき、イベント効果を推測・計算して current_event_effects に格納する必要があります。
        #    ここでは、イベントが発生した銘柄の効果を単純に 1.0/0.0 とします。
        
        impacted_tickers = set()
        for event in latest_events:
             if event.get('eventDefinition'):
                 for effect in event['eventDefinition']['tickers']:
                     impacted_tickers.add(effect['ticker'])

        for t in self.tickers:
             # 価格履歴の更新と正規化
             p_list = latest_prices.get(t, [])
             if not p_list:
                 norm_price = 1.0
             else:
                 current_price = p_list[-1]
                 # 価格は最新価格で正規化
                 normalized_prices = [(p / current_price) if current_price else 1.0 for p in p_list[-self.history_len:]]
                 
                 # 履歴を10個にパディングまたはクリップ
                 padded_prices = normalized_prices + [1.0] * (self.history_len - len(normalized_prices))
                 self.state_history['prices'][t].append(padded_prices[-1])
                 self.state_history['prices'][t] = self.state_history['prices'][t][-self.history_len:]

                 obs_vec.extend(self.state_history['prices'][t]) # 10次元

             # イベント履歴の更新
             current_effect = 1.0 if t in impacted_tickers else 0.0
             self.state_history['events'][t].append(current_effect)
             self.state_history['events'][t] = self.state_history['events'][t][-self.history_len:]
             
             obs_vec.extend(self.state_history['events'][t]) # 10次元
        
        # 2. 自己状態 (14次元)
        current_total_value = player_state.get('totalValue', INITIAL_VALUE)
        holdings = player_state.get('holdings', {})
        
        current_allocations = []
        total_abs_allocation = 0.0
        
        for t in self.tickers:
            h = holdings.get(t, {'qty': 0, 'avgPrice': 0})
            latest_price = latest_prices.get(t, [0])[-1]
            position_value = h.get('qty', 0) * latest_price
            
            # 総資産に対する現在の配分比率
            alloc = position_value / current_total_value if current_total_value else 0.0
            current_allocations.append(alloc) # 12次元
            total_abs_allocation += abs(alloc)
            
        obs_vec.extend(current_allocations) 
        
        # 現金比率 = 1 - (全ポジションの絶対値の合計 / 総資産)
        cash_ratio = (player_state.get('cash', 0) / current_total_value) if current_total_value else 0.0
        
        # レバレッジ = 全ポジションの絶対値の合計 / 総資産
        leverage = total_abs_allocation
        
        obs_vec.append(cash_ratio) # 1次元
        obs_vec.append(leverage)   # 1次元
        
        return np.array(obs_vec, dtype=np.float32)

    # ----------------------------------------------------
    #  RESET (オーバーライド)
    # ----------------------------------------------------
    def reset(self, seed=None, options=None):
        r = requests.post(f"{API_BASE}/reset").json()
        self.tick = 0
        self.prev_total_value = INITIAL_VALUE
        self.state_history = self._init_state_history()
        
        server_state = r.get("observation", {})
        player_info = requests.get(f"{API_BASE}/info").json() # プレイヤー情報を別途取得
        player_state = player_info.get("player", {})
        
        obs = self._obs_from_state(server_state, player_state)
        
        info = {"api_response": r}
        return obs, info

    # ----------------------------------------------------
    #  STEP (オーバーライド)
    # ----------------------------------------------------
    def step(self, action: np.ndarray):
        # 1. 現在の状態を取得
        player_info = requests.get(f"{API_BASE}/info").json()
        current_player_state = player_info.get("player", {})
        
        # 2. 目標配分（action）から取引リストを生成
        trades_list = get_action_data_from_allocation(
            action, 
            current_player_state,
            self.tickers
        )
        
        # 3. サーバーAPIを実行 (1ステップにつき1つの取引のみ実行を想定)
        r = {'reward': 0.0, 'done': False, 'observation': {}}
        
        if trades_list:
            # 取引リクエストを送信
            trade = trades_list[0]
            r = requests.post(f"{API_BASE}/step", json=trade).json()
        else:
            # HOLD（取引なし）として /step を叩く
            r = requests.post(f"{API_BASE}/step").json()
            
        # 4. サーバーからのレスポンス処理
        api_reward = r.get("reward", 0.0)
        done = r.get("done", False)
        
        # 5. 最新の全状態とプレイヤー情報を再取得
        server_state = r.get("observation", {})
        player_info_after = requests.get(f"{API_BASE}/info").json()
        player_state_after = player_info_after.get("player", {})

        # 6. 報酬計算 (ここではシンプルにAPIリターンのみ。train.pyでシェイプする)
        reward = api_reward
        
        # 7. 観測生成
        obs = self._obs_from_state(server_state, player_state_after)
        
        self.prev_total_value = player_state_after.get('totalValue', INITIAL_VALUE)
        self.tick += 1
        
        info = {"api_response": r}
        return obs, reward, done, False, info 

# ----------------------------------------------------