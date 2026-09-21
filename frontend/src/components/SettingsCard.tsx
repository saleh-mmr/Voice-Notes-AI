import { Settings, Sparkles } from "lucide-react";
import type { PromptType } from "../types/api";

type SettingsCardProps = {
  cleanWithLLM: boolean;
  systemPrompt: PromptType;
  isLoading: boolean;
  setCleanWithLLM: (value: boolean) => void;
  setSystemPrompt: (value: PromptType) => void;
};

function SettingsCard({
  cleanWithLLM,
  systemPrompt,
  isLoading,
  setCleanWithLLM,
  setSystemPrompt,
}: SettingsCardProps) {
  return (
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
          onChange={(e) =>
            setSystemPrompt(
              e.target.value as PromptType
            )
          }
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
  );
}

export default SettingsCard;