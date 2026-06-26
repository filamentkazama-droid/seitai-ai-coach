import type { AnalysisResult } from "@/lib/types";

export type LearningProfile = {
  totalAnalyses: number;
  averageScore: number;
  averageContractProbability: number;
  repeatedWeaknesses: { text: string; count: number }[];
  lastNextFocus: string[];
  lastUpdated: string;
};

const storageKey = "seitai-ai-coach-learning-profile";

export function loadLearningProfile(staffName = "default"): LearningProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(getStorageKey(staffName));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LearningProfile;
  } catch {
    return null;
  }
}

export function saveLearningProfile(profile: LearningProfile, staffName = "default") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(staffName), JSON.stringify(profile));
}

export function clearLearningProfile(staffName = "default") {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getStorageKey(staffName));
}

export function updateLearningProfile(current: LearningProfile | null, analysis: AnalysisResult): LearningProfile {
  const totalAnalyses = (current?.totalAnalyses ?? 0) + 1;
  const previousTotal = current?.totalAnalyses ?? 0;
  const averageScore = weightedAverage(current?.averageScore ?? 0, previousTotal, analysis.overallScore);
  const averageContractProbability = weightedAverage(
    current?.averageContractProbability ?? 0,
    previousTotal,
    analysis.contractPrediction.probability
  );
  const weaknessMap = new Map<string, number>();

  current?.repeatedWeaknesses.forEach((item) => weaknessMap.set(item.text, item.count));
  analysis.improvementPoints.slice(0, 5).forEach((text) => {
    weaknessMap.set(text, (weaknessMap.get(text) ?? 0) + 1);
  });

  return {
    totalAnalyses,
    averageScore,
    averageContractProbability,
    repeatedWeaknesses: [...weaknessMap.entries()]
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    lastNextFocus: analysis.nextFocus.slice(0, 5),
    lastUpdated: new Date().toISOString()
  };
}

export function buildLearningContext(profile: LearningProfile | null) {
  if (!profile || profile.totalAnalyses === 0) {
    return "このスタッフの過去学習データはまだありません。今回の音声を初回基準として分析してください。";
  }

  const weaknesses = profile.repeatedWeaknesses
    .slice(0, 5)
    .map((item) => `${item.text}（${item.count}回）`)
    .join("、");
  const focus = profile.lastNextFocus.join("、");

  return [
    `過去分析件数: ${profile.totalAnalyses}件`,
    `過去平均点: ${Math.round(profile.averageScore)}点`,
    `過去平均契約確率: ${Math.round(profile.averageContractProbability)}%`,
    `繰り返し出ている改善テーマ: ${weaknesses || "まだ十分な傾向なし"}`,
    `前回の次回意識ポイント: ${focus || "なし"}`,
    "今回の添削では、過去から繰り返している弱点と今回だけの課題を分けて、成長が分かるフィードバックにしてください。"
  ].join("\n");
}

function weightedAverage(previousAverage: number, previousTotal: number, nextValue: number) {
  if (previousTotal === 0) return nextValue;
  return (previousAverage * previousTotal + nextValue) / (previousTotal + 1);
}

function getStorageKey(staffName: string) {
  const normalized = staffName.trim() || "default";
  return `${storageKey}:${normalized}`;
}
