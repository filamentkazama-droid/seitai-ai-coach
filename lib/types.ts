export type UserRole = "owner" | "manager" | "staff";

export type ScoreKey =
  | "empathy"
  | "interview"
  | "lifeContext"
  | "inspection"
  | "causeExplanation"
  | "treatmentValue"
  | "futureVision"
  | "pricing"
  | "closing"
  | "trust";

export type EmotionKey =
  | "confidence"
  | "nervousness"
  | "impatience"
  | "empathy"
  | "safety"
  | "trust"
  | "pushiness"
  | "energy"
  | "sincerity"
  | "patientUnderstanding";

export type TimelinePhase =
  | "問診"
  | "共感"
  | "検査"
  | "原因説明"
  | "改善計画"
  | "施術価値"
  | "料金説明"
  | "クロージング"
  | "契約"
  | "失注";

export type TalkAnalysis = {
  staffTalkRatio: number;
  patientTalkRatio: number;
  speechSpeed: string;
  silenceSeconds: number;
  pauseQuality: string;
  interruptions: number;
  monologueSeconds: number;
  questionCount: number;
  empathyCount: number;
  confirmationQuestionCount: number;
  fillers: { word: string; count: number }[];
  improvement: string;
};

export type AnalysisResult = {
  overallScore: number;
  scores: Record<ScoreKey, { score: number; reason: string }>;
  goodPoints: string[];
  improvementPoints: string[];
  improvementReasons: string[];
  improvedExamples: string[];
  nextFocus: string[];
  contractPrediction: {
    probability: number;
    reason: string;
    positiveFactors: string[];
    negativeFactors: string[];
    improvedProbability: number;
  };
  emotions: Record<EmotionKey, { score: number; reason: string }>;
  talkAnalysis: TalkAnalysis;
  fatalPhrases: {
    phrase: string;
    reason: string;
    topStaffResponse: string;
  }[];
  timeline: {
    start: string;
    end: string;
    phase: TimelinePhase;
    summary: string;
    aiComment: string;
  }[];
  patientType: {
    primary: string;
    secondary: string;
    proposalStrategy: string;
  };
  improvedScript: string;
  modelTalk: string;
  topStaffComparison: {
    item: string;
    current: number | string;
    topStaff: number | string;
    gap: string;
  }[];
};

export type Recording = {
  id: string;
  clinicName: string;
  staffName: string;
  patientType: string;
  status: "契約" | "失注" | "追客";
  score: number;
  contractProbability: number;
  createdAt: string;
};
