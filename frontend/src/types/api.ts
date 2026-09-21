export type ProcessSource = "text" | "audio";

export type PromptType = "default" | "formal" | "short";

export type AudioMetadata = {
  filename: string;
  content_type: string | null;
};

export type ProcessResponse = {
  source: ProcessSource;
  original_text: string;
  cleaned_text: string;
  clean_with_llm: boolean;
  system_prompt: PromptType;
  audio: AudioMetadata | null;
};

export type TextProcessRequest = {
  text: string;
  clean_with_llm: boolean;
  system_prompt: PromptType;
};

export type ApiErrorResponse = {
  detail?: string;
  message?: string;
};