import OpenAI from "openai";

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI APIキーが未設定です。Vercelの環境変数にOPENAI_API_KEYを追加してください。");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export const analysisModel = process.env.OPENAI_ANALYSIS_MODEL ?? "gpt-5.5";
export const whisperModel = process.env.OPENAI_WHISPER_MODEL ?? "whisper-1";
