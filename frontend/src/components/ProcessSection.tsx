import { LoaderCircle } from "lucide-react";

type ProcessSectionProps = {
  isLoading: boolean;
  error: string | null;
  audioFile: File | null;
  transcriptText: string;
  onProcess: () => void;
};

function ProcessSection({
  isLoading,
  error,
  audioFile,
  transcriptText,
  onProcess,
}: ProcessSectionProps) {
  return (
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
          onClick={onProcess}
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
  );
}

export default ProcessSection;