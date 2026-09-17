import {
  Mic,
  Upload,
  FileText,
  Settings,
  Sparkles,
  ChevronUp,
  Copy,
} from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
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
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!audioFile) {
      setAudioUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };  
  }, [audioFile]);


  const handleAudioFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      alert("Please select an audio file.");
      return;
    }
    setAudioFile(file);
  };
  
  const removeAudioFile = () => {
    setAudioFile(null);
    const input = document.getElementById("audio-upload") as HTMLInputElement | null; // we have e.target.value = ""; in the onChange handler, so these lines are optional
    if (input) {
      input.value = "";
    }
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();   // Don't let the browser open the dropped file
    e.stopPropagation();  // Don't send this event to parent elements
    setIsDragging(false); // The user has finished dragging
    const file = e.dataTransfer.files?.[0]; // Get the first file from the dropped files
    handleAudioFile(file); // Validate and process the dropped file
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
        className={`upload-box ${isDragging ? "dragging" : ""} ${       // when isDragging is true, className will be "upload-box dragging", otherwise it will be just "upload-box"
          audioFile ? "has-file" : ""        // when audioFile is not null, className will include "has-file"
        }`}
        onClick={() => {
          if (!audioFile) {
            document.getElementById("audio-upload")?.click();
          }
        }}
        
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
        onDrop={handleDrop}   // When a file is dropped, handleDrop will be called to process the file
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!audioFile && (e.key === "Enter" || e.key === " ")) {
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
            const file = e.target.files?.[0]; // e.target refers to the input element, and files is a FileList containing the selected files. The code retrieves the first file from this list.
            handleAudioFile(file);
            e.target.value = "";            // Allows selecting the same file again later
          }}
        />

        {audioFile ? (
          //  If an audio file has been uploaded, display its name, size, and type
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
              className="audio-preview"/>)}

            <div className="audio-actions" onClick={(e) => e.stopPropagation()}>

            <button type="button"
              onClick={() => {
                document.getElementById("audio-upload")?.click();
              }}>
              Replace
            </button>

            <button type="button" onClick={removeAudioFile}>
              Remove
            </button>
          </div>
          </>
        ) : (
          // If no audio file has been uploaded, display instructions for uploading
          <>
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
          </>
        )}


        
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