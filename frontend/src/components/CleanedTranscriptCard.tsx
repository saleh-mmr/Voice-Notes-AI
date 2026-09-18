import { Copy, Sparkles } from "lucide-react";

type CleanedTranscriptCardProps = {
  cleanedTranscript: string;
  onCopy: () => void;
};

function CleanedTranscriptCard({
  cleanedTranscript,
  onCopy,
}: CleanedTranscriptCardProps) {
  return (
    <section className="card">
      <div className="card-title">
        <Sparkles
          className="blue-icon"
          size={30}
        />

        <h2>Cleaned Transcription</h2>
      </div>

      <div className="result-box cleaned-box">
        {cleanedTranscript ||
          "Cleaned transcription will appear here..."}
      </div>

      <button
        className="copy-button"
        onClick={onCopy}
        disabled={!cleanedTranscript.trim()}
      >
        <Copy size={20} />
        <span>Copy</span>
      </button>
    </section>
  );
}

export default CleanedTranscriptCard;