import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { getOpenAI, whisperModel } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 300;

const maxBytes = 50 * 1024 * 1024;
const openAiMaxBytes = 24 * 1024 * 1024;

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("音声変換機能を起動できませんでした。"));
      return;
    }

    const process = spawn(ffmpegPath, args);
    let stderr = "";
    process.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    process.on("error", reject);
    process.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`音声の分割に失敗しました。${stderr.slice(-500)}`));
    });
  });
}

async function transcribeFile(file: File) {
  const openai = getOpenAI();
  return openai.audio.transcriptions.create({
    file,
    model: whisperModel,
    language: "ja",
    response_format: "text"
  });
}

async function transcribeLargeFile(file: File) {
  const workDir = await mkdtemp(path.join(tmpdir(), "seitai-audio-"));
  const extension = path.extname(file.name).toLowerCase() || ".m4a";
  const inputPath = path.join(workDir, `input${extension}`);

  try {
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
    await runFfmpeg([
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-b:a",
      "64k",
      "-f",
      "segment",
      "-segment_time",
      "900",
      "-reset_timestamps",
      "1",
      path.join(workDir, "chunk-%03d.mp3")
    ]);

    const chunkNames = (await readdir(workDir))
      .filter((name) => name.startsWith("chunk-") && name.endsWith(".mp3"))
      .sort();

    if (chunkNames.length === 0) {
      throw new Error("音声を読み取れませんでした。ファイルが再生できるか確認してください。");
    }

    const transcripts: string[] = [];
    for (const [index, chunkName] of chunkNames.entries()) {
      const data = await readFile(path.join(workDir, chunkName));
      const chunk = new File([data], `part-${index + 1}.mp3`, { type: "audio/mpeg" });
      transcripts.push(await transcribeFile(chunk));
    }
    return transcripts.join("\n\n");
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

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

    const transcription = file.size > openAiMaxBytes
      ? await transcribeLargeFile(file)
      : await transcribeFile(file);

    return NextResponse.json({ text: transcription });
  } catch (error) {
    const message = error instanceof Error ? error.message : "文字起こしに失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
