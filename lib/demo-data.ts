import type { AnalysisResult, Recording } from "@/lib/types";

export const demoRecordings: Recording[] = [
  { id: "r-001", clinicName: "表参道整体ラボ", staffName: "佐藤 葵", patientType: "慎重派", status: "契約", score: 88, contractProbability: 82, createdAt: "2026-06-25T09:30:00+09:00" },
  { id: "r-002", clinicName: "表参道整体ラボ", staffName: "田中 蓮", patientType: "価格重視", status: "失注", score: 64, contractProbability: 38, createdAt: "2026-06-25T11:10:00+09:00" },
  { id: "r-003", clinicName: "新宿ウェルネス整体", staffName: "山本 凛", patientType: "論理派", status: "追客", score: 76, contractProbability: 61, createdAt: "2026-06-24T17:40:00+09:00" },
  { id: "r-004", clinicName: "新宿ウェルネス整体", staffName: "佐藤 葵", patientType: "症状改善重視", status: "契約", score: 91, contractProbability: 89, createdAt: "2026-06-24T13:05:00+09:00" }
];

export const demoAnalysis: AnalysisResult = {
  overallScore: 78,
  scores: {
    empathy: { score: 84, reason: "痛みへの受け止めが自然で、患者の不安を否定しませんでした。" },
    interview: { score: 80, reason: "主訴と発症時期は確認できていますが、仕事動作の深掘りが不足しています。" },
    lifeContext: { score: 70, reason: "睡眠、育児、移動時間など生活背景の把握が浅めでした。" },
    inspection: { score: 74, reason: "検査結果は伝えていますが、患者が納得する比較表現があると良いです。" },
    causeExplanation: { score: 76, reason: "原因仮説は明確ですが、専門語が少し続いていました。" },
    treatmentValue: { score: 81, reason: "施術の価値は伝わっています。再発予防価値を加えるとさらに強くなります。" },
    futureVision: { score: 73, reason: "改善後の生活イメージが短く、患者の望む未来との接続が弱いです。" },
    pricing: { score: 68, reason: "料金説明がやや事務的で、価値との順番が逆になりました。" },
    closing: { score: 72, reason: "提案はできていますが、迷いへの確認質問が不足しました。" },
    trust: { score: 82, reason: "誠実な言い回しで信頼を損なう表現は少なかったです。" }
  },
  goodPoints: ["痛みの不安を受け止める初動が良い", "検査から原因説明までの流れが自然", "強引な販売感が少ない"],
  improvementPoints: ["生活背景をあと2問深掘りする", "料金前に施術価値と改善未来を再提示する", "最後に患者の迷いを言語化して確認する"],
  improvementReasons: ["患者は価格ではなく納得不足で迷いやすいため", "価値の再提示があると料金が投資として理解されるため", "沈黙した迷いを放置すると家族相談に流れやすいため"],
  improvedExamples: [
    "今の痛みを取るだけでなく、朝起きた時に腰を気にせず動ける状態まで一緒に作る計画です。",
    "金額だけ見ると迷いますよね。今日の検査結果から見ると、放置した場合の戻りやすさを減らすことが一番大事です。",
    "ここまでで、料金以外に気になっている点はありますか？遠慮なく言ってください。"
  ],
  nextFocus: ["生活背景の質問を3つ準備する", "料金説明前に価値を一文でまとめる", "クロージング前に不安確認を入れる"],
  contractPrediction: {
    probability: 62,
    reason: "信頼形成はできていますが、料金提示前の価値再確認と迷いの解消が不足しました。",
    positiveFactors: ["共感が自然", "説明が誠実", "検査結果が会話に入っている"],
    negativeFactors: ["価格への心理的抵抗を先回りできていない", "家族相談への切り返しが弱い"],
    improvedProbability: 78
  },
  emotions: {
    confidence: { score: 76, reason: "語尾は安定していますが、料金説明で少し弱くなりました。" },
    nervousness: { score: 35, reason: "沈黙後に早口になる場面がありました。" },
    impatience: { score: 28, reason: "急かす表現は少ないです。" },
    empathy: { score: 83, reason: "患者の不安を反復できています。" },
    safety: { score: 80, reason: "否定や断定が少なく安心感があります。" },
    trust: { score: 82, reason: "検査に基づく説明が信頼につながっています。" },
    pushiness: { score: 22, reason: "押し売り感は低い一方で、提案の強さもやや弱いです。" },
    energy: { score: 71, reason: "落ち着いていますが、改善未来を語る熱量が不足しました。" },
    sincerity: { score: 88, reason: "患者目線の言葉が多く誠実です。" },
    patientUnderstanding: { score: 67, reason: "患者の納得確認が終盤で不足しています。" }
  },
  talkAnalysis: {
    staffTalkRatio: 68,
    patientTalkRatio: 32,
    speechSpeed: "やや速い",
    silenceSeconds: 34,
    pauseQuality: "料金提示後の間は良いが、その後の確認が不足",
    interruptions: 2,
    monologueSeconds: 142,
    questionCount: 18,
    empathyCount: 9,
    confirmationQuestionCount: 4,
    fillers: [{ word: "ですね", count: 18 }, { word: "えー", count: 7 }, { word: "なんか", count: 3 }],
    improvement: "説明が80秒を超えたら一度『ここまで大丈夫ですか？』を入れると納得度が上がります。"
  },
  fatalPhrases: [
    { phrase: "とりあえず通ってみますか？", reason: "提案の根拠が弱く、患者に判断を丸投げしています。", topStaffResponse: "今日の検査だと、最初の4週間で戻りにくい土台を作るのが最短です。まずは週1回で始めましょう。" },
    { phrase: "高いと感じる方もいます", reason: "価値提示前に価格抵抗を強めています。", topStaffResponse: "料金はこの計画で再発を減らすための投資です。今日の状態なら、ここに集中する価値があります。" },
    { phrase: "ご家族と相談でも大丈夫です", reason: "不安の中身を聞かずに失注導線を作っています。", topStaffResponse: "もちろん相談は大切です。ご家族に説明するとしたら、どの点が一番気になりそうですか？" }
  ],
  timeline: [
    { start: "00:00", end: "03:40", phase: "問診", summary: "主訴と来院背景を確認", aiComment: "痛みの頻度と困りごとは良い。生活背景を追加すると提案精度が上がります。" },
    { start: "03:40", end: "06:10", phase: "検査", summary: "可動域と姿勢検査", aiComment: "検査前後の違いを患者の言葉で確認すると納得が深まります。" },
    { start: "06:10", end: "10:20", phase: "原因説明", summary: "骨盤と股関節の連動を説明", aiComment: "専門語が続いたため比喩を1つ入れると伝わりやすいです。" },
    { start: "10:20", end: "13:30", phase: "料金説明", summary: "回数券と通院頻度を説明", aiComment: "料金前に改善未来を再提示してください。" },
    { start: "13:30", end: "15:00", phase: "クロージング", summary: "次回予約を提案", aiComment: "迷いの確認質問を入れると契約確率が上がります。" }
  ],
  patientType: {
    primary: "慎重派",
    secondary: "価格重視",
    proposalStrategy: "検査結果、放置リスク、初月の具体計画を短く整理し、料金は『何に対する投資か』を先に示す。"
  },
  improvedScript: "今日の検査を見ると、痛みの場所だけでなく股関節の動きが腰に負担をかけています。まず4週間でこの負担を減らして、朝の起き上がりを楽にするところを一緒に目指しましょう。料金で迷うのは自然です。どの部分が一番気になりますか？",
  modelTalk: "スタッフ: 今日一番不安なのは、痛みが続くことですか？それともまた悪化することですか？\n患者: また戻るのが心配です。\nスタッフ: そこが大事ですね。今日の検査では、腰だけでなく股関節の動きが戻りやすさに関係していました。なので施術は痛みを軽くするだけではなく、戻りにくい動きを作る計画で進めます。",
  topStaffComparison: [
    { item: "共感", current: 84, topStaff: 92, gap: "感情の反復後に生活影響まで聞く" },
    { item: "質問量", current: 18, topStaff: 28, gap: "生活背景と意思決定者の確認が不足" },
    { item: "話す割合", current: "68:32", topStaff: "55:45", gap: "説明ごとに患者の理解確認を挟む" },
    { item: "料金説明", current: 68, topStaff: 90, gap: "価値、計画、料金の順番にする" },
    { item: "契約率", current: "62%", topStaff: "84%", gap: "不安確認と次回予約の言い切り" }
  ]
};
