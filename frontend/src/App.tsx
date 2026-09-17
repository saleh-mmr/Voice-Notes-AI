import {
  Mic,
  Upload,
  FileText,
  Settings,
  Sparkles,
  ChevronUp,
  Copy,
  LoaderCircle,
} from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import "./App.css";


function RecordingWave() {
  return (
    <div className="recording-wave" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [cleanWithLLM, setCleanWithLLM] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("default");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const [cleanedTranscript, setCleanedTranscript] = useState("");
  const [inputSource, setInputSource] = useState<"record" | "upload" | "text" | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const vHoldTimerRef = useRef<number | null>(null);

  useEffect(() => { // This effect runs whenever the audioFile state changes. It creates a URL for the audio file so it can be played in the browser.
    if (!audioFile) {
      setAudioUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioFile); // This creates a temporary URL that points to the audio file, allowing it to be used as a source for an <audio> element.
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
    setInputSource("upload");
    setTranscriptText("");
  };
  
  const removeAudioFile = () => {
    setAudioFile(null);
    setInputSource(null);

    const input = document.getElementById(
      "audio-upload"
    ) as HTMLInputElement | null;

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

  const startRecording = async () => {   // Because the browser needs the user's permission, this operation is asynchronous.
    try {   // If permission is granted:
      const stream = await navigator.mediaDevices.getUserMedia({ // stream becomes a MediaStream containing audio coming from the microphone.
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream); // MediaRecorder is a built-in browser API that allows recording audio streams. It takes a MediaStream as input and provides methods to start and stop recording, as well as events to handle the recorded data.
      audioChunksRef.current = []; // clear old audio chunks before starting a new recording
      
      mediaRecorder.ondataavailable = (event) => { // This event is fired when the MediaRecorder has audio data available. The event contains a Blob of audio data.
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data); // Store the audio data in the audioChunksRef array for later processing.
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        const extension = mediaRecorder.mimeType.includes("mp4")
          ? "m4a"
          : mediaRecorder.mimeType.includes("ogg")
            ? "ogg"
            : "webm";

        const recordedFile = new File(
          [audioBlob],
          `recording-${Date.now()}.${extension}`,
          {
            type: mediaRecorder.mimeType,
          }
        );

        setAudioFile(recordedFile);
        setInputSource("record");
        setTranscriptText("");

        audioChunksRef.current = [];
      };
      mediaRecorderRef.current = mediaRecorder;   // Store the MediaRecorder instance in a ref so we can access it later when stopping the recording.
      mediaRecorder.start(); // Start recording the audio stream. The MediaRecorder will now capture audio data from the microphone.
      setIsRecording(true);   // Update the state to indicate that recording is in progress.

      } catch (error) {        // If the user rejects permission
      console.error("Microphone access failed:", error);
    }
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current; // Retrieve the MediaRecorder instance from the ref. If it's null, it means recording hasn't started yet, so we return early.
    if (!mediaRecorder || mediaRecorder.state === "inactive") {   // MediaRecorder has states such as: inactive, recording, paused. Calling stop() on an inactive MediaRecorder will throw an error.
      return;
    }
    mediaRecorder.stop(); // Stop the recording. 
    mediaRecorder.stream.getTracks().forEach((track) => track.stop()); // Stop all tracks in the MediaStream to release the microphone and free up resources.
    setIsRecording(false);
  };


    useEffect(() => { // This effect sets up event listeners for the "keydown" and "keyup" events on the window object. It listens for the "V" key to start and stop recording.
      const handleKeyDown = (event: KeyboardEvent) => {
        if (isLoading) return;
        const target = event.target as HTMLElement;
        if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT"
          ) {
            return;
          }

        if (event.key.toLowerCase() !== "v") return;
        // Ignore repeated keydown events while V is held
        if (event.repeat) return;
        // Start a 300ms timer
        vHoldTimerRef.current = window.setTimeout(() => {
          startRecording();
          // Timer has finished
          vHoldTimerRef.current = null;
        }, 300);
      };
      
      const handleKeyUp = (event: KeyboardEvent) => {
        if (isLoading) return;
        const target = event.target as HTMLElement;
        if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT"
          ) {
            return;
          }

        if (event.key.toLowerCase() !== "v") return;
        // If the 300ms timer hasn't finished yet,
        // cancel it and DON'T record
        if (vHoldTimerRef.current !== null) {
          clearTimeout(vHoldTimerRef.current);
          vHoldTimerRef.current = null;
          return;
        }
        // Otherwise recording already started, so stop it
        stopRecording();
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }, [isLoading]);

    const copyCleanedTranscript = async () => {
      if (!cleanedTranscript) return;

      try {
        await navigator.clipboard.writeText(cleanedTranscript);
      } catch (error) {
        console.error("Failed to copy transcript:", error);
      }
    };

  return (
    <main className="app">
      <div className="container">
        <header className="header">
          <h1>Super AI Transcript</h1>
          <p>Record audio or upload a file to transcribe with AI</p>
        </header>

        <div className="input-grid">
          
          <section className={`card record-section ${
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
              disabled={isLoading || inputSource === "upload" || inputSource === "text"}
              >
                {isRecording ? (<RecordingWave />) : (<Mic size={28} />)}
                <span>{isRecording ? "Stop Recording" : "Start Recording"}</span>
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


          <section className={`card upload-section
              ${isDragging ? "dragging" : ""}
              ${inputSource === "upload" ? "has-file" : ""}
              ${
                inputSource === "record" || inputSource === "text"
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
              if (!audioFile && (e.key === "Enter" || e.key === " ")) {
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
                const file = e.target.files?.[0]; // e.target refers to the input element, and files is a FileList containing the selected files. The code retrieves the first file from this list.
                handleAudioFile(file);
                e.target.value = "";            // Allows selecting the same file again later
              }}
            />

            {inputSource === "upload" && audioFile ? (
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
                  {isDragging ? "Drop Audio File Here" : "Choose an audio file"}
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


          <section className={`card transcript-section ${
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
          </section>

        </div>


        <section className="card settings-section">
          <div className="card-title">
            <Settings className="blue-icon" size={28} />
            <h2>Settings</h2>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={cleanWithLLM}
              onChange={(e) => setCleanWithLLM(e.target.checked)}
              disabled={isLoading}
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

            <select
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={isLoading || !cleanWithLLM}
            >
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


        <section className="process-section">
          {isLoading ? (
            <div className="processing-indicator">
              <LoaderCircle
                size={32}
                className="loading-icon"
              />

              <span>Processing...</span>
            </div>
          ) : (
            <button
              className="process-button main-process-button"
              onClick={() => setIsLoading(true)}
              disabled={
                !audioFile &&
                !transcriptText.trim()
              }
            >
              Process
            </button>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
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

            <button
              className="collapse-button"
              onClick={() => setShowOriginal((prev) => !prev)}
            >
              <ChevronUp size={24} className={`collapse-icon ${showOriginal ? "" : "collapsed"}`}/>
            </button>
          </div>
          {showOriginal && (
            <div className="result-box">
              {transcriptText || "Original transcription will appear here..."}
            </div>
          )}
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
            {cleanedTranscript || "Cleaned transcription will appear here..."}
          </div>

          <button
            className="copy-button"
            onClick={copyCleanedTranscript}
            disabled={!cleanedTranscript.trim()}
          >
            <Copy size={20} />
            <span>Copy</span>
          </button>
        </section>
      </div>
    </main>
  );
}

export default App;