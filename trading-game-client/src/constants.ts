// ✅ 1. 内部ID（変わらないキー）
export const TICKERS = [
  "BANK",
  "SEMI",
  "AUTO",
  "PHARMA",
  "NITORI",
  "UTIL",
  "AIR",
  "GAME",
  "ENEOS",
  "GOLD",
  "USDJPY",
  "NIKKEI",
] as const;

export type TickerId = typeof TICKERS[number];

// ✅ 2. 初期価格（IDベース）
export const INIT_PRICE: Record<TickerId, number> = {
  BANK: 2300,
  SEMI: 12000,
  AUTO: 2600,
  PHARMA: 4500,
  NITORI: 5000,
  UTIL: 600,
  AIR: 3200,
  GAME: 6000,
  ENEOS: 1200,
  GOLD: 20000,
  USDJPY: 150,
  NIKKEI: 40000,
};


const randK_Rating = () => Number((Math.random() * 0.08 - 0.04).toFixed(3));
const randK_MOF = () => Number((Math.random() * 0.04 - 0.02).toFixed(3));


//
// 1. イベント定義 (IDの追加と、動的なkの値を関数に変更)
//
export const EVENTS = [
  {
    id: "pandemic_occurs",
    name: "パンデミック発生！",
    description:
      "世界的なパンデミック発生。外出自粛により消費が冷え込む。特に航空業界に甚大な被害。",
    tickers: [
      { ticker: "BANK", a: 2, k: -0.2 },
      { ticker: "AIR", a: 3, k: -0.4 },
      { ticker: "AUTO", a: 2, k: -0.25 },
      { ticker: "PHARMA", a: 2, k: -0.1 },
      { ticker: "NITORI", a: 2, k: -0.1 },
      { ticker: "UTIL", a: 2, k: -0.05 },
      { ticker: "GAME", a: 2, k: -0.05 },
    ],
  },
  {
    id: "ai_boom",
    name: "AIブーム到来！",
    description:
      "新型AIチップの発表を受け、半導体需要が世界的に急増。半導体株に力強い買いが入る",
    tickers: [{ ticker: "SEMI", a: 4, k: 0.15 }],
  },
  {
    id: "historic_yen_weakness",
    name: "歴史的な円安",
    description: "為替が大きく変動。輸出関連企業に強い追い風。",
    tickers: [{ ticker: "USDJPY", a: 3, k: 0.1 }],
  },
  {
    id: "boj_rate_hike_small",
    name: "日銀、金利引き上げ",
    description:
      "金融政策の変更が発表され、銀行株の利ざや改善期待が高まる。",
    tickers: [{ ticker: "BANK", a: 3, k: 0.08 }, { ticker: "USDJPY", a: 3, k: -0.08 }],
  },
  {
    id: "mof_verbal_intervention_1",
    name: "財務大臣『急激な円安は望ましくない』と発言",
    description:
      "財務大臣が為替市場に対し「急激な円安は望ましくない」と牽制する発言を行った。市場では一時的に円買いが入る。",
    tickers: [{ ticker: "USDJPY", a: 1, k: randK_MOF }],
  },
  {
    id: "mof_verbal_intervention_2",
    name: "財務大臣『為替動向を注視している』とコメント",
    description:
      "財務大臣が記者会見で「為替の過度な変動は好ましくない。動向を注視している」と述べた。典型的な“口先介入”と受け止められ、市場への影響はほぼ皆無だった。",
    tickers: [{ ticker: "USDJPY", a: 1, k: randK_MOF }],
  },
  {
    id: "mof_verbal_intervention_3",
    name: "財務大臣『必要なら適切に対応する』と牽制",
    description:
      "急速な円安進行を受け、財務大臣が「必要なら適切に対応する」とコメント。市場参加者は実弾が入る可能性を意識し、円買いのフローが生じる。",
    tickers: [{ ticker: "USDJPY", a: 1, k: randK_MOF }],
  },
  {
    id: "mof_verbal_intervention_4",
    name: "財務大臣『為替はファンダメンタルズを反映すべき』と発言",
    description:
      "財務大臣が「為替は各国のファンダメンタルズを反映するべき」と一般論を述べ、市場では“何も言っていない”との受け止めが大勢。為替の反応はほぼゼロ。",
    tickers: [{ ticker: "USDJPY", a: 1, k: randK_MOF }],
  },
  {
    id: "mof_verbal_intervention_5",
    name: "財務大臣『過度な投機による動きには適切に対応』と牽制",
    description:
      "財務大臣が「投機による過度な為替変動には適切に対応する」と牽制したが、具体策の提示はなく、市場では“いつもの発言”として流されている。",
    tickers: [{ ticker: "USDJPY", a: 1, k: randK_MOF }],
  },
  {
    id: "mof_verbal_intervention_6",
    name: "財務大臣、為替の急変動を『懸念』",
    description:
      "短時間で円安が進んだことに対し、財務大臣が『急変動は懸念している』と発言。投機筋の一部が円買いで反応したが、実需の流れが強くドル円はすぐに元の水準へ戻った。",
    tickers: [{ ticker: "USDJPY", a: 1, k: randK_MOF }],
  },
  {
    id: "inbound_tourism_boom",
    name: "インバウンド絶好調",
    description:
      "訪日観光客数が過去最高を記録。航空株が買われている。",
    tickers: [{ ticker: "AIR", a: 3, k: 0.12 }],
  },
  {
    id: "middle_east_tension",
    name: "中東情勢、悪化",
    description: "地政学的リスクの高まりを受け、原油価格が急騰。",
    tickers: [{ ticker: "ENEOS", a: 2, k: 0.1 }, { ticker: "GOLD", a: 2, k: 0.1 }],
  },
  {
    id: "opec_plus_cuts_extended",
    name: "OPEC+が追加減産を延長",
    description:
      "産油国が減産を延長。ガソリンの元となる原油が上がりやすい。",
    tickers: [{ ticker: "ENEOS", a: 2, k: 0.15 }],
  },
  {
    id: "mof_yen_intervention",
    name: "財務省が円買い介入を実施",
    description:
      "急激な円安を止めるための為替介入。短期的に円高方向に振れやすい。",
    tickers: [{ ticker: "USDJPY", a: 1, k: -0.4 }],
  },
  {
    id: "boj_surprise_rate_hike",
    name: "日銀がサプライズ利上げ",
    description: "金利上昇で利ざや拡大期待。銀行に追い風。",
    tickers: [{ ticker: "BANK", a: 2, k: 0.18 }],
  },
  {
    id: "large_loan_default",
    name: "大口融資先でデフォルト発生",
    description:
      "有名企業の債務不履行が判明。信用コスト上昇懸念し、銀行の収益を押し下げる。",
    tickers: [{ ticker: "BANK", a: 1, k: -0.22 }],
  },
  {
    id: "nintendo_buyback_dividend",
    name: "任天堂、自己株買い・増配を同時発表",
    description:
      "新型ゲーム機の発売により大幅利益増。株主還元強化で評価改善。",
    tickers: [{ ticker: "GAME", a: 2, k: 0.1 }],
  },
  {
    id: "china_export_restrictions_semi",
    name: "対中輸出規制が半導体に拡大",
    description:
      "アメリカが中国に最新半導体の輸出を禁止、需要の先行きに不透明感。",
    tickers: [{ ticker: "SEMI", a: 3, k: -0.22 }],
  },
  {
    id: "generative_ai_demand_semi",
    name: "生成AI需要で設備受注が過去最高",
    description:
      "データセンター向けの投資が急増。高性能半導体が逼迫。",
    tickers: [{ ticker: "SEMI", a: 3, k: 0.2 }],
  },
  {
    id: "semi_inventory_worsens",
    name: "半導体、在庫悪化で一部ラインが出荷停止",
    description: "過剰在庫の調整局面。短期的な業績圧迫。",
    tickers: [{ ticker: "SEMI", a: 2, k: -0.25 }],
  },
  {
    id: "eu_ev_subsidy_cut",
    name: "欧州でEV補助金が縮小",
    description:
      "電気自動車の売上が押し下げられる一方、トヨタのガソリン車の需要が回復。",
    tickers: [{ ticker: "AUTO", a: 3, k: 0.1 }],
  },
  {
    id: "prius_recall_us",
    name: "アメリカにてプリウスに大規模リコールが発生",
    description:
      "安全対策費や信頼低下による車の販売減が懸念される。",
    tickers: [{ ticker: "AUTO", a: 2, k: -0.3 }],
  },
  {
    id: "auto_sales_improve_na",
    name: "北米で新型自動車の販売・利益率ともに改善",
    description:
      "高付加価値モデルがけん引し、収益力が上向く。",
    tickers: [{ ticker: "AUTO", a: 2, k: 0.12 }],
  },
  {
    id: "pharma_phase3_success",
    name: "治験フェーズ3試験が主要評価項目を達成",
    description:
      "大型適応症で統計的有意差を確認。厚生労働省の新薬認可は間近か。",
    tickers: [{ ticker: "PHARMA", a: 3, k: 0.28 }],
  },
  {
    id: "pharma_phase3_failure",
    name: "治験フェーズ3試験が失敗",
    description:
      "安全性・有効性を満たせず、薬の開発計画の見直しへ。",
    tickers: [{ ticker: "PHARMA", a: 2, k: -0.35 }],
  },
  {
    id: "drug_price_revision_negative",
    name: "薬価改定でマイナス幅が拡大",
    description:
      "国が定める薬の価格が想定よりも安く、製薬会社の収益を押し下げる見通し。",
    tickers: [{ ticker: "PHARMA", a: 2, k: -0.15 }],
  },
  {
    id: "new_drug_approval_fast_track",
    name: "画期的新薬の承認審査が加速",
    description:
      "優先審査・条件付き早期承認などで上市が前倒しに。",
    tickers: [{ ticker: "PHARMA", a: 2, k: 0.14 }],
  },
  {
    id: "nitori_overseas_costs",
    name: "ニトリ、海外出店で立ち上げ費用が先行",
    description: "中期では成長加速も、短期利益は圧迫。",
    tickers: [{ ticker: "NITORI", a: 2, k: -0.12 }],
  },
  {
    id: "nitori_same_store_sales_up",
    name: "ニトリ、既存店売上が客数・客単価ともに伸長",
    description:
      "値ごろ感の維持と品揃え強化が奏功。",
    tickers: [{ ticker: "NITORI", a: 2, k: 0.12 }],
  },
  {
    id: "us_jobs_report_strong",
    name: "米雇用統計がサプライズの強さ",
    description:
      "米国金利が上昇するとの見通しから、ドル買いが優勢になりやすく、ドル円は上昇方向へ。",
    tickers: [{ ticker: "USDJPY", a: 1, k: 0.2 }],
  },
  {
    id: "nuclear_plant_restart",
    name: "原発の再稼働が正式決定",
    description:
      "燃料コストや供給安定性の改善期待が高まり、電力会社の株が買われている",
    tickers: [{ ticker: "UTIL", a: 3, k: 0.15 }],
  },
  // --- 決算・業績関連 ---
  {
    id: "earnings_surprise_positive_auto",
    name: "自動車大手、決算で「サプライズ」上方修正",
    description: "円安効果と北米販売の好調により、通期業績予想を大幅に上方修正。市場予想を上回るポジティブサプライズとなった。",
    tickers: [{ ticker: "AUTO", a: 2, k: 0.18 }],
  },
  {
    id: "earnings_shock_negative_semi",
    name: "半導体、決算ミスで「失望売り」",
    description: "期待されていた四半期決算が市場コンセンサスに届かず。スマホ向けの需要回復遅れが嫌気され、失望売りが膨らんでいる。",
    tickers: [{ ticker: "SEMI", a: 2, k: -0.20 }],
  },
  {
    id: "earnings_record_profit_bank",
    name: "メガバンク、決算で最高益を更新",
    description: "金利上昇による貸出金利の改善で、純利益が過去最高を更新。増配もあわせて発表され、買い注文が殺到。",
    tickers: [{ ticker: "BANK", a: 3, k: 0.15 }],
  },
  {
    id: "earnings_downward_revision_nitori",
    name: "ニトリ、業績予想を「下方修正」",
    description: "急激な円安による輸入コスト増が利益を圧迫。通期の営業利益見通しを引き下げ、株価はネガティブに反応。",
    tickers: [{ ticker: "NITORI", a: 2, k: -0.15 }],
  },
  {
    id: "ma_announcement_pharma",
    name: "製薬大手、米バイオ企業を買収発表",
    description: "将来の収益源確保のため、数千億円規模のM&Aを発表。財務負担は懸念されるものの、新薬パイプラインの拡充が好感されている。",
    tickers: [{ ticker: "PHARMA", a: 4, k: 0.12 }],
  },
  {
    id: "scandal_data_leak_util",
    name: "電力会社で顧客情報漏洩が発覚",
    description: "顧客データ数十万件が外部に流出した可能性が報じられた。管理体制への批判が高まり、株価は急落。",
    tickers: [{ ticker: "UTIL", a: 2, k: -0.18 }],
  },
  {
    id: "scandal_inspection_fraud_auto",
    name: "自動車メーカー、検査データ不正が発覚",
    description: "型式指定申請における認証試験での不正行為が発覚。一部車種の出荷停止処分が下され、業績への悪影響が懸念される。",
    tickers: [{ ticker: "AUTO", a: 2, k: -0.30 }], 
  },
  {
    id: "strategic_partnership_game_ai",
    name: "任天堂、AI企業と資本業務提携",
    description: "次世代ゲーム開発へのAI活用を目的に、有力AIスタートアップとの提携を発表。思惑買いが集まる。",
    tickers: [
      { ticker: "GAME", a: 3, k: 0.15 },
      { ticker: "SEMI", a: 2, k: 0.05 }, // AI関連で半導体も連れ高
    ],
  },
  {
    id: "oil_field_discovery",
    name: "ENEOS、新規油田の権益獲得",
    description: "海外の大型プロジェクトで優良な油田権益を獲得したと発表。中長期的なエネルギー供給基盤の強化が好感された。",
    tickers: [{ ticker: "ENEOS", a: 3, k: 0.12 }],
  },
  {
    id: "typhoon_damage_factory",
    name: "大型台風で国内工場が操業停止",
    description: "強力な台風の直撃により、自動車や半導体の主要工場が浸水被害を受け操業停止。サプライチェーン寸断の懸念。",
    tickers: [
      { ticker: "AUTO", a: 2, k: -0.12 },
      { ticker: "SEMI", a: 2, k: -0.10 },
      { ticker: "UTIL", a: 2, k: -0.05 }, // 復旧コスト増
    ],
  },
  {
    id: "earnings_season_eps_up",
    name: "決算シーズンでEPS上方修正が相次ぐ",
    description:
      "企業利益の底上げで指数に幅広い買いが入る。",
    tickers: [{ ticker: "NIKKEI", a: 2, k: 0.12 }],
  },
  {
    id: "airline_slots_expanded",
    name: "国際線の発着枠が拡大",
    description:
      "便数増加と需要回復で搭乗率の改善が見込まれ、航空株の回復が期待される。",
    tickers: [{ ticker: "AIR", a: 2, k: 0.14 }],
  },
  {
    id: "fuel_surcharge_hike",
    name: "燃料費サーチャージが上昇",
    description:
      "飛行機の燃料費の上昇が見込まれる。コスト転嫁が難航すると航空会社の収益には逆風となる。",
    tickers: [{ ticker: "AIR", a: 2, k: -0.1 }],
  },
  {
    id: "airline_staff_shortage",
    name: "航空会社、人手不足で一部路線を減便",
    description:
      "航空会社の供給制約から機会損失が発生しやすく、売上に悪影響か。",
    tickers: [{ ticker: "AIR", a: 1, k: -0.12 }],
  },
  {
    id: "nintendo_new_hardware",
    name: "任天堂、新型ハードを正式発表",
    description:
      "プラットフォーム刷新でサードの投入加速に期待。",
    tickers: [{ ticker: "GAME", a: 3, k: 0.2 }],
  },
  {
    id: "game_delay_major_title",
    name: "新型ゲーム機での超期待作の発売が延期",
    description:
      "四半期の売上・利益計画に下押し圧力。",
    tickers: [{ ticker: "GAME", a: 2, k: -0.15 }],
  },
  {
    id: "geopolitical_risk_surges_gold",
    name: "地政学リスクが急騰",
    description:
      "安全資産需要が強まり「有事の円買い」へ",
    tickers: [{ ticker: "GOLD", a: 1, k: 0.22 }],
  },
  {
    id: "real_interest_rates_up_gold",
    name: "実質金利が上昇",
    description:
      "金利上昇・ドル高で金の逆風に。",
    tickers: [{ ticker: "GOLD", a: 3, k: -0.18 }],
  },
  {
    id: "semi_factory_utilization_low",
    name: "半導体工場、稼働率30%に低下",
    description:
      "積極的な設備投資が裏目に出て、半導体企業が在庫を抱える。",
    tickers: [{ ticker: "SEMI", a: 5, k: -0.3 }],
  },
  {
    id: "new_drug_approval_venture",
    name: "新薬承認！！",
    description:
      "東大発のベンチャーが複数の大手企業と共同研究していた新薬が承認。",
    tickers: [{ ticker: "PHARMA", a: 3, k: 0.2 }],
  },
  {
    id: "pokemon_new_title_sales_good",
    name: "ポケモン新作売り上げ好調！",
    description:
      "ポケットモンスターシリーズの新作が発売、愛くるしい新キャラがヒットし売り上げが予想より大幅増",
    tickers: [{ ticker: "GAME", a: 3, k: 0.1 }],
  },
  {
    id: "heatwave_power_shortage",
    name: "猛暑による電力不足",
    description:
      "夏の気温が異常に高く、エアコン需要が急増。電力会社がフル稼働状態に。",
    tickers: [{ ticker: "UTIL", a: 3, k: 0.1 }],
  },
  {
    id: "us_cpi_surprise_high",
    name: "米CPIが市場予想を大幅上振れ",
    description:
      "インフレ再加速観測で金利上昇・ドル高が意識される。",
    tickers: [
      { ticker: "USDJPY", a: 1, k: 0.18 },
      { ticker: "BANK", a: 2, k: 0.12 },
      { ticker: "GOLD", a: 3, k: -0.12 },
    ],
  },
  {
    id: "us_recession_official",
    name: "米国の景気後退入りが公式宣言",
    description:
      "需要減速・リスクオフで株安・円高・金買いが同時進行。",
    tickers: [
      { ticker: "BANK", a: 3, k: -0.25 },
      { ticker: "AIR", a: 3, k: -0.18 },
      { ticker: "GOLD", a: 3, k: 0.18 },
      { ticker: "USDJPY", a: 2, k: -0.2 },
    ],
  },
  {
    id: "middle_east_conflict_oil_spike",
    name: "中東有事で原油が急騰",
    description:
      "供給懸念で原油価格が短期急騰、関連業種と指数に波及。",
    tickers: [
      { ticker: "ENEOS", a: 1, k: 0.2 },
      { ticker: "AIR", a: 1, k: -0.2 },
      { ticker: "GOLD", a: 1, k: 0.15 },
    ],
  },
  {
    id: "yen_flash_crash_up",
    name: "円フラッシュクラッシュ（急騰）",
    description:
      "短時間で急速な円高進行。外需企業中心に逆風。",
    tickers: [
      { ticker: "USDJPY", a: 1, k: -0.35 },
      { ticker: "AUTO", a: 1, k: -0.2 },
      { ticker: "SEMI", a: 1, k: -0.1 },
      { ticker: "GAME", a: 1, k: -0.12 },
    ],
  },
  {
    id: "heatwave_power_demand_tight",
    name: "猛暑で電力需給ひっ迫",
    description:
      "電力需要が急増。燃料・発電・小売各社の思惑が交錯。",
    tickers: [
      { ticker: "UTIL", a: 2, k: 0.18 },
      { ticker: "ENEOS", a: 2, k: 0.1 },
    ],
  },
  {
    id: "consumption_tax_hike_announced",
    name: "消費税の引き上げ方針を政府が表明",
    description:
      "家計の実質負担増で耐久消費・小売に逆風、指数にも重石。",
    tickers: [
      { ticker: "NITORI", a: 3, k: -0.12 },
      { ticker: "AUTO", a: 3, k: -0.15 },
      { ticker: "AIR", a: 2, k: -0.08 },
    ],
  },
  {
    id: "semi_subsidy_package",
    name: "半導体補助金・規制緩和パッケージ発表",
    description:
      "先端投資を後押し。サプライチェーン改善期待も波及。",
    tickers: [
      { ticker: "SEMI", a: 4, k: 0.22 },
      { ticker: "AUTO", a: 2, k: 0.06 },
      { ticker: "USDJPY", a: 1, k: 0.06 },
    ],
  },
  {
    id: "boj_easing_strengthened_qe",
    name: "日銀が金融緩和を強化（QE再拡大）",
    description:
      "実質金利低下・円安方向。銀行は利ざや圧迫懸念、株式は資産効果で支え。",
    tickers: [
      { ticker: "USDJPY", a: 1, k: 0.18 },
      { ticker: "BANK", a: 2, k: -0.15 },
      { ticker: "GOLD", a: 2, k: 0.1 },
    ],
  },
  {
    id: "boj_rate_hike_17years",
    name: "日銀が利上げ発表！！",
    description:
      "日銀が政策金利を25bp引き上げ。政策金利がこの水準になるのは17年ぶり。",
    tickers: [{ ticker: "USDJPY", a: 2, k: -0.25 }, { ticker: "BANK", a: 2, k: 0.25 }],
  },
  {
    id: "tariff_hike_us_president",
    name: "関税引き上げ！！",
    description:
      "米大統領が関税の引き上げを発表。100%を越える関税を課される国も。",
    tickers: [
      { ticker: "BANK", a: 3, k: -0.4 },
      { ticker: "SEMI", a: 3, k: -0.4 },
      { ticker: "AUTO", a: 3, k: -0.4 },
      { ticker: "PHARMA", a: 3, k: -0.4 },
      { ticker: "NITORI", a: 3, k: -0.4 },
      { ticker: "UTIL", a: 3, k: -0.4 },
      { ticker: "AIR", a: 3, k: -0.4 },
      { ticker: "GAME", a: 3, k: -0.4 },
      { ticker: "ENEOS", a: 3, k: -0.4 },
    ],
  },
  {
    id: "swiss_bank_credit_fears_1",
    name: "スイス大手銀行が信用不安！",
    description:
      "スイスの大手銀行が信用不安。しかし監査当局は楽観視。",
    tickers: [
      { ticker: "GOLD", a: 2, k: 0.2 },
      { ticker: "BANK", a: 2, k: -0.1 },
    ],
  },
  {
    id: "swiss_bank_credit_fears_2_resolved",
    name: "スイス大手銀行の信用不安、払拭！",
    description:
      "先日のスイスの大手銀行の信用不安。監査によりまったくの問題がないことが証明された。",
    tickers: [
      { ticker: "GOLD", a: 2, k: -0.02 },
      { ticker: "BANK", a: 2, k: 0.3 },
    ],
  },
  {
    id: "swiss_bank_credit_fears_3_collapse",
    name: "スイス大手銀行、破綻！",
    description:
      "スイスの大手銀行が遂に破綻。今後他銀行との合併を行うとの発表。",
    tickers: [
      { ticker: "GOLD", a: 2, k: 0.2 },
      { ticker: "BANK", a: 2, k: -0.5 },
    ],
  },
  {
    id: "lower_house_dissolution_election",
    name: "衆院解散・総選挙へ",
    description:
      "首相が突然の衆議院解散を発表。政策の先行きに対する不確実性が高まったことで、大型株に一時売りが殺到。",
    tickers: [
      { ticker: "NIKKEI", a: 3, k: -0.12 },
      { ticker: "BANK", a: 2, k: -0.05 },
      { ticker: "AUTO", a: 2, k: -0.12 },
    ],
  },
  {
    id: "new_cabinet_fiscal_stimulus",
    name: "新内閣誕生、積極財政を発表",
    description:
      "選挙で与党が勝利し、新たに発足した内閣が大胆な積極財政策を掲げた。家計支援の充実から、国内需要の押し上げ期待が広がる。",
    tickers: [
      { ticker: "NIKKEI", a: 3, k: 0.12 },
      { ticker: "NITORI", a: 2, k: 0.15 },
      { ticker: "BANK", a: 2, k: 0.05 },
    ],
  },
  {
    id: "income_tax_cut_consideration",
    name: "政府、所得税減税の検討に着手",
    description:
      "政府が家計負担を軽減する目的で所得税減税案を検討しているとの一部報道。消費マインドを下支えする効果が期待され、耐久消費財などに追い風。",
    tickers: [
      { ticker: "NITORI", a: 2, k: 0.14 },
      { ticker: "AUTO", a: 2, k: 0.12 },
    ],
  },
  {
    id: "defense_budget_increase",
    name: "防衛費、大幅増額方針を政府が示す",
    description:
      "国際情勢の緊迫化を受け、政府が防衛費の大幅増額方針を表明。財政悪化懸念から長期金利の上昇を意識される。",
    tickers: [
      { ticker: "BANK", a: 2, k: 0.1 },
      { ticker: "USDJPY", a: 2, k: 0.08 },
    ],
  },
  // --- レーティング関連 (ランダムイベント向き) ---
  {
    id: "rating_bank_up",
    name: "大手証券、銀行株を『買い』に格上げ",
    description:
      "利ざや拡大と貸出成長を背景に、大手証券が銀行株を『買い』に引き上げた。市場では成長期待が高まり、関連銘柄に強い買いが入っている。",
    tickers: [{ ticker: "BANK", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_auto_down",
    name: "外資系証券、自動車株を『弱気』に引き下げ",
    description:
      "外資系証券が“EV競争の激化”を理由に自動車株を『弱気』に格下げ。投資家に警戒感が広がっている。",
    tickers: [{ ticker: "AUTO", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_semi_up",
    name: "半導体メーカーを『買い推奨』に引き上げ",
    description:
      "新型AIチップ関連の需要増を理由に、国内証券が半導体株を一斉に買い推奨。『来年度業績は上振れ余地』とのレポートが投資家の注目を集めている。",
    tickers: [{ ticker: "SEMI", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_game_up",
    name: "ゲーム株を『中立→買い』に格上げ",
    description:
      "新作タイトルの予約が好調との見方から、証券会社がゲーム株を買いに格上げ。個人投資家を中心に買いが波及している。",
    tickers: [{ ticker: "GAME", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_eneos_down",
    name: "石油株の格付けを『弱気』に引き下げ",
    description:
      "原油市況の変動リスクを理由に、外資系証券が石油株を弱気に変更。『収益の不透明感が強い』との判断が広がっている。",
    tickers: [{ ticker: "ENEOS", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_air_up",
    name: "航空株を『買い』に引き上げ、需要回復を評価",
    description:
      "国際線の旅客回復が続いているとして、証券会社が航空株を買い推奨。各路線での予約増加を背景に強気レポートが相次いでいる。",
    tickers: [{ ticker: "AIR", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_util_down",
    name: "電力株を『弱気』に格下げ",
    description:
      "燃料費の上昇リスクを理由に公益株の投資判断が引き下げに。『コスト増で利益率低下の可能性』と警告するレポートが拡散している。",
    tickers: [{ ticker: "UTIL", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_nitori_up",
    name: "小売り株を『買い』に格上げ",
    description:
      "値下げ戦略と新規出店が評価され、小売株を証券各社が一斉に買い推奨。個人消費の底堅さが追い風との見方が出ている。",
    tickers: [{ ticker: "NITORI", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_pharma_down",
    name: "製薬株を『弱気』に変更、薬価改定を懸念",
    description:
      "薬価改定の影響が大きいとして製薬株のレーティングが引き下げに。関連銘柄の短期的な調整を警戒する声が市場に広がっている。",
    tickers: [{ ticker: "PHARMA", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_gold_up",
    name: "金鉱株を『買い』に引き上げ、安全資産需要を評価",
    description:
      "地政学リスクの高まりを受け、安全資産として金需要が再燃。証券会社は金関連銘柄を買い推奨とし、強気の見通しを示している。",
    tickers: [{ ticker: "GOLD", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_usdjpy_up",
    name: "ドル円、『更なる円安』とのレポートが話題に",
    description:
      "外資系金融機関が『ドル円は一段の円安へ』とレポート。日米金利差を理由に強気姿勢を鮮明にした。",
    tickers: [{ ticker: "USDJPY", a: 1, k: randK_Rating }],
  },
  {
    id: "rating_nikkei_up",
    name: "日本株全体を『オーバーウエイト』へ引き上げ",
    description:
      "海外投資家向けレポートで、日本株全体の評価がオーバーウエイトに。『企業収益は世界でも安定的』として日本株の買いを推奨。",
    tickers: [{ ticker: "NIKKEI", a: 1, k: randK_Rating }],
  },
  // --- その他 (ランダムイベント向き) ---
  {
    id: "algae_fuel_discovery",
    name: "石油代替となる“藻類資源”が発見される",
    description:
      "国際研究チームが、わずかなコストで大量の燃料を生成できる未知の藻類を発見したと発表。",
    tickers: [
      { ticker: "ENEOS", a: 3, k: -0.05 },
    ],
  },
  {
    id: "ufo_sighting_tokyo_bay",
    name: "東京湾でUFO目撃情報、市場は一時混乱",
    description:
      "東京湾上空で複数のUFOが目撃されたとSNSで急拡散。政府関係者のコメントも食い違い、市場参加者の間で不安が広がった。実体経済への影響は不明",
    tickers: [
      { ticker: "BANK", a: 1, k: -0.02 },
      { ticker: "GAME", a: 1, k: 0.02 },
      { ticker: "GOLD", a: 1, k: 0.03 },
      { ticker: "SEMI", a: 1, k: -0.01 },
    ],
  },
  {
    id: "antarctica_virus_detected",
    name: "南極で未知のウイルス検出、国際研究機関が警戒レベル引き上げ",
    description:
      "パンデミックリスクを指摘する報道が広がり、医薬品関連株に買いが集中。",
    tickers: [
      { ticker: "PHARMA", a: 3, k: 0.28 },
    ],
  },
  {
    id: "buffett_japan_undervalued",
    name: "バフェット、日本株は“過小評価”と発言",
    description:
      "世界的投資家ウォーレン・バフェット氏が講演で『日本企業の価値は世界的に見て過小評価されている』とコメント。この発言を受けて、割安な銀行株を中心に買いが入る。",
    tickers: [
      { ticker: "BANK", a: 3, k: 0.15 },
    ],
  },
  {
    id: "us_president_ai_semi_deregulation",
    name: "米大統領、AI・半導体規制の緩和を示唆",
    description:
      "アメリカ大統領がハイテク産業の競争力強化を目的に、AI開発や半導体製造に関する規制緩和を検討していると発言し、世界的な設備投資拡大への期待が強まる。",
    tickers: [
      { ticker: "SEMI", a: 2, k: 0.12 },
    ],
  },
  {
    id: "china_stimulus_package",
    name: "中国政府、大規模景気刺激策を発表",
    description:
      "低迷する国内景気を下支えするため、インフラ投資拡大など大規模な景気刺激パッケージを発表。アジア全体の需要回復期待が高まり、日本の輸出関連株にも買いが波及。",
    tickers: [
      { ticker: "AUTO", a: 2, k: 0.1 },
      { ticker: "SEMI", a: 2, k: 0.08 },
    ],
  },
  {
    id: "gold_meteorite_crash",
    name: "金の塊が詰まった隕石が世界に落下！",
    description:
      "世界各地で目撃された巨大隕石の分析により、中に大量の金が含まれていたことが判明！供給過多になるとの思惑が広がり、金市場では短期的に大きな売り圧力が発生。",
    tickers: [{ ticker: "GOLD", a: 3, k: -0.35 }],
  },
  {
    id: "ai_market_prediction_rumor",
    name: "AIが株式市場を“完全予測できる”という噂が拡散",
    description:
      "SNSを中心に『AIが未来の株価を完全に予測する』という疑わしい主張が急速に拡散。真偽不明ながら一部の投機筋がグロース株を買い進める動きがみられた。",
    tickers: [
      { ticker: "GAME", a: 2, k: 0.04 },
      { ticker: "SEMI", a: 2, k: 0.04 },
    ],
  }
] as const;

export const STORY_ROUTES = {
  // ストーリーA: 金融危機ルート
  routeA: [
    { dayIndex: 5, eventId: "swiss_bank_credit_fears_1" }, // 信用不安
    { dayIndex: 15, eventId: "swiss_bank_credit_fears_3_collapse" }, // 破綻
    { dayIndex: 20, eventId: "large_loan_default" }, // 大口融資先でデフォルト
    { dayIndex: 30, eventId: "us_recession_official" }, // 米国が景気後退入り
    { dayIndex: 40, eventId: "yen_flash_crash_up" }, // リスクオフで円が急騰
    { dayIndex: 50, eventId: "boj_easing_strengthened_qe" }, // 日銀が金融緩和強化
    { dayIndex: 70, eventId: "geopolitical_risk_surges_gold" }, // 地政学リスク（金↑）
    { dayIndex: 90, eventId: "tariff_hike_us_president" }, // 保護主義・関税引き上げ
    { dayIndex: 120, eventId: "new_cabinet_fiscal_stimulus" }, // 新内閣が財政出動
    { dayIndex: 150, eventId: "swiss_bank_credit_fears_2_resolved" }, // 信用不安、払拭
  ],

  // ストーリーB: パンデミックルート
  routeB: [
    { dayIndex: 3, eventId: "pandemic_occurs" }, // パンデミック発生
    { dayIndex: 15, eventId: "airline_staff_shortage" }, // 航空会社、人手不足で減便
    { dayIndex: 30, eventId: "antarctica_virus_detected" }, // 南極で未知のウイルス（恐怖↑）
    { dayIndex: 45, eventId: "nitori_same_store_sales_up" }, // 巣ごもり需要でニトリ好調
    { dayIndex: 60, eventId: "boj_easing_strengthened_qe" }, // 世界的に金融緩和
    { dayIndex: 80, eventId: "pharma_phase3_success" }, // ワクチン治験成功
    { dayIndex: 100, eventId: "new_drug_approval_venture" }, // 新薬承認
    { dayIndex: 120, eventId: "airline_slots_expanded" }, // 経済再開へ、国際線発着枠拡大
    { dayIndex: 140, eventId: "inbound_tourism_boom" }, // インバウンド絶好調
    { dayIndex: 160, eventId: "us_cpi_surprise_high" }, // 緩和しすぎでインフレ発生
  ],

  // ストーリーC: 金融政策・為替介入ルート
  routeC: [
    { dayIndex: 10, eventId: "historic_yen_weakness" }, // 歴史的円安
    { dayIndex: 12, eventId: "mof_verbal_intervention_1" }, // 口先介入1『望ましくない』
    { dayIndex: 15, eventId: "mof_verbal_intervention_3" }, // 口先介入2『適切に対応』
    { dayIndex: 20, eventId: "mof_yen_intervention" }, // 実弾介入 (1回目)
    { dayIndex: 40, eventId: "us_jobs_report_strong" }, // 米雇用統計が強すぎ
    { dayIndex: 45, eventId: "us_cpi_surprise_high" }, // 米CPIが予想上振れ
    { dayIndex: 60, eventId: "rating_usdjpy_up" }, // 外資系が円安レポート
    { dayIndex: 70, eventId: "mof_verbal_intervention_5" }, // 口先介入3『投機には対応』
    { dayIndex: 75, eventId: "mof_yen_intervention" }, // 再度の実弾介入 (2回目)
    { dayIndex: 90, eventId: "boj_rate_hike_17years" }, // 日銀ついに利上げ発表
  ],

  // ストーリーD: 半導体サイクルルート
  routeD: [
    { dayIndex: 5, eventId: "ai_boom" }, // AIブーム到来
    { dayIndex: 15, eventId: "generative_ai_demand_semi" }, // 生成AI需要で受注最高
    { dayIndex: 30, eventId: "us_president_ai_semi_deregulation" }, // 米大統領、AI規制緩和示唆
    { dayIndex: 45, eventId: "semi_subsidy_package" }, // 日本政府、半導体補助金
    { dayIndex: 60, eventId: "china_export_restrictions_semi" }, // 対中輸出規制が半導体に拡大
    { dayIndex: 80, eventId: "semi_inventory_worsens" }, // 在庫悪化でライン停止
    { dayIndex: 100, eventId: "semi_factory_utilization_low" }, // 工場稼働率が30%に低下
    { dayIndex: 120, eventId: "rating_semi_up" }, // 底打ち期待で証券会社が格上げ
    { dayIndex: 140, eventId: "china_stimulus_package" }, // 中国が大規模景気刺激策
    { dayIndex: 160, eventId: "ai_boom" }, // 第2次AIブーム到来
  ],

  // ストーリーE: 政局・財政・地政学ルート
  routeE: [
    { dayIndex: 3, eventId: "lower_house_dissolution_election" }, // 衆院解散・総選挙へ
    { dayIndex: 20, eventId: "new_cabinet_fiscal_stimulus" }, // 新内閣誕生、積極財政を発表
    { dayIndex: 35, eventId: "income_tax_cut_consideration" }, // 政府、所得税減税の検討
    { dayIndex: 50, eventId: "defense_budget_increase" }, // 防衛費、大幅増額方針
    { dayIndex: 65, eventId: "middle_east_tension" }, // 中東情勢、悪化
    { dayIndex: 75, eventId: "opec_plus_cuts_extended" }, // OPEC+が追加減産を延長
    { dayIndex: 85, eventId: "middle_east_conflict_oil_spike" }, // 中東有事で原油が急騰
    { dayIndex: 100, eventId: "consumption_tax_hike_announced" }, // 財源不足で消費税引き上げ表明
    { dayIndex: 120, eventId: "nuclear_plant_restart" }, // エネルギー安全保障で原発再稼働
    { dayIndex: 140, eventId: "rating_nikkei_up" }, // 政策期待で日本株オーバーウエイト
  ],
} as const;


//
// 3. ランダムイベント確率
//
export const RANDOM_EVENT_PROB = 0.07;

// --- これ以降の型定義は、フロントエンド側で追加定義します ---

// ✅ 6. ニュースイベントの型定義 (フロントエンド用)
// (description を含む constants.ts の EVENTS から型を推論)
type EventConst = typeof EVENTS[number];
export type NewsEvent = EventConst & { tick: number };

// ✅ 7. プレイヤーの型定義 (フロントエンド用)
export type Position = { qty: number; avgPrice: number };
export type Player = { 
  cash: number; 
  holdings: Record<TickerId, Position>; // 内部IDがキー
  totalValue: number; 
  pnl: number;
};

// ✅ 8. ニュース画像のマッピング
export const NEWS_IMAGE_MAP: Record<string, string> = {
  // --- 既存・重要イベント ---
  "パンデミック発生！": "/images/news/corona_shock.png",
  "AIブーム到来！": "/images/news/ai_boom.png",
  "歴史的な円安": "/images/news/yen_shock.png",
  "日銀、金利引き上げ": "/images/news/interest_rate.png",
  "インバウンド絶好調": "/images/news/tourism_boom.png",
  "中東情勢、悪化": "/images/news/oil_high.png",
  "関税引き上げ！！": "/images/news/tariff.png",

  // --- 為替・財務省発言（口先介入） ---
  "財務大臣『急激な円安は望ましくない』と発言": "/images/news/mof_speech.png",
  "財務大臣『為替動向を注視している』とコメント": "/images/news/mof_speech.png",
  "財務大臣『必要なら適切に対応する』と牽制": "/images/news/mof_speech.png",
  "財務大臣『為替はファンダメンタルズを反映すべき』と発言": "/images/news/mof_speech.png",
  "財務大臣『過度な投機による動きには適切に対応』と牽制": "/images/news/mof_speech.png",
  "財務大臣、為替の急変動を『懸念』": "/images/news/mof_speech.png",
  "財務省が円買い介入を実施": "/images/news/intervention.png",
  "円フラッシュクラッシュ（急騰）": "/images/news/yen_rise.png",
  "ドル円、『更なる円安』とのレポートが話題に": "/images/news/yen_shock.png",

  // --- 金融政策・経済指標 ---
  "日銀がサプライズ利上げ": "/images/news/interest_rate.png",
  "日銀が金融緩和を強化（QE再拡大）": "/images/news/money_printing.png",
  "日銀が利上げ発表！！": "/images/news/interest_rate.png",
  "米雇用統計がサプライズの強さ": "/images/news/usa_economy.png",
  "米CPIが市場予想を大幅上振れ": "/images/news/usa_economy.png",
  "米国の景気後退入りが公式宣言": "/images/news/recession.png",
  "実質金利が上昇": "/images/news/interest_rate.png",

  // --- 半導体・ハイテク ---
  "対中輸出規制が半導体に拡大": "/images/news/trade_war.png",
  "生成AI需要で設備受注が過去最高": "/images/news/semicon_factory.png",
  "半導体、在庫悪化で一部ラインが出荷停止": "/images/news/factory_stop.png",
  "半導体工場、稼働率30%に低下": "/images/news/factory_stop.png",
  "半導体補助金・規制緩和パッケージ発表": "/images/news/subsidy.png",
  "米大統領、AI・半導体規制の緩和を示唆": "/images/news/usa_president.png",
  "AIが株式市場を“完全予測できる”という噂が拡散": "/images/news/ai_robot.png",
  "半導体メーカーを『買い推奨』に引き上げ": "/images/news/rating_up.png",
  "半導体、決算ミスで「失望売り」": "/images/news/earnings_down.png",

  // --- 自動車・EV ---
  "欧州でEV補助金が縮小": "/images/news/ev_car.png",
  "アメリカにてプリウスに大規模リコールが発生": "/images/news/recall.png",
  "北米で新型自動車の販売・利益率ともに改善": "/images/news/car_sales.png",
  "外資系証券、自動車株を『弱気』に引き下げ": "/images/news/rating_down.png",
  "自動車大手、決算で「サプライズ」上方修正": "/images/news/earnings_up.png",
  "自動車メーカー、検査データ不正が発覚": "/images/news/apology.png",

  // --- 製薬・バイオ ---
  "治験フェーズ3試験が主要評価項目を達成": "/images/news/pharma_success.png",
  "治験フェーズ3試験が失敗": "/images/news/pharma_fail.png",
  "薬価改定でマイナス幅が拡大": "/images/news/drug_price.png",
  "画期的新薬の承認審査が加速": "/images/news/pharma_success.png",
  "新薬承認！！": "/images/news/pharma_success.png",
  "南極で未知のウイルス検出、国際研究機関が警戒レベル引き上げ": "/images/news/bio_hazard.png",
  "製薬株を『弱気』に変更、薬価改定を懸念": "/images/news/rating_down.png",
  "製薬大手、米バイオ企業を買収発表": "/images/news/ma_deal.png",

  // --- 小売・ニトリ ---
  "ニトリ、海外出店で立ち上げ費用が先行": "/images/news/retail_store.png",
  "ニトリ、既存店売上が客数・客単価ともに伸長": "/images/news/retail_sales_up.png",
  "小売り株を『買い』に格上げ": "/images/news/rating_up.png",
  "ニトリ、業績予想を「下方修正」": "/images/news/earnings_down.png",

  // --- エネルギー・商社 ---
  "OPEC+が追加減産を延長": "/images/news/oil_pump.png",
  "石油代替となる“藻類資源”が発見される": "/images/news/bio_fuel.png",
  "中東有事で原油が急騰": "/images/news/oil_fire.png",
  "石油株の格付けを『弱気』に引き下げ": "/images/news/rating_down.png",
  "ENEOS、新規油田の権益獲得": "/images/news/oil_rig.png",

  // --- ゲーム・任天堂 ---
  "任天堂、自己株買い・増配を同時発表": "/images/news/share_buyback.png",
  "任天堂、新型ハードを正式発表": "/images/news/game_hardware.png",
  "新型ゲーム機での超期待作の発売が延期": "/images/news/game_delay.png",
  "ゲーム株を『中立→買い』に格上げ": "/images/news/rating_up.png",
  "ポケモン新作売り上げ好調！": "/images/news/game_hit.png",
  "任天堂、AI企業と資本業務提携": "/images/news/ma_deal.png",

  // --- 航空・電力・インフラ ---
  "原発の再稼働が正式決定": "/images/news/nuclear.png",
  "国際線の発着枠が拡大": "/images/news/airport.png",
  "燃料費サーチャージが上昇": "/images/news/airplane_fuel.png",
  "航空会社、人手不足で一部路線を減便": "/images/news/airport_crowd.png",
  "猛暑による電力不足": "/images/news/sun_hot.png",
  "猛暑で電力需給ひっ迫": "/images/news/sun_hot.png",
  "電力株を『弱気』に格下げ": "/images/news/rating_down.png",
  "航空株を『買い』に引き上げ、需要回復を評価": "/images/news/rating_up.png",
  "電力会社で顧客情報漏洩が発覚": "/images/news/apology.png",
  "大型台風で国内工場が操業停止": "/images/news/typhoon.png",

  // --- 政治・財政 ---
  "衆院解散・総選挙へ": "/images/news/election.png",
  "新内閣誕生、積極財政を発表": "/images/news/diet_building.png",
  "政府、所得税減税の検討に着手": "/images/news/tax_cut.png",
  "防衛費、大幅増額方針を政府が示す": "/images/news/defense.png",
  "消費税の引き上げ方針を政府が表明": "/images/news/tax_up.png",
  "中国政府、大規模景気刺激策を発表": "/images/news/china_economy.png",

  // --- 金融・市況全体 ---
  "大口融資先でデフォルト発生": "/images/news/bank_fail.png",
  "決算シーズンでEPS上方修正が相次ぐ": "/images/news/stock_chart_up.png",
  "地政学リスクが急騰": "/images/news/war_risk.png",
  "大手証券、銀行株を『買い』に格上げ": "/images/news/rating_up.png",
  "金鉱株を『買い』に引き上げ、安全資産需要を評価": "/images/news/rating_up.png",
  "日本株全体を『オーバーウエイト』へ引き上げ": "/images/news/rating_up.png",
  "メガバンク、決算で最高益を更新": "/images/news/earnings_up.png",
  "バフェット、日本株は“過小評価”と発言": "/images/news/investor_legend.png",

  // --- 国際金融・ショック ---
  "スイス大手銀行が信用不安！": "/images/news/bank_panic.png",
  "スイス大手銀行の信用不安、払拭！": "/images/news/bank_safe.png",
  "スイス大手銀行、破綻！": "/images/news/bank_collapse.png",

  // --- その他・ネタ ---
  "東京湾でUFO目撃情報、市場は一時混乱": "/images/news/ufo.png",
  "金の塊が詰まった隕石が世界に落下！": "/images/news/meteorite.png",
};

// ✅ 9. デフォルト画像
export const DEFAULT_NEWS_IMAGE = "/images/news/default.png";

// ✅ 10. 各ティッカーの固有ボラティリティ (標準偏差)
// TickerId 型が constants.ts で定義されている前提です
// (もし TickerId が別ファイルの場合、適宜 import してください)
export const SIGMA: Partial<Record<TickerId, number>> = {
  // 為替・コモディティ
  USDJPY: 0.003, // 為替（ボラティリティ低め）
  GOLD: 0.018, // 金（ボラティリティ中）

  // セクター・個別株
  BANK: 0.02, // 銀行（標準的）
  SEMI: 0.025, // 半導体（ボラティリティ高め）
  AUTO: 0.018, // 自動車（標準的）
  PHARMA: 0.015, // 医薬品（ボラティリティ低め）
  NITORI: 0.017, // 小売（やや低め）
  UTIL: 0.014, // 公益（ボラティリティ低め）
  AIR: 0.022, // 空運（ボラティリティ高め）
  GAME: 0.023, // ゲーム（ボラティリティ高め）
  ENEOS: 0.024, // エネルギー（ボラティリティ高め）

  // NIKKEI は他のティッカーの平均から算出されるため、固有ボラティリティは不要
};

export const TICKER_DISPLAY_NAME: Record<TickerId, string> = {
  BANK: "🏦 四井為友銀行",
  SEMI: "🖥️ 東亰エレクトロン",
  AUTO: "🚗 トヨダ自動車",
  PHARMA: "💊 大正製薬",
  NITORI: "🛋️ ニトリ",
  UTIL: "⚡️ 関西電力",
  AIR: "✈️ JAL/ANA",
  GAME: "🎮 任天堂",
  ENEOS: "🛢️ ENEOS",
  GOLD: "🪙 ゴールド",
  USDJPY: "💱 為替(USD/JPY)",
  NIKKEI: "📈 日経平均",
};

// 2026年 日本（東証）の営業日カレンダー
// ※フォーマット: "YYYY-MM-DD"
// ※ゲーム内日付進行で使用
export const BUSINESS_DAYS_2026: string[] = [
  "2026-01-02",
  "2026-01-05",
  "2026-01-06",
  "2026-01-07",
  "2026-01-08",
  "2026-01-09",

  "2026-01-13",
  "2026-01-14",
  "2026-01-15",
  "2026-01-16",

  "2026-01-19",
  "2026-01-20",
  "2026-01-21",
  "2026-01-22",
  "2026-01-23",

  "2026-01-26",
  "2026-01-27",
  "2026-01-28",
  "2026-01-29",
  "2026-01-30",

  // February
  "2026-02-02",
  "2026-02-03",
  "2026-02-04",
  "2026-02-05",
  "2026-02-06",

  "2026-02-09",
  "2026-02-10",

  "2026-02-12",
  "2026-02-13",

  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-02-19",
  "2026-02-20",

  "2026-02-23", // 天皇誕生日 → 無し（休場なので飛ばす）

  "2026-02-24",
  "2026-02-25",
  "2026-02-26",
  "2026-02-27",

  // March
  "2026-03-02",
  "2026-03-03",
  "2026-03-04",
  "2026-03-05",
  "2026-03-06",

  "2026-03-09",
  "2026-03-10",
  "2026-03-11",
  "2026-03-12",
  "2026-03-13",

  "2026-03-16",
  "2026-03-17",
  "2026-03-18",
  "2026-03-19",

  // 3/20 春分の日 → 除外

  "2026-03-23",
  "2026-03-24",
  "2026-03-25",
  "2026-03-26",
  "2026-03-27",

  "2026-03-30",
  "2026-03-31",

  // April
  "2026-04-01",
  "2026-04-02",
  "2026-04-03",

  "2026-04-06",
  "2026-04-07",
  "2026-04-08",
  "2026-04-09",
  "2026-04-10",

  "2026-04-13",
  "2026-04-14",
  "2026-04-15",
  "2026-04-16",
  "2026-04-17",

  "2026-04-20",
  "2026-04-21",
  "2026-04-22",
  "2026-04-23",
  "2026-04-24",

  "2026-04-27",
  "2026-04-28",

  // 4/29 昭和の日 → 除外

  "2026-04-30",

  // May
  // 5/1 営業日
  "2026-05-01",

  // 5/3〜5/5 → GW休場

  "2026-05-06",
  "2026-05-07",
  "2026-05-08",

  "2026-05-11",
  "2026-05-12",
  "2026-05-13",
  "2026-05-14",
  "2026-05-15",

  "2026-05-18",
  "2026-05-19",
  "2026-05-20",
  "2026-05-21",
  "2026-05-22",

  "2026-05-25",
  "2026-05-26",
  "2026-05-27",
  "2026-05-28",
  "2026-05-29",

  // June
  "2026-06-01",
  "2026-06-02",
  "2026-06-03",
  "2026-06-04",
  "2026-06-05",

  "2026-06-08",
  "2026-06-09",
  "2026-06-10",
  "2026-06-11",
  "2026-06-12",

  "2026-06-15",
  "2026-06-16",
  "2026-06-17",
  "2026-06-18",
  "2026-06-19",

  "2026-06-22",
  "2026-06-23",
  "2026-06-24",
  "2026-06-25",
  "2026-06-26",

  "2026-06-29",
  "2026-06-30",

  // July
  "2026-07-01",
  "2026-07-02",
  "2026-07-03",

  "2026-07-06",
  "2026-07-07",
  "2026-07-08",
  "2026-07-09",
  "2026-07-10",

  "2026-07-13",
  "2026-07-14",
  "2026-07-15",
  "2026-07-16",
  "2026-07-17",

  // 7/20 海の日 → 除外

  "2026-07-21",
  "2026-07-22",
  "2026-07-23",
  "2026-07-24",

  "2026-07-27",
  "2026-07-28",
  "2026-07-29",
  "2026-07-30",
  "2026-07-31",

  // August
  "2026-08-03",
  "2026-08-04",
  "2026-08-05",
  "2026-08-06",
  "2026-08-07",

  "2026-08-10",

  // 8/11 山の日 → 除外

  "2026-08-12",
  "2026-08-13",
  "2026-08-14",

  "2026-08-17",
  "2026-08-18",
  "2026-08-19",
  "2026-08-20",
  "2026-08-21",

  "2026-08-24",
  "2026-08-25",
  "2026-08-26",
  "2026-08-27",
  "2026-08-28",

  "2026-08-31",

  // September
  "2026-09-01",
  "2026-09-02",
  "2026-09-03",
  "2026-09-04",

  "2026-09-07",
  "2026-09-08",
  "2026-09-09",
  "2026-09-10",
  "2026-09-11",

  "2026-09-14",
  "2026-09-15",
  "2026-09-16",
  "2026-09-17",
  "2026-09-18",

  // 9/21 敬老の日 → 除外
  // 9/22 秋分の日 → 除外

  "2026-09-23",
  "2026-09-24",
  "2026-09-25",

  "2026-09-28",
  "2026-09-29",
  "2026-09-30",

  // October
  "2026-10-01",
  "2026-10-02",

  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
  "2026-10-08",
  "2026-10-09",

  "2026-10-12", // 体育の日 → 除外

  "2026-10-13",
  "2026-10-14",
  "2026-10-15",
  "2026-10-16",

  "2026-10-19",
  "2026-10-20",
  "2026-10-21",
  "2026-10-22",
  "2026-10-23",

  "2026-10-26",
  "2026-10-27",
  "2026-10-28",
  "2026-10-29",
  "2026-10-30",

  // November
  "2026-11-02",

  // 11/3 文化の日 → 除外

  "2026-11-04",
  "2026-11-05",
  "2026-11-06",

  "2026-11-09",
  "2026-11-10",
  "2026-11-11",
  "2026-11-12",
  "2026-11-13",

  "2026-11-16",
  "2026-11-17",
  "2026-11-18",
  "2026-11-19",
  "2026-11-20",

  // 11/23 勤労感謝の日 → 除外

  "2026-11-24",
  "2026-11-25",
  "2026-11-26",
  "2026-11-27",

  "2026-11-30",

  // December
  "2026-12-01",
  "2026-12-02",
  "2026-12-03",
  "2026-12-04",

  "2026-12-07",
  "2026-12-08",
  "2026-12-09",
  "2026-12-10",
  "2026-12-11",

  "2026-12-14",
  "2026-12-15",
  "2026-12-16",
  "2026-12-17",
  "2026-12-18",

  "2026-12-21",
  "2026-12-22",
  "2026-12-23",
  "2026-12-24",
  "2026-12-25",

  "2026-12-28",
  "2026-12-29",
  "2026-12-30"
];
