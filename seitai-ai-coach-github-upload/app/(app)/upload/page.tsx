import { PageHeader } from "@/components/dashboard/page-header";
import { Uploader } from "@/components/upload/uploader";

export default function UploadPage() {
  return (
    <div>
      <PageHeader
        title="AI音声添削"
        description="初回カウンセリング音声をアップロードし、Whisper文字起こし後にGPT-5.5で契約率と教育ポイントを分析します。"
      />
      <div className="px-4 pb-10 sm:px-6 lg:px-8">
        <Uploader />
      </div>
    </div>
  );
}
