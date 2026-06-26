# Seitai AI Coach

整体院向けのAI音声添削・教育・店舗分析SaaSです。iPhoneボイスメモの音声をアップロードし、Whisperで文字起こし、GPT-5.5で契約率、感情、話し方、失注要因、改善トークまで分析します。

## 主な機能

- Supabase Authによるオーナー、店長、スタッフ権限
- m4a、wav、mp3のドラッグ&ドロップアップロード
- Whisper API文字起こしと編集
- GPT-5.5による10項目採点、契約確率予測、感情分析、話し方分析
- 契約率を下げた発言トップ3とトップスタッフ返答
- 会話タイムライン、患者タイプ分析、改善例、模範トーク
- AIコーチ、次回接客シミュレーション
- 店舗、スタッフ、期間、契約、失注理由、点数での履歴分析
- Chart.jsによる契約率、平均点、トップスタッフ比較
- PWA manifest対応、スマホ最優先UI

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

`http://localhost:3000` を開きます。

## 環境変数

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key-for-admin-jobs
OPENAI_API_KEY=sk-your-openai-key
OPENAI_ANALYSIS_MODEL=gpt-5.5
OPENAI_WHISPER_MODEL=whisper-1
```

OpenAI APIキーはAPI Route内だけで使用し、ブラウザには公開しません。

## Supabase設定

1. Supabaseプロジェクトを作成します。
2. AuthenticationでEmailログインを有効化します。
3. SQL Editorで `supabase/schema.sql` を実行します。
4. Storageに `recordings` バケットを作成します。
5. 初期オーナーのauth userを作成し、`profiles` に `role = 'owner'` で登録します。

RLSは以下の方針です。

- オーナー、店長は同一組織内の店舗、スタッフ、録音、分析を閲覧可能
- スタッフは自分の録音と分析を閲覧、登録可能
- 店舗とスタッフ管理はオーナー、店長のみ
- 組織IDで全データを分離

## OpenAI設定

- `/api/transcribe` がWhisper APIを呼び出します。
- `/api/analyze` がGPT-5.5へJSON形式の分析を要求し、Zodで検証します。
- `/api/coach` と `/api/simulation` は自然言語相談と患者ロールプレイ用です。

利用可能なモデル名はOpenAIアカウントの提供状況に合わせて `OPENAI_ANALYSIS_MODEL` で変更してください。

## デプロイ

Vercelを推奨します。

```bash
npm run build
```

VercelのProject Settingsに `.env.local` と同じ環境変数を登録してください。SupabaseのSite URLとRedirect URLsには本番URLを追加します。

## 拡張設計

分析項目は整体院に最適化していますが、`lib/prompts.ts` と `lib/types.ts` の評価軸を差し替えることで、整骨院、美容サロン、歯科、営業会社、不動産、保険営業へ横展開できます。データ構造は `organizations / clinics / profiles / recordings / ai_analyses` に分け、業種別テンプレートを追加しやすい構成です。
