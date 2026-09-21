import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";

import RecordVoiceCard from "./components/RecordVoiceCard";
import UploadAudioCard from "./components/UploadAudioCard";
import TranscriptInputCard from "./components/TranscriptInputCard";
import SettingsCard from "./components/SettingsCard";
import ProcessSection from "./components/ProcessSection";
import OriginalTranscriptCard from "./components/OriginalTranscriptCard";
import CleanedTranscriptCard from "./components/CleanedTranscriptCard";
import {processAudio, processText,} from "./services/api";
import type { InputSource } from "./types";

import "./App.css";

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
  const [inputSource, setInputSource] = useState<InputSource>(null);
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
      // When the recording is stopped, we create a Blob from the collected audio chunks and create a File object to represent the recorded audio.
      // We also determine the file extension based on the MIME type of the recording.
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

      // This function is called when the user releases the "V" key.
      // It checks if the recording is in progress and stops it if necessary.
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

    // This function copies the cleaned transcript to the clipboard when the user clicks the "Copy" button.
    const copyCleanedTranscript = async () => {
      if (!cleanedTranscript) return;

      try {
        await navigator.clipboard.writeText(cleanedTranscript);
      } catch (error) {
        console.error("Failed to copy transcript:", error);
      }
    };


    // This function handles the processing of either text or audio based on the input source.
    // It sets the loading state, clears any previous errors, and calls the appropriate API function.
    const handleProcess = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (inputSource === "text") {
          const result = await processText({
            text: transcriptText,
            clean_with_llm: cleanWithLLM,
            system_prompt: systemPrompt,
          });

          setTranscriptText(result.original_text);
          setCleanedTranscript(result.cleaned_text);

          return;
        }

        if (
          (inputSource === "record" || inputSource === "upload") && audioFile
        ) {
          const result = await processAudio(
            audioFile,
            cleanWithLLM,
            systemPrompt
          );

          setTranscriptText(result.original_text);
          setCleanedTranscript(result.cleaned_text);

          return;
        }

        setError("Please provide audio or transcript text first.");
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Something went wrong while processing.");
        }
      } finally {
        setIsLoading(false);
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

          <RecordVoiceCard
            isRecording={isRecording}
            isLoading={isLoading}
            inputSource={inputSource}
            audioFile={audioFile}
            audioUrl={audioUrl}
            startRecording={startRecording}
            stopRecording={stopRecording}
            removeAudioFile={removeAudioFile}
          />


          <UploadAudioCard
            isDragging={isDragging}
            inputSource={inputSource}
            isRecording={isRecording}
            isLoading={isLoading}
            audioFile={audioFile}
            audioUrl={audioUrl}
            setIsDragging={setIsDragging}
            handleDrop={handleDrop}
            handleAudioFile={handleAudioFile}
            removeAudioFile={removeAudioFile}
          />

          <TranscriptInputCard
            transcriptText={transcriptText}
            inputSource={inputSource}
            isRecording={isRecording}
            isLoading={isLoading}
            setTranscriptText={setTranscriptText}
            setInputSource={setInputSource}
            setAudioFile={setAudioFile}
          />

        </div>


        <SettingsCard
          cleanWithLLM={cleanWithLLM}
          systemPrompt={systemPrompt}
          isLoading={isLoading}
          setCleanWithLLM={setCleanWithLLM}
          setSystemPrompt={setSystemPrompt}
        />


        <ProcessSection
          isLoading={isLoading}
          error={error}
          audioFile={audioFile}
          transcriptText={transcriptText}
          onProcess={handleProcess}
        />

        <OriginalTranscriptCard
          transcriptText={transcriptText}
          showOriginal={showOriginal}
          setShowOriginal={setShowOriginal}
        />

        <CleanedTranscriptCard
          cleanedTranscript={cleanedTranscript}
          onCopy={copyCleanedTranscript}
        />

      </div>
    </main>
  );
}

export default App;