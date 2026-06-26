import { NextResponse } from "next/server";
import { getOpenAI, whisperModel } from "@/lib/openai";

export const runtime = "nodejs";

const maxBytes = 50 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "音声ファイルが見つかりません。" }, { status: 400 });
    }

    if (file.size > maxBytes) {
      return NextResponse.json({ error: "ファイルサイズは50MB以下にしてください。" }, { status: 413 });
    }

    if (!/\.(m4a|wav|mp3)$/i.test(file.name)) {
      return NextResponse.json({ error: "m4a、wav、mp3のみ対応しています。" }, { status: 400 });
    }

    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: whisperModel,
      language: "ja",
      response_format: "text"
    });

    return NextResponse.json({ text: transcription });
  } catch (error) {
    const message = error instanceof Error ? error.message : "文字起こしに失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
