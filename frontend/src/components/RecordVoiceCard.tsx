import { Mic } from "lucide-react";
import RecordingWave from "./RecordingWave";
import type { InputSource } from "../types";

type RecordVoiceCardProps = {
  isRecording: boolean;
  isLoading: boolean;
  inputSource: InputSource;
  audioFile: File | null;
  audioUrl: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  removeAudioFile: () => void;
};

function RecordVoiceCard({
  isRecording,
  isLoading,
  inputSource,
  audioFile,
  audioUrl,
  startRecording,
  stopRecording,
  removeAudioFile,
}: RecordVoiceCardProps) {
  return (
    <section
      className={`card record-section ${
        inputSource === "upload" || inputSource === "text"
          ? "disabled-card"
          : ""
      }`}
    >
      <div className="card-title">
        <Mic className="blue-icon" size={30} />
        <h2>Record Voice</h2>
      </div>

      <button
        className={`record-button ${isRecording ? "recording" : ""}`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={
          isLoading ||
          inputSource === "upload" ||
          inputSource === "text"
        }
      >
        {isRecording ? <RecordingWave /> : <Mic size={28} />}

        <span>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </span>
      </button>

      <p className="record-hint">
        Hold <strong>"V" </strong>key to record
      </p>

      {inputSource === "record" && audioFile && (
        <div className="recorded-preview">
          <p className="audio-file-name">
            {audioFile.name}
          </p>

          {audioUrl && (
            <audio
              controls
              src={audioUrl}
              className="audio-preview"
            />
          )}

          <button
            type="button"
            className="remove-audio-button"
            onClick={removeAudioFile}
          >
            Remove
          </button>
        </div>
      )}
    </section>
  );
}

export default RecordVoiceCard;