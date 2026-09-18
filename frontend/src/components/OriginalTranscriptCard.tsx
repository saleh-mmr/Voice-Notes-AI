import { ChevronUp, FileText } from "lucide-react";

type OriginalTranscriptCardProps = {
  transcriptText: string;
  showOriginal: boolean;
  setShowOriginal: (value: boolean) => void;
};

function OriginalTranscriptCard({
  transcriptText,
  showOriginal,
  setShowOriginal,
}: OriginalTranscriptCardProps) {
  return (
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
          onClick={() => setShowOriginal(!showOriginal)}
        >
          <ChevronUp
            size={24}
            className={`collapse-icon ${
              showOriginal ? "" : "collapsed"
            }`}
          />
        </button>
      </div>

      {showOriginal && (
        <div className="result-box">
          {transcriptText ||
            "Original transcription will appear here..."}
        </div>
      )}
    </section>
  );
}

export default OriginalTranscriptCard;