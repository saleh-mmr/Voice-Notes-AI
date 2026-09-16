import {
  Mic,
  Upload,
  FileText,
  Settings,
  Sparkles,
  ChevronUp,
  Copy,
} from "lucide-react";
import { useState } from "react";
import "./App.css";

function Divider() {
  return (
    <div className="divider">
      <div className="divider-line"></div>
      <span>OR</span>
      <div className="divider-line"></div>
    </div>
  );
}


function App() {
  const [isDragging, setIsDragging] = useState(false);

  const handleAudioFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Please select an audio file.");
      return;
    }

    console.log("Selected audio:", file);

  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    handleAudioFile(file);
  };


  return (
    <main className="app">
      <div className="container">
        <header className="header">
          <h1>Super AI Transcript</h1>
          <p>Record audio or upload a file to transcribe with AI</p>
        </header>

        <section className="record-section">
          <button className="record-button">
            <Mic size={28} />
            <span>Start Recording</span>
          </button>

          <p className="record-hint">
            Hold <strong>"V"</strong> key to record
          </p>
        </section>

        <Divider />

      <section
        className={`upload-box ${isDragging ? "dragging" : ""}`}
        onClick={() => document.getElementById("audio-upload")?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.getElementById("audio-upload")?.click();
          }
        }}
      >
        <input
          type="file"
          id="audio-upload"
          accept="audio/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];

            handleAudioFile(file);

            // Allows selecting the same file again later
            e.target.value = "";
          }}
        />

        <Upload className="upload-icon" size={64} />

        <h2>
          {isDragging ? "Drop Audio File Here" : "Upload Audio File"}
        </h2>

        <p>
          {isDragging
            ? "Release to upload"
            : "Drag and drop or click to browse"}
        </p>

        <div className="formats">
          MP3, WAV, M4A, WebM, OGG
        </div>
      </section>

        <Divider />

        <section className="card">
          <div className="card-title">
            <FileText className="blue-icon" size={30} />
            <h2>Paste Text Transcript</h2>
          </div>

          <textarea
            className="main-textarea"
            placeholder="Paste your transcript here..."
          />

          <button className="process-button">
            Process Text
          </button>
        </section>

        <section className="card">
          <div className="card-title">
            <Settings className="blue-icon" size={28} />
            <h2>Settings</h2>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              defaultChecked
            />

            <div>
              <div className="checkbox-title">
                <Sparkles
                  size={18}
                  className="purple-icon"
                />

                <span>
                  Clean transcription with LLM
                </span>
              </div>

              <p className="checkbox-description">
                Use AI to clean up transcription
                (remove filler words, fix grammar)
              </p>
            </div>
          </label>

          <div className="select-group">
            <label htmlFor="systemPrompt">
              System Prompt
            </label>

            <select id="systemPrompt" defaultValue="default">
              <option value="default">
                Default Cleaner
              </option>

              <option value="formal">
                Formal Style
              </option>

              <option value="short">
                Short Summary Style
              </option>
            </select>
          </div>
        </section>

        <section className="card">
          <div className="result-header">
            <div className="card-title no-margin">
              <FileText
                className="blue-icon"
                size={30}
              />

              <h2>Original Transcription</h2>
            </div>

            <button className="collapse-button">
              <ChevronUp size={24} />
            </button>
          </div>

          <div className="result-box">
            Original transcription will appear here...
          </div>
        </section>

        <section className="card">
          <div className="card-title">
            <Sparkles
              className="blue-icon"
              size={30}
            />

            <h2>Cleaned Transcription</h2>
          </div>

          <div className="result-box cleaned-box">
            Cleaned transcription will appear here...
          </div>

          <button className="copy-button">
            <Copy size={20} />
            <span>Copy</span>
          </button>
        </section>
      </div>
    </main>
  );
}

export default App;