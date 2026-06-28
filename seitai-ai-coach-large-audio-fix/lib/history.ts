import type { AnalysisResult } from "@/lib/types";

export type AnalysisHistoryItem = {
  id: string;
  staffName: string;
  clinicName: string;
  source: "ai" | "demo";
  transcript: string;
  memo?: string;
  analysis: AnalysisResult;
  createdAt: string;
};

const historyKey = "seitai-ai-coach-analysis-history";

export function loadAnalysisHistory(): AnalysisHistoryItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(historyKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as AnalysisHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnalysisHistoryItem(item: Omit<AnalysisHistoryItem, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const current = loadAnalysisHistory();
  const next: AnalysisHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  window.localStorage.setItem(historyKey, JSON.stringify([next, ...current].slice(0, 200)));
}

export function clearAnalysisHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(historyKey);
}
