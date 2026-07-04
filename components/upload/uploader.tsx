"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, FileAudio, Loader2, PlayCircle, UploadCloud } from "lucide-react";
import { AnalysisPanel } from "@/components/upload/analysis-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { demoAnalysis } from "@/lib/demo-data";
import type { LearningProfile } from "@/lib/learning";
import type { AnalysisResult } from "@/lib/types";

const allowed = ["audio/mp4", "audio/mpeg", "audio/wav", "audio/x-m4a", "audio/aac"];
const browserSplitThreshold = 20 * 1024 * 1024;
const maxUploadBytes = 100 * 1024 * 1024;
const loadingMessages = [
  "🎙️ 音声を解析しています...",
  "✍️ 文字起こし中...",
  "🧠 GPT-5.5が分析しています...",
  "📊 契約率を予測しています...",
  "✨ 改善例を作成しています...",
  "分析完了"
];

export function Uploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisSource, setAnalysisSource] = useState<"demo" | "ai">("ai");
  const [loading, setLoading] = useState<"transcribe" | "analyze" | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [staffName, setStaffName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const timer = window.setInterval(() => {
      setLoadingStep((current) => Math.min(current + 1, loadingMessages.length - 2));
    }, 1100);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    void fetch("/api/me")
      .then(async (response) => {
        if (!response.ok) throw new Error("プロフィールを取得できませんでした。");
        return response.json();
      })
      .then((json) => {
        setStaffName(String(json.profile?.fullName ?? ""));
        setClinicName(String(json.profile?.clinicName ?? ""));
        setLearningProfile((json.learning ?? null) as LearningProfile | null);
      })
      .catch(() => setError("ログイン情報を取得できませんでした。再ログインしてください。"));
  }, []);

  function selectFile(nextFile?: File) {
    setError("");
    if (!nextFile) return;
    const extensionOk = /\.(m4a|wav|mp3)$/i.test(nextFile.name);
    if (!extensionOk && !allowed.includes(nextFile.type)) {
      setError("m4a、wav、mp3形式の音声をアップロードしてください。");
      return;
    }
    if (nextFile.size > maxUploadBytes) {
      setError("ファイルサイズは100MB以下にしてください。");
      return;
    }
    setFile(nextFile);
    setCompleted(false);
    setAnalysis(null);
  }

  async function requestTranscription() {
    if (!file) return transcript;
    setLoading("transcribe");
    setError("");
    const text = file.size > browserSplitThreshold
      ? await requestBrowserSplitTranscription(file)
      : await requestTranscriptionFile(file);
    setTranscript(text);
    return text;
  }

  async function requestTranscriptionFile(audioFile: File) {
    const formData = new FormData();
    formData.append("file", audioFile);
    const response = await fetch("/api/transcribe", { method: "POST", body: formData });
    const raw = await response.text();
    let json: { text?: string; error?: string };
    try {
      json = JSON.parse(raw) as { text?: string; error?: string };
    } catch {
      throw new Error("音声の送信が途中で停止しました。再度お試しください。");
    }
    if (!response.ok) {
      throw new Error(json.error ?? "文字起こしに失敗しました。OpenAI APIキーと音声形式を確認してください。");
    }
    return String(json.text ?? "");
  }

  async function requestBrowserSplitTranscription(audioFile: File) {
    const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util")
    ]);
    const ffmpeg = new FFmpeg();
    const coreBaseUrl = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
    const extension = audioFile.name.split(".").pop()?.toLowerCase() || "m4a";
    const inputName = `input.${extension}`;

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${coreBaseUrl}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${coreBaseUrl}/ffmpeg-core.wasm`, "application/wasm")
      });
      await ffmpeg.writeFile(inputName, await fetchFile(audioFile));
      const exitCode = await ffmpeg.exec([
        "-i", inputName,
        "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k",
        "-f", "segment", "-segment_time", "300", "-reset_timestamps", "1",
        "chunk-%03d.mp3"
      ]);
      if (exitCode !== 0) throw new Error("音声の分割に失敗しました。");

      const entries = await ffmpeg.listDir("/");
      const chunkNames = entries
        .filter((entry) => !entry.isDir && entry.name.startsWith("chunk-") && entry.name.endsWith(".mp3"))
        .map((entry) => entry.name)
        .sort();
      if (!chunkNames.length) throw new Error("音声を分割できませんでした。");

      const texts: string[] = [];
      for (const [index, chunkName] of chunkNames.entries()) {
        const data = await ffmpeg.readFile(chunkName);
        if (typeof data === "string") throw new Error("分割音声を読み込めませんでした。");
        const bytes = Uint8Array.from(data);
        const chunk = new File([bytes], `part-${index + 1}.mp3`, { type: "audio/mpeg" });
        texts.push(await requestTranscriptionFile(chunk));
      }
      return texts.join("\n\n");
    } finally {
      ffmpeg.terminate();
    }
  }

  async function requestAnalysis(nextTranscript: string) {
    setLoading("analyze");
    setError("");
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: nextTranscript,
        memo,
        fileName: file?.name ?? ""
      })
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? "AI分析に失敗しました。OpenAI APIキーとモデル設定を確認してください。");
    }
    const nextAnalysis = json.analysis as AnalysisResult;
    setLearningProfile((json.learning ?? null) as LearningProfile | null);
    setAnalysis(nextAnalysis);
    setAnalysisSource("ai");
  }

  async function startCorrection() {
    if (!file) return;
    if (completed) {
      document.getElementById("analysis-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    try {
      setAnalysis(null);
      setCompleted(false);
      const nextTranscript = transcript.trim().length > 5 ? transcript : await requestTranscription();
      await requestAnalysis(nextTranscript);
      setLoadingStep(loadingMessages.length - 1);
      setCompleted(true);
      window.setTimeout(() => {
        document.getElementById("analysis-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 650);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "処理に失敗しました。";
      setError(message);
      setCompleted(false);
      setAnalysis(null);
    } finally {
      setLoading(null);
    }
  }

  const currentStep = completed ? 4 : loading === "analyze" ? 3 : transcript ? 2 : file ? 1 : 0;
  const primaryButtonText = !file
    ? "音声をアップロードしてください"
    : loading
      ? "分析中..."
      : completed
        ? "添削結果を見る"
        : "AI添削を開始";
  const progressValue = loading ? Math.min(95, (loadingStep + 1) * 17) : completed ? 100 : currentStep * 25;

  function transcriptOnly() {
    void requestTranscription()
      .catch((caught) => {
        const message = caught instanceof Error ? caught.message : "文字起こしに失敗しました。";
        setError(message);
      })
      .finally(() => setLoading(null));
  }

  function showSampleResult() {
    setError("");
    setLoading(null);
    setAnalysis(demoAnalysis);
    setAnalysisSource("demo");
    setCompleted(true);
    window.setTimeout(() => {
      document.getElementById("analysis-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  }

  async function resetLearning() {
    const response = await fetch("/api/me", { method: "DELETE" });
    if (response.ok) setLearningProfile(null);
  }

  return (
    <div className="space-y-5">
      <StepProgress currentStep={currentStep} />
      <LearningMemoryCard profile={learningProfile} onReset={resetLearning} />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>音声アップロード</CardTitle>
            <Badge tone={analysisSource === "ai" ? "success" : "warning"}>{analysisSource === "ai" ? "実分析モード" : "サンプル表示"}</Badge>
          </div>
          <CardDescription>iPhoneボイスメモのm4a、wav、mp3に対応。録音機能は不要です。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            この画面は実際のAI添削モードです。音声はサーバー側でWhisper文字起こし後、OpenAI APIに送信して分析します。
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={staffName} readOnly aria-label="ログイン中のスタッフ" />
            <Input value={clinicName} readOnly aria-label="所属店舗" />
          </div>
          <div
            onDrop={(event) => {
              event.preventDefault();
              selectFile(event.dataTransfer.files[0]);
            }}
            onDragOver={(event) => event.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="grid min-h-48 cursor-pointer place-items-center rounded-2xl border border-dashed bg-white p-6 text-center transition duration-200 hover:bg-muted active:scale-[0.99]"
          >
            <input ref={inputRef} type="file" accept=".m4a,.wav,.mp3,audio/*" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} />
            <div>
              <UploadCloud className="mx-auto size-11 text-primary" />
              <p className="mt-3 text-base font-semibold">ドラッグ&ドロップまたはタップして選択</p>
              <p className="mt-1 text-sm text-muted-foreground">患者名など個人情報の扱いに注意してください。</p>
            </div>
          </div>
          {file ? (
            <div className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <FileAudio className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024 / 1024 * 10) / 10} MB</p>
                  {file.size > 24 * 1024 * 1024 ? (
                    <p className="mt-1 text-xs text-amber-700">大容量音声のため、自動で軽量化・分割して処理します。画面を閉じずにお待ちください。</p>
                  ) : null}
                </div>
              </div>
              <Button variant="outline" onClick={transcriptOnly} disabled={loading !== null}>
                {loading === "transcribe" ? <Loader2 className="size-4 animate-spin" /> : null}
                文字起こし
              </Button>
            </div>
          ) : null}
          <Button className="h-14 w-full text-base" onClick={startCorrection} disabled={!file || loading !== null}>
            {loading ? <Loader2 className="size-5 animate-spin" /> : completed ? <CheckCircle2 className="size-5" /> : null}
            {primaryButtonText}
          </Button>
          {demoEnabled ? (
            <Button variant="ghost" className="w-full" onClick={showSampleResult} disabled={loading !== null}>
              <PlayCircle className="size-5" />
              サンプル結果だけ確認する
            </Button>
          ) : null}
          {error ? <p className="rounded-2xl bg-rose-50 p-4 text-sm leading-6 text-danger">{error}</p> : null}
        </CardContent>
      </Card>
      {loading ? <LoadingStatus message={loadingMessages[loadingStep]} progress={progressValue} /> : null}
      {completed ? <SuccessBanner source={analysisSource} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>文字起こし編集</CardTitle>
          <CardDescription>AI分析前に話者名や聞き間違いを修正できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="文字起こし結果がここに入ります。" className="min-h-64" />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="失注理由メモ 任意" />
            <Button onClick={startCorrection} disabled={!file || loading !== null || transcript.length < 5}>
              {loading === "analyze" ? <Loader2 className="size-4 animate-spin" /> : null}
              再分析する
            </Button>
          </div>
        </CardContent>
      </Card>
      {analysis ? <AnalysisPanel analysis={analysis} source={analysisSource} /> : null}
    </div>
  );
}

function LearningMemoryCard({ profile, onReset }: { profile: LearningProfile | null; onReset: () => void }) {
  return (
    <Card className="border-primary/15 bg-white">
      <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">学習メモリ</Badge>
            <span className="text-xs text-muted-foreground">スタッフごとの添削傾向を安全に共有保存します</span>
          </div>
          {profile ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-muted p-3">
                <p className="text-xs font-semibold text-muted-foreground">分析件数</p>
                <p className="mt-1 text-2xl font-bold">{profile.totalAnalyses}件</p>
              </div>
              <div className="rounded-2xl bg-muted p-3">
                <p className="text-xs font-semibold text-muted-foreground">過去平均点</p>
                <p className="mt-1 text-2xl font-bold">{Math.round(profile.averageScore)}点</p>
              </div>
              <div className="rounded-2xl bg-muted p-3">
                <p className="text-xs font-semibold text-muted-foreground">平均契約確率</p>
                <p className="mt-1 text-2xl font-bold">{Math.round(profile.averageContractProbability)}%</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              まだ学習データはありません。最初の音声を分析すると、次回から弱点の繰り返しや改善傾向を踏まえた添削になります。
            </p>
          )}
          {profile?.repeatedWeaknesses.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.repeatedWeaknesses.slice(0, 3).map((item) => (
                <Badge key={item.text} tone="warning">{item.text} {item.count}回</Badge>
              ))}
            </div>
          ) : null}
        </div>
        <Button variant="outline" onClick={onReset} disabled={!profile}>学習をリセット</Button>
      </CardContent>
    </Card>
  );
}

function StepProgress({ currentStep }: { currentStep: number }) {
  const steps = ["音声アップロード", "文字起こし", "AI分析", "添削結果"];

  return (
    <Card className="sticky top-2 z-20 bg-white/90 backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const active = currentStep === index + 1 || (currentStep === 0 && index === 0);
            const done = currentStep > index + 1;
            return (
              <div key={step} className="min-w-0">
                <div className={active ? "rounded-2xl bg-primary p-3 text-white transition" : done ? "rounded-2xl bg-emerald-50 p-3 text-primary transition" : "rounded-2xl bg-muted p-3 text-muted-foreground transition"}>
                  <div className="mx-auto grid size-7 place-items-center rounded-full bg-white/20 text-xs font-bold">
                    {done ? <Check className="size-4" /> : index + 1}
                  </div>
                  <p className="mt-2 truncate text-center text-[11px] font-semibold sm:text-sm">{step}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingStatus({ message, progress }: { message: string; progress: number }) {
  return (
    <Card className="border-primary/20 bg-white">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
          <div>
            <p className="text-base font-bold">{message}</p>
            <p className="text-sm text-muted-foreground">音声、会話内容、契約確率、改善トークを順番に確認しています。</p>
          </div>
        </div>
        <Progress value={progress} />
      </CardContent>
    </Card>
  );
}

function SuccessBanner({ source }: { source: "demo" | "ai" }) {
  return (
    <div className="animate-success-pop rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-full bg-primary text-white">
          <CheckCircle2 className="size-7" />
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-950">AI分析が完了しました</p>
          <p className="text-sm text-emerald-800">{source === "ai" ? "実際のAI分析結果を表示しています。" : "サンプルデータを表示しています。実在の患者・スタッフ情報ではありません。"}</p>
        </div>
      </div>
    </div>
  );
}
