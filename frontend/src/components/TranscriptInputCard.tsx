import { FileText } from "lucide-react";
import type { InputSource } from "../types";

type TranscriptInputCardProps = {
  transcriptText: string;
  inputSource: InputSource;
  isRecording: boolean;
  isLoading: boolean;
  setTranscriptText: (value: string) => void;
  setInputSource: (value: InputSource) => void;
  setAudioFile: (file: File | null) => void;
};

function TranscriptInputCard({
  transcriptText,
  inputSource,
  isRecording,
  isLoading,
  setTranscriptText,
  setInputSource,
  setAudioFile,
}: TranscriptInputCardProps) {
  return (
    <section
      className={`card transcript-section ${
        inputSource === "record" ||
        inputSource === "upload" ||
        isRecording
          ? "disabled-card"
          : ""
      }`}
    >
      <div className="card-title">
        <FileText className="blue-icon" size={30} />
        <h2>Paste Text Transcript</h2>
      </div>

      <div className="textarea-wrapper">
        <textarea
          className="main-textarea"
          placeholder="Paste your transcript here..."
          value={transcriptText}
          disabled={
            inputSource === "record" ||
            inputSource === "upload" ||
            isRecording ||
            isLoading
          }
          onChange={(e) => {
            const value = e.target.value;

            setTranscriptText(value);

            if (value.trim()) {
              setInputSource("text");
              setAudioFile(null);
            } else {
              setInputSource(null);
            }
          }}
        />

        <button
          type="button"
          className="clear-text-button"
          onClick={() => {
            setTranscriptText("");
            setInputSource(null);
          }}
          disabled={!transcriptText.trim()}
        >
          Clear
        </button>
      </div>

    </section>
  );
}

export default TranscriptInputCard;