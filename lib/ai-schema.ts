import { z } from "zod";

const scoreReason = z.object({
  score: z.number().min(0).max(100),
  reason: z.string()
});

export const analysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  scores: z.record(scoreReason),
  goodPoints: z.array(z.string()),
  improvementPoints: z.array(z.string()),
  improvementReasons: z.array(z.string()),
  improvedExamples: z.array(z.string()),
  nextFocus: z.array(z.string()),
  contractPrediction: z.object({
    probability: z.number().min(0).max(100),
    reason: z.string(),
    positiveFactors: z.array(z.string()),
    negativeFactors: z.array(z.string()),
    improvedProbability: z.number().min(0).max(100)
  }),
  emotions: z.record(scoreReason),
  talkAnalysis: z.object({
    staffTalkRatio: z.number().min(0).max(100),
    patientTalkRatio: z.number().min(0).max(100),
    speechSpeed: z.string(),
    silenceSeconds: z.number().min(0),
    pauseQuality: z.string(),
    interruptions: z.number().min(0),
    monologueSeconds: z.number().min(0),
    questionCount: z.number().min(0),
    empathyCount: z.number().min(0),
    confirmationQuestionCount: z.number().min(0),
    fillers: z.array(z.object({ word: z.string(), count: z.number().min(0) })),
    improvement: z.string()
  }),
  fatalPhrases: z.array(z.object({
    phrase: z.string(),
    reason: z.string(),
    topStaffResponse: z.string()
  })).length(3),
  timeline: z.array(z.object({
    start: z.string(),
    end: z.string(),
    phase: z.string(),
    summary: z.string(),
    aiComment: z.string()
  })),
  patientType: z.object({
    primary: z.string(),
    secondary: z.string(),
    proposalStrategy: z.string()
  }),
  improvedScript: z.string(),
  modelTalk: z.string(),
  topStaffComparison: z.array(z.object({
    item: z.string(),
    current: z.union([z.number(), z.string()]),
    topStaff: z.union([z.number(), z.string()]),
    gap: z.string()
  }))
});
