import { Upload } from "lucide-react";
import type { DragEvent } from "react";
import type { InputSource } from "../types";

type UploadAudioCardProps = {
  isDragging: boolean;
  inputSource: InputSource;
  isRecording: boolean;
  isLoading: boolean;
  audioFile: File | null;
  audioUrl: string | null;

  setIsDragging: (value: boolean) => void;
  handleDrop: (e: DragEvent<HTMLElement>) => void;
  handleAudioFile: (file: File | undefined) => void;
  removeAudioFile: () => void;
};

function UploadAudioCard({
  isDragging,
  inputSource,
  isRecording,
  isLoading,
  audioFile,
  audioUrl,
  setIsDragging,
  handleDrop,
  handleAudioFile,
  removeAudioFile,
}: UploadAudioCardProps) {
  return (
    <section
      className={`card upload-section
        ${isDragging ? "dragging" : ""}
        ${inputSource === "upload" ? "has-file" : ""}
        ${
          inputSource === "record" ||
          inputSource === "text" ||
          isRecording
            ? "disabled-card"
            : ""
        }
      `}
      onClick={() => {
        if (
          inputSource === "record" ||
          inputSource === "text" ||
          isRecording ||
          isLoading
        ) {
          return;
        }

        if (inputSource !== "upload") {
          document.getElementById("audio-upload")?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (
          inputSource === "record" ||
          inputSource === "text" ||
          isRecording
        ) {
          return;
        }

        setIsDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (
          inputSource === "record" ||
          inputSource === "text" ||
          isRecording
        ) {
          return;
        }

        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        if (
          inputSource === "record" ||
          inputSource === "text" ||
          isRecording
        ) {
          e.preventDefault();
          return;
        }

        handleDrop(e);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (
          !audioFile &&
          (e.key === "Enter" || e.key === " ")
        ) {
          e.preventDefault();
          document.getElementById("audio-upload")?.click();
        }
      }}
    >
      <div className="card-title">
        <Upload className="blue-icon" size={30} />
        <h2>Upload Audio</h2>
      </div>

      <input
        type="file"
        id="audio-upload"
        accept="audio/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          handleAudioFile(file);
          e.target.value = "";
        }}
      />

      {inputSource === "upload" && audioFile ? (
        <>
          <h2>{audioFile.name}</h2>

          <p>
            {(audioFile.size / 1024 / 1024).toFixed(2)} MB
          </p>

          <div className="formats">
            {audioFile.type || "Audio file"}
          </div>

          {audioUrl && (
            <audio
              controls
              src={audioUrl}
              onClick={(e) => e.stopPropagation()}
              className="audio-preview"
            />
          )}

          <div
            className="audio-actions"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                document.getElementById("audio-upload")?.click();
              }}
            >
              Replace
            </button>

            <button
              type="button"
              onClick={removeAudioFile}
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <>
          <Upload className="upload-icon" size={64} />

          <h2>
            {isDragging
              ? "Drop Audio File Here"
              : "Choose an audio file"}
          </h2>

          <p>
            {isDragging
              ? "Release to upload"
              : "Drag and drop or click to browse"}
          </p>

          <div className="formats">
            MP3, WAV, M4A, WebM, OGG
          </div>
        </>
      )}
    </section>
  );
}

export default UploadAudioCard;