import { useState } from "react";
import {
  Mic,
  Upload,
  FileText,
  Settings,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Copy,
} from "lucide-react";
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
  const [textTranscript, setTextTranscript] = useState("");

  const [enableCleaning, setEnableCleaning] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("default");
  const [originalTranscript, setOriginalTranscript] = useState("");
  const [cleanedTranscript, setCleanedTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);

  function cleanTranscript(input: string) {
    let output = input;
    output = output.trim();
    return "";
    }

  function handleProcessText() {
    if (!textTranscript.trim()) {
      alert("Please paste some transcript text first.");
      return;
    }

    setIsProcessing(true);
    setOriginalTranscript(textTranscript);
    setCleanedTranscript("");

    setTimeout(() => {
      if (enableCleaning) {
        setCleanedTranscript(cleanTranscript(textTranscript));
      } else {
        setCleanedTranscript(textTranscript);
      }

      setIsProcessing(false);
    }, 1500);
  }



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

        <section className="upload-box">
          <Upload className="upload-icon" size={64} />
          <h2>Upload Audio File</h2>
          <p>Drag and drop or click to browse</p>
          <div className="formats">MP3, WAV, M4A, WebM, OGG</div>
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
            value={textTranscript}
            onChange={(e) => setTextTranscript(e.target.value)}
          />

          <button className="process-button" onClick={handleProcessText}>
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
              checked={enableCleaning}
              onChange={(e) => setEnableCleaning(e.target.checked)}
            />

            <div>
              <div className="checkbox-title">
                <Sparkles size={18} className="purple-icon" />
                <span>Clean transcription with LLM</span>
              </div>
              <p className="checkbox-description">
                Use AI to clean up transcription (remove filler words, fix grammar)
              </p>
            </div>
          </label>

          <div className="select-group">
            <label htmlFor="systemPrompt">System Prompt</label>
            <select
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            >
              <option value="default">Default Cleaner</option>
              <option value="formal">Formal Style</option>
              <option value="short">Short Summary Style</option>
            </select>
          </div>
        </section>

        {originalTranscript && (
          <section className="card">
            <div className="result-header">
              <div className="card-title no-margin">
                <FileText className="blue-icon" size={30} />
                <h2>Original Transcription</h2>
              </div>

              <button
                className="collapse-button"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                {showOriginal ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
            </div>

            {showOriginal && (
              <div className="result-box">
                {originalTranscript}
              </div>
            )}
          </section>
        )}

        {(isProcessing || cleanedTranscript) && (
          <section className="card">
            <div className="card-title">
              <Sparkles className="blue-icon" size={30} />
              <h2>Cleaned Transcription</h2>
            </div>

            <div className="result-box cleaned-box">
              {isProcessing ? (
                <div className="loading-wrapper">
                  <div className="spinner"></div>
                </div>
              ) : (
                cleanedTranscript
              )}
            </div>

            {!isProcessing && cleanedTranscript && (
              <button className="copy-button" >
                <Copy size={20} />
                <span>Copy</span>
              </button>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default App;