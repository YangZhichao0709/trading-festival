# train.py ----------------------------------------------------
import numpy as np
from stable_baselines3 import SAC
from stable_baselines3.common.vec_env import DummyVecEnv
from rlEnvs import TradingFestEnv

# --- パラメータ ---
VOL_PENALTY_ALPHA = 0.01 # ボラティリティペナルティ係数を小さく設定
TOTAL_TIMESTEPS = 50_000 # 連続行動は学習に時間がかかるため、タイムステップを増やす


class RewardEnhancedEnv(TradingFestEnv):
    """
    Reward Shaping を行うラッパー。
    """
    def __init__(self, vol_penalty_alpha=VOL_PENALTY_ALPHA, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        self.vol_penalty_alpha = vol_penalty_alpha
        self.prev_total_value = INITIAL_VALUE
        
        # 評価用に、APIからの純粋なリターンを合計する変数
        self.cumulative_api_returns = 0.0 

    def step(self, action: np.ndarray):
        # 1. 親クラスのステップを実行し、生のAPIリターンを取得
        obs, api_reward, done, truncated, info = super().step(action)
        
        # 2. 最新の総資産を取得
        latest_value = info['api_response'].get('totalValue', self.prev_total_value * (1 + api_reward))

        # --- reward shaping ---
        # 3. ボラティリティペナルティの計算
        diff = abs(latest_value - self.prev_total_value)
        # 資産変動の絶対値に基づくペナルティ
        vol_penalty = self.vol_penalty_alpha * diff / INITIAL_VALUE 
        
        # 4. 整形済み報酬
        shaped_reward = api_reward - vol_penalty 
        
        # 5. 状態更新
        self.prev_total_value = latest_value
        self.cumulative_api_returns += api_reward

        return obs, shaped_reward, done, truncated, info

    def reset(self, seed=None, options=None):
        obs, info = super().reset(seed=seed, options=options)
        self.prev_total_value = INITIAL_VALUE
        self.cumulative_api_returns = 0.0 
        return obs, info


# ======================================================
#  SAC TRAINING
# ======================================================

def main():
    print("=== SAC TRAINING START (Continuous Action Space) ===")

    # 連続行動空間では VecNormalize の使用が推奨されますが、ここでは省略しシンプルに保ちます。
    env = DummyVecEnv([lambda: RewardEnhancedEnv()])

    # ★ アルゴリズムを SAC に変更
    model = SAC(
        "MlpPolicy",
        env,
        verbose=1,
        learning_rate=3e-4,
        buffer_size=10000, # SACはオフポリシーのためバッファサイズが必要
        gamma=0.99,
        tau=0.005,
        batch_size=256,
        train_freq=1,
    )

    model.learn(total_timesteps=TOTAL_TIMESTEPS)
    model.save("tradingfest_sac_agent_continuous")

    print("=== TRAINING COMPLETE ===\n")
    # ... (評価フェーズは省略) ...


if __name__ == "__main__":
    main()