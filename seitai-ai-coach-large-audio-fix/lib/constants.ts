import type { EmotionKey, ScoreKey } from "@/lib/types";

export const scoreLabels: Record<ScoreKey, string> = {
  empathy: "共感",
  interview: "問診",
  lifeContext: "生活背景",
  inspection: "検査",
  causeExplanation: "原因説明",
  treatmentValue: "施術価値",
  futureVision: "改善未来",
  pricing: "料金説明",
  closing: "クロージング",
  trust: "信頼構築"
};

export const emotionLabels: Record<EmotionKey, string> = {
  confidence: "自信",
  nervousness: "緊張",
  impatience: "焦り",
  empathy: "共感度",
  safety: "安心感",
  trust: "信頼感",
  pushiness: "押し売り感",
  energy: "熱量",
  sincerity: "誠実さ",
  patientUnderstanding: "患者の納得度"
};

export const lostReasons = ["金額", "必要性不足", "家族相談", "他院比較", "時間", "その他"];
